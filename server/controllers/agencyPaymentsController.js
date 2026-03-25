import crypto from 'crypto';
import Razorpay from 'razorpay';
import { pool, query } from '../config/database.js';
import { invalidateAuthUserCache } from '../middleware/auth.js';
import { getCreditsForPlan } from '../utils/creditTiers.js';
import { ensureAgencySchemaReady } from '../utils/agencySchema.js';
import { bootstrapAgencyOwner } from './agencyController.js';

const AGENCY_PLAN_AMOUNT_PAISE = 159900;
const AGENCY_PLAN_AMOUNT_RUPEES = 1599;
const AGENCY_PLAN_NAME = 'SuiteGenie Agency';
const AGENCY_PLAN_DESCRIPTION = 'SuiteGenie Agency monthly subscription';
const BILLING_GRACE_DAYS = Math.max(0, Number.parseInt(process.env.AGENCY_BILLING_GRACE_DAYS || '3', 10));

const hasRazorpay = Boolean(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id_here'
);
const isDemoMode = !hasRazorpay;

function apiError(message, code = 'BAD_REQUEST', status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function cleanText(value, fallback = null) {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function signaturesMatch(expected, provided) {
  const expectedBuffer = Buffer.from(String(expected || ''), 'utf8');
  const providedBuffer = Buffer.from(String(provided || ''), 'utf8');
  if (expectedBuffer.length === 0 || expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function getRazorpayInstance() {
  if (!hasRazorpay) {
    throw apiError('Razorpay credentials are not configured', 'RAZORPAY_NOT_CONFIGURED', 503);
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function computeGraceUntil(periodEnd) {
  const end = periodEnd ? new Date(periodEnd) : new Date();
  if (Number.isNaN(end.getTime())) return null;
  end.setDate(end.getDate() + BILLING_GRACE_DAYS);
  return end.toISOString();
}

async function getLatestAgencySubscription(userId) {
  const result = await query(
    `SELECT *
     FROM agency_subscriptions
     WHERE owner_user_id = $1
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function ensureAgencyPlanId(rp) {
  const envPlanId = cleanText(process.env.RAZORPAY_AGENCY_PLAN_ID, null);
  if (envPlanId) return envPlanId;

  const existing = await query(
    `SELECT razorpay_plan_id
     FROM agency_subscriptions
     WHERE razorpay_plan_id IS NOT NULL
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`
  );
  const dbPlanId = cleanText(existing.rows[0]?.razorpay_plan_id, null);
  if (dbPlanId) return dbPlanId;

  const plan = await rp.plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name: AGENCY_PLAN_NAME,
      amount: AGENCY_PLAN_AMOUNT_PAISE,
      currency: 'INR',
      description: AGENCY_PLAN_DESCRIPTION,
    },
    notes: {
      suitegenie_plan: 'agency',
    },
  });

  return plan.id;
}

async function activateAgencySubscription({
  ownerUserId,
  subscriptionId,
  paymentId = null,
  paymentSignature = null,
  subscriptionStatus = 'active',
  currentStart = null,
  currentEnd = null,
  paymentStatus = 'captured',
  planId = null,
  metadata = {},
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `SELECT id, plan_type, credits_remaining, api_key_preference
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [ownerUserId]
    );
    if (userResult.rows.length === 0) throw apiError('User not found', 'USER_NOT_FOUND', 404);
    const user = userResult.rows[0];

    const currentCredits = Number(user.credits_remaining || 0) || 0;
    const apiPreference = user.api_key_preference || null;
    const targetCredits = getCreditsForPlan('agency', apiPreference, { defaultToPlatform: false });
    const nextCredits = apiPreference ? Math.max(currentCredits, targetCredits) : currentCredits;

    await client.query(
      `UPDATE users
       SET plan_type = 'agency',
           credits_remaining = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [nextCredits, ownerUserId]
    );

    await client.query(
      `INSERT INTO agency_subscriptions
       (agency_id, owner_user_id, razorpay_subscription_id, razorpay_plan_id, status, cancel_at_cycle_end, current_period_start, current_period_end, grace_until, last_payment_id, last_payment_at, last_payment_status, metadata, created_at, updated_at)
       VALUES
       (NULL, $1, $2, $3, $4, false, $5, $6, $7, $8, CASE WHEN $8 IS NULL THEN NULL ELSE NOW() END, $9, $10::jsonb, NOW(), NOW())
       ON CONFLICT (owner_user_id)
       DO UPDATE SET
         razorpay_subscription_id = EXCLUDED.razorpay_subscription_id,
         razorpay_plan_id = COALESCE(EXCLUDED.razorpay_plan_id, agency_subscriptions.razorpay_plan_id),
         status = EXCLUDED.status,
         cancel_at_cycle_end = EXCLUDED.cancel_at_cycle_end,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         grace_until = EXCLUDED.grace_until,
         last_payment_id = COALESCE(EXCLUDED.last_payment_id, agency_subscriptions.last_payment_id),
         last_payment_at = CASE WHEN EXCLUDED.last_payment_id IS NULL THEN agency_subscriptions.last_payment_at ELSE NOW() END,
         last_payment_status = COALESCE(EXCLUDED.last_payment_status, agency_subscriptions.last_payment_status),
         metadata = agency_subscriptions.metadata || EXCLUDED.metadata,
         updated_at = NOW()`,
      [
        ownerUserId,
        subscriptionId,
        planId,
        subscriptionStatus,
        currentStart,
        currentEnd,
        computeGraceUntil(currentEnd),
        paymentId,
        paymentStatus,
        JSON.stringify({
          ...metadata,
          paymentSignature: paymentSignature || null,
        }),
      ]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const agencyId = await bootstrapAgencyOwner(ownerUserId);
  if (agencyId) {
    await query(
      `UPDATE agency_subscriptions
       SET agency_id = $1, updated_at = NOW()
       WHERE owner_user_id = $2`,
      [agencyId, ownerUserId]
    );
  }

  invalidateAuthUserCache(ownerUserId);
  const latest = await getLatestAgencySubscription(ownerUserId);

  return {
    agencyId: agencyId || latest?.agency_id || null,
    subscription: latest,
  };
}

async function recordBillingEvent({ eventId, eventType, signature = null, payload = {}, processed = false }) {
  const result = await query(
    `INSERT INTO agency_billing_events (event_id, event_type, signature, payload, processed_at, created_at)
     VALUES ($1, $2, $3, $4::jsonb, CASE WHEN $5 THEN NOW() ELSE NULL END, NOW())
     ON CONFLICT (event_id) DO NOTHING
     RETURNING id`,
    [eventId, eventType, signature, JSON.stringify(payload || {}), processed]
  );
  return result.rows[0] || null;
}

const AgencyPaymentsController = {
  async subscribe(req, res) {
    try {
      await ensureAgencySchemaReady();

      const userId = req.user?.id;
      if (!userId) throw apiError('Authentication required', 'AUTH_REQUIRED', 401);

      const existing = await getLatestAgencySubscription(userId);
      const existingStatus = cleanText(existing?.status, '')?.toLowerCase();
      if (existing && ['active', 'authenticated', 'created', 'pending'].includes(existingStatus)) {
        return res.json({
          subscriptionId: existing.razorpay_subscription_id,
          amount: AGENCY_PLAN_AMOUNT_PAISE,
          currency: 'INR',
          planName: AGENCY_PLAN_NAME,
          existing: true,
          demo: isDemoMode,
          razorpayKey: process.env.RAZORPAY_KEY_ID || '',
        });
      }

      if (isDemoMode) {
        const subscriptionId = `demo_sub_${Date.now()}`;
        await query(
          `INSERT INTO agency_subscriptions
           (agency_id, owner_user_id, razorpay_subscription_id, razorpay_plan_id, status, metadata, created_at, updated_at)
           VALUES (NULL, $1, $2, $3, 'created', $4::jsonb, NOW(), NOW())
           ON CONFLICT (owner_user_id)
           DO UPDATE SET
             razorpay_subscription_id = EXCLUDED.razorpay_subscription_id,
             razorpay_plan_id = EXCLUDED.razorpay_plan_id,
             status = EXCLUDED.status,
             metadata = agency_subscriptions.metadata || EXCLUDED.metadata,
             updated_at = NOW()`,
          [userId, subscriptionId, 'demo_agency_plan', JSON.stringify({ demo: true })]
        );
        return res.json({
          subscriptionId,
          amount: AGENCY_PLAN_AMOUNT_PAISE,
          currency: 'INR',
          planName: AGENCY_PLAN_NAME,
          demo: true,
          message: 'Demo mode: simulated Agency subscription created.',
        });
      }

      const rp = getRazorpayInstance();
      const planId = await ensureAgencyPlanId(rp);
      const subscription = await rp.subscriptions.create({
        plan_id: planId,
        total_count: 120,
        customer_notify: 1,
        notes: {
          suitegenie_plan: 'agency',
          ownerUserId: String(userId),
        },
      });

      await query(
        `INSERT INTO agency_subscriptions
         (agency_id, owner_user_id, razorpay_subscription_id, razorpay_plan_id, status, metadata, created_at, updated_at)
         VALUES (NULL, $1, $2, $3, $4, $5::jsonb, NOW(), NOW())
         ON CONFLICT (owner_user_id)
         DO UPDATE SET
           razorpay_subscription_id = EXCLUDED.razorpay_subscription_id,
           razorpay_plan_id = EXCLUDED.razorpay_plan_id,
           status = EXCLUDED.status,
           metadata = agency_subscriptions.metadata || EXCLUDED.metadata,
           updated_at = NOW()`,
        [userId, subscription.id, planId, subscription.status || 'created', JSON.stringify(subscription.notes || {})]
      );

      return res.json({
        subscriptionId: subscription.id,
        amount: AGENCY_PLAN_AMOUNT_PAISE,
        currency: subscription.currency || 'INR',
        planName: AGENCY_PLAN_NAME,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        demo: false,
      });
    } catch (error) {
      console.error('[AgencyPaymentsController.subscribe] error:', error?.message || error);
      return res.status(error?.status || 500).json({
        error: error?.message || 'Failed to create Agency subscription',
        code: error?.code || 'AGENCY_SUBSCRIBE_ERROR',
      });
    }
  },

  async confirm(req, res) {
    try {
      await ensureAgencySchemaReady();

      const userId = req.user?.id;
      if (!userId) throw apiError('Authentication required', 'AUTH_REQUIRED', 401);

      const razorpaySubscriptionId = cleanText(
        req.body.razorpaySubscriptionId || req.body.razorpay_subscription_id,
        null
      );
      const razorpayPaymentId = cleanText(
        req.body.razorpayPaymentId || req.body.razorpay_payment_id,
        null
      );
      const razorpaySignature = cleanText(
        req.body.razorpaySignature || req.body.razorpay_signature,
        null
      );

      if (!razorpaySubscriptionId) {
        throw apiError('Subscription ID is required', 'SUBSCRIPTION_ID_REQUIRED', 400);
      }

      if (isDemoMode) {
        const activated = await activateAgencySubscription({
          ownerUserId: userId,
          subscriptionId: razorpaySubscriptionId,
          paymentId: razorpayPaymentId || `demo_payment_${Date.now()}`,
          paymentSignature: razorpaySignature || 'demo_signature',
          subscriptionStatus: 'active',
          currentStart: new Date().toISOString(),
          currentEnd: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          paymentStatus: 'captured',
          planId: 'demo_agency_plan',
          metadata: { demo: true, confirmedManually: true },
        });

        return res.json({
          success: true,
          message: 'Agency plan activated successfully',
          newPlan: 'agency',
          agencyId: activated.agencyId,
          subscription: activated.subscription,
          demo: true,
        });
      }

      if (!razorpayPaymentId || !razorpaySignature) {
        throw apiError('Payment ID and signature are required', 'PAYMENT_CONFIRMATION_REQUIRED', 400);
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
        .digest('hex');
      if (!signaturesMatch(expectedSignature, razorpaySignature)) {
        throw apiError('Invalid payment signature', 'INVALID_SIGNATURE', 400);
      }

      const rp = getRazorpayInstance();
      const [subscription, payment] = await Promise.all([
        rp.subscriptions.fetch(razorpaySubscriptionId),
        rp.payments.fetch(razorpayPaymentId),
      ]);

      const ownerFromNotes = cleanText(subscription?.notes?.ownerUserId, null);
      if (ownerFromNotes && ownerFromNotes !== String(userId)) {
        throw apiError('Subscription does not belong to this account', 'SUBSCRIPTION_OWNERSHIP_MISMATCH', 403);
      }

      const activated = await activateAgencySubscription({
        ownerUserId: userId,
        subscriptionId: razorpaySubscriptionId,
        paymentId: razorpayPaymentId,
        paymentSignature: razorpaySignature,
        subscriptionStatus: cleanText(subscription?.status, 'active') || 'active',
        currentStart: subscription?.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
        currentEnd: subscription?.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
        paymentStatus: cleanText(payment?.status, 'captured'),
        planId: cleanText(subscription?.plan_id, null),
        metadata: {
          confirmedAt: new Date().toISOString(),
          paymentEntity: payment || null,
        },
      });

      return res.json({
        success: true,
        message: 'Agency plan activated successfully',
        newPlan: 'agency',
        agencyId: activated.agencyId,
        subscription: activated.subscription,
      });
    } catch (error) {
      console.error('[AgencyPaymentsController.confirm] error:', error?.message || error);
      return res.status(error?.status || 500).json({
        error: error?.message || 'Failed to confirm Agency subscription',
        code: error?.code || 'AGENCY_CONFIRM_ERROR',
      });
    }
  },

  async status(req, res) {
    try {
      await ensureAgencySchemaReady();
      const userId = req.user?.id;
      if (!userId) throw apiError('Authentication required', 'AUTH_REQUIRED', 401);

      const subscription = await getLatestAgencySubscription(userId);
      return res.json({
        subscription,
        billingMode: 'recurring',
        amountInRupees: AGENCY_PLAN_AMOUNT_RUPEES,
      });
    } catch (error) {
      return res.status(error?.status || 500).json({
        error: error?.message || 'Failed to fetch Agency billing status',
        code: error?.code || 'AGENCY_STATUS_ERROR',
      });
    }
  },

  async webhook(req, res) {
    try {
      await ensureAgencySchemaReady();

      const webhookSecret = cleanText(process.env.RAZORPAY_WEBHOOK_SECRET, null);
      const signature = cleanText(req.headers['x-razorpay-signature'], null);
      const rawBody = String(req.rawBody || '');
      const payload = req.body || {};
      const eventId = cleanText(
        payload?.id,
        rawBody
          ? `bodyhash_${crypto.createHash('sha256').update(rawBody).digest('hex')}`
          : `event_${Date.now()}`
      );
      const eventType = cleanText(payload?.event, 'unknown');

      const alreadyProcessed = await query(
        `SELECT id, processed_at
         FROM agency_billing_events
         WHERE event_id = $1
         LIMIT 1`,
        [eventId]
      );
      if (alreadyProcessed.rows.length > 0) {
        return res.json({ ok: true, duplicate: true });
      }

      if (webhookSecret && signature) {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');
        if (!signaturesMatch(expectedSignature, signature)) {
          throw apiError('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE', 400);
        }
      }

      await recordBillingEvent({
        eventId,
        eventType,
        signature,
        payload,
        processed: false,
      });

      const subscriptionEntity =
        payload?.payload?.subscription?.entity ||
        payload?.payload?.payment?.entity?.notes?.subscription_id
          ? payload?.payload?.subscription?.entity || null
          : null;
      const paymentEntity = payload?.payload?.payment?.entity || null;
      const subscriptionId = cleanText(
        subscriptionEntity?.id ||
        paymentEntity?.subscription_id,
        null
      );

      if (subscriptionId) {
        const subscriptionRow = await query(
          `SELECT *
           FROM agency_subscriptions
           WHERE razorpay_subscription_id = $1
           LIMIT 1`,
          [subscriptionId]
        );

        if (subscriptionRow.rows.length > 0) {
          const current = subscriptionRow.rows[0];
          const nextStatus = cleanText(subscriptionEntity?.status, eventType.includes('cancel') ? 'cancelled' : current.status);
          const nextCurrentStart = subscriptionEntity?.current_start
            ? new Date(subscriptionEntity.current_start * 1000).toISOString()
            : current.current_period_start;
          const nextCurrentEnd = subscriptionEntity?.current_end
            ? new Date(subscriptionEntity.current_end * 1000).toISOString()
            : current.current_period_end;

          await query(
            `UPDATE agency_subscriptions
             SET status = $1,
                 cancel_at_cycle_end = $2,
                 current_period_start = $3,
                 current_period_end = $4,
                 grace_until = $5,
                 last_payment_id = COALESCE($6, last_payment_id),
                 last_payment_at = CASE WHEN $6 IS NULL THEN last_payment_at ELSE NOW() END,
                 last_payment_status = COALESCE($7, last_payment_status),
                 metadata = metadata || $8::jsonb,
                 updated_at = NOW()
             WHERE id = $9`,
            [
              nextStatus,
              Boolean(subscriptionEntity?.remaining_count === 0 || subscriptionEntity?.cancel_at_cycle_end),
              nextCurrentStart,
              nextCurrentEnd,
              computeGraceUntil(nextCurrentEnd),
              cleanText(paymentEntity?.id, null),
              cleanText(paymentEntity?.status, null),
              JSON.stringify({ latestWebhookEvent: eventType }),
              current.id,
            ]
          );

          if (paymentEntity?.status === 'captured' && current.owner_user_id) {
            await activateAgencySubscription({
              ownerUserId: current.owner_user_id,
              subscriptionId,
              paymentId: paymentEntity.id,
              subscriptionStatus: nextStatus,
              currentStart: nextCurrentStart,
              currentEnd: nextCurrentEnd,
              paymentStatus: cleanText(paymentEntity.status, 'captured'),
              planId: cleanText(subscriptionEntity?.plan_id, current.razorpay_plan_id),
              metadata: { latestWebhookEvent: eventType },
            });
          } else {
            invalidateAuthUserCache(current.owner_user_id);
          }
        }
      }

      await query(
        `UPDATE agency_billing_events
         SET processed_at = NOW()
         WHERE event_id = $1`,
        [eventId]
      );

      return res.json({ ok: true });
    } catch (error) {
      console.error('[AgencyPaymentsController.webhook] error:', error?.message || error);
      return res.status(error?.status || 500).json({
        error: error?.message || 'Failed to process Agency billing webhook',
        code: error?.code || 'AGENCY_WEBHOOK_ERROR',
      });
    }
  },
};

export default AgencyPaymentsController;
