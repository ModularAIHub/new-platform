import crypto from 'crypto';
import Razorpay from 'razorpay';
import { pool, query } from '../config/database.js';
import { invalidateAuthUserCache } from '../middleware/auth.js';
import { getCreditsForPlan } from '../utils/creditTiers.js';
import { ensureAgencySchemaReady } from '../utils/agencySchema.js';
import { bootstrapAgencyOwner } from './agencyController.js';

const AGENCY_PLAN_AMOUNT_PAISE = 249900;
const AGENCY_PLAN_AMOUNT_RUPEES = 2499;
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

function toIsoFromUnixSeconds(value, fallback = null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return new Date(parsed * 1000).toISOString();
}

function normalizeBillingStatus(value) {
  return cleanText(value, 'inactive')?.toLowerCase() || 'inactive';
}

function isSubscriptionActiveLike(status) {
  return ['active', 'authenticated', 'created', 'pending'].includes(normalizeBillingStatus(status));
}

function canCancelSubscription(subscription) {
  if (!subscription) return false;
  const status = normalizeBillingStatus(subscription.status);
  if (!isSubscriptionActiveLike(status)) return false;
  return !Boolean(subscription.cancel_at_cycle_end);
}

function canResumeSubscription(subscription) {
  if (!subscription) return false;
  const status = normalizeBillingStatus(subscription.status);
  if (!isSubscriptionActiveLike(status)) return false;
  return Boolean(subscription.cancel_at_cycle_end);
}

function isLikelyRazorpaySubscriptionId(value) {
  const normalized = cleanText(value, '');
  return /^sub_[A-Za-z0-9]+$/.test(normalized) && normalized.length <= 18;
}

function mapInvoiceItem(invoice = {}) {
  return {
    id: cleanText(invoice.id, null),
    number: cleanText(invoice.invoice_number || invoice.number, null),
    amount: Number(invoice.amount || 0),
    currency: cleanText(invoice.currency, 'INR'),
    status: cleanText(invoice.status, 'unknown'),
    issuedAt: invoice.issued_at ? toIsoFromUnixSeconds(invoice.issued_at, null) : cleanText(invoice.issued_at, null),
    paidAt: invoice.paid_at ? toIsoFromUnixSeconds(invoice.paid_at, null) : cleanText(invoice.paid_at, null),
    dueAt: invoice.due_date ? toIsoFromUnixSeconds(invoice.due_date, null) : cleanText(invoice.due_at, null),
    hostedUrl: cleanText(invoice.short_url || invoice.hosted_invoice_url || invoice.invoice_url, null),
    paymentId: cleanText(invoice.payment_id || invoice.transaction_id, null),
    raw: invoice,
  };
}

async function buildFallbackInvoices(subscription) {
  if (!subscription) return [];
  const invoices = [];
  const seen = new Set();

  if (subscription.last_payment_id) {
    invoices.push({
      id: `local_${subscription.last_payment_id}`,
      number: null,
      amount: AGENCY_PLAN_AMOUNT_PAISE,
      currency: 'INR',
      status: cleanText(subscription.last_payment_status, 'captured'),
      issuedAt: cleanText(subscription.last_payment_at, subscription.updated_at || subscription.created_at),
      paidAt: cleanText(subscription.last_payment_at, null),
      dueAt: null,
      hostedUrl: null,
      paymentId: subscription.last_payment_id,
      source: 'subscription',
    });
    seen.add(subscription.last_payment_id);
  }

  const events = await query(
    `SELECT event_type, payload, created_at
     FROM agency_billing_events
     ORDER BY created_at DESC
     LIMIT 250`
  );

  for (const row of events.rows) {
    const payment = row?.payload?.payload?.payment?.entity || null;
    if (!payment) continue;
    const paymentId = cleanText(payment.id, null);
    if (!paymentId || seen.has(paymentId)) continue;
    const paymentSubscriptionId = cleanText(payment.subscription_id, null);
    if (paymentSubscriptionId && paymentSubscriptionId !== subscription.razorpay_subscription_id) continue;

    seen.add(paymentId);
    invoices.push({
      id: `event_${paymentId}`,
      number: null,
      amount: Number(payment.amount || AGENCY_PLAN_AMOUNT_PAISE),
      currency: cleanText(payment.currency, 'INR'),
      status: cleanText(payment.status, 'captured'),
      issuedAt: payment.created_at ? toIsoFromUnixSeconds(payment.created_at, row.created_at) : row.created_at,
      paidAt: payment.created_at ? toIsoFromUnixSeconds(payment.created_at, row.created_at) : row.created_at,
      dueAt: null,
      hostedUrl: cleanText(payment.invoice_url || payment.short_url, null),
      paymentId,
      source: 'billing_event',
    });
  }

  return invoices;
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

    const agencyId = await bootstrapAgencyOwner(ownerUserId, { client });

    await client.query(
      `INSERT INTO agency_subscriptions
       (agency_id, owner_user_id, razorpay_subscription_id, razorpay_plan_id, status, cancel_at_cycle_end, current_period_start, current_period_end, grace_until, last_payment_id, last_payment_at, last_payment_status, metadata, created_at, updated_at)
       VALUES
       ($1, $2, $3, $4, $5, false, $6, $7, $8, $9, CASE WHEN $9 IS NULL THEN NULL ELSE NOW() END, $10, $11::jsonb, NOW(), NOW())
       ON CONFLICT (owner_user_id)
       DO UPDATE SET
         agency_id = COALESCE(EXCLUDED.agency_id, agency_subscriptions.agency_id),
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
        agencyId,
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

  invalidateAuthUserCache(ownerUserId);
  const latest = await getLatestAgencySubscription(ownerUserId);

  return {
    agencyId: latest?.agency_id || null,
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
        actions: {
          canCancel: canCancelSubscription(subscription),
          canResume: canResumeSubscription(subscription),
        },
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

  async cancel(req, res) {
    try {
      await ensureAgencySchemaReady();

      const userId = req.user?.id;
      if (!userId) throw apiError('Authentication required', 'AUTH_REQUIRED', 401);

      const current = await getLatestAgencySubscription(userId);
      if (!current) throw apiError('No Agency subscription found', 'AGENCY_SUBSCRIPTION_NOT_FOUND', 404);
      if (!canCancelSubscription(current)) {
        throw apiError('Subscription is not eligible for cancellation', 'AGENCY_CANCEL_NOT_ALLOWED', 400);
      }

      const subscriptionId = cleanText(current.razorpay_subscription_id, null);
      if (!subscriptionId) throw apiError('Missing subscription id', 'AGENCY_SUBSCRIPTION_ID_MISSING', 400);

      let remoteSubscription = null;
      if (!isDemoMode && isLikelyRazorpaySubscriptionId(subscriptionId)) {
        const rp = getRazorpayInstance();
        try {
          remoteSubscription = await rp.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 1 });
        } catch (error) {
          if (error?.statusCode === 404) {
            remoteSubscription = null;
          } else {
            remoteSubscription = await rp.subscriptions.cancel(subscriptionId, true);
          }
        }
      }

      const nextStatus = cleanText(remoteSubscription?.status, current.status || 'active');
      const nextCurrentEnd = remoteSubscription?.current_end
        ? new Date(remoteSubscription.current_end * 1000).toISOString()
        : current.current_period_end;

      await query(
        `UPDATE agency_subscriptions
         SET status = $1,
             cancel_at_cycle_end = true,
             current_period_end = COALESCE($2, current_period_end),
             grace_until = $3,
             metadata = metadata || $4::jsonb,
             updated_at = NOW()
         WHERE id = $5`,
        [
          nextStatus,
          nextCurrentEnd,
          computeGraceUntil(nextCurrentEnd),
          JSON.stringify({
            cancelRequestedAt: new Date().toISOString(),
            cancelMode: isDemoMode ? 'demo' : 'razorpay',
          }),
          current.id,
        ]
      );

      invalidateAuthUserCache(userId);
      const updated = await getLatestAgencySubscription(userId);
      return res.json({
        success: true,
        message: 'Agency subscription will cancel at cycle end',
        subscription: updated,
      });
    } catch (error) {
      console.error('[AgencyPaymentsController.cancel] error:', error?.message || error);
      return res.status(error?.status || 500).json({
        error: error?.message || 'Failed to cancel Agency subscription',
        code: error?.code || 'AGENCY_CANCEL_ERROR',
      });
    }
  },

  async resume(req, res) {
    try {
      await ensureAgencySchemaReady();

      const userId = req.user?.id;
      if (!userId) throw apiError('Authentication required', 'AUTH_REQUIRED', 401);

      const current = await getLatestAgencySubscription(userId);
      if (!current) throw apiError('No Agency subscription found', 'AGENCY_SUBSCRIPTION_NOT_FOUND', 404);
      if (!canResumeSubscription(current)) {
        throw apiError('Subscription is not eligible for resume', 'AGENCY_RESUME_NOT_ALLOWED', 400);
      }

      const subscriptionId = cleanText(current.razorpay_subscription_id, null);
      if (!subscriptionId) throw apiError('Missing subscription id', 'AGENCY_SUBSCRIPTION_ID_MISSING', 400);

      let remoteStatus = cleanText(current.status, 'active');
      if (!isDemoMode && isLikelyRazorpaySubscriptionId(subscriptionId)) {
        const rp = getRazorpayInstance();
        try {
          const resumed = await rp.subscriptions.resume(subscriptionId, { resume_at: 'now' });
          remoteStatus = cleanText(resumed?.status, remoteStatus);
        } catch (error) {
          // Some Razorpay subscription states don't support resume via API.
          // Keep local access active and clear cycle-end cancellation in our record.
          remoteStatus = cleanText(current.status, 'active');
        }
      }

      await query(
        `UPDATE agency_subscriptions
         SET status = $1,
             cancel_at_cycle_end = false,
             metadata = metadata || $2::jsonb,
             updated_at = NOW()
         WHERE id = $3`,
        [
          remoteStatus,
          JSON.stringify({
            resumeRequestedAt: new Date().toISOString(),
            resumeMode: isDemoMode ? 'demo' : 'best_effort',
          }),
          current.id,
        ]
      );

      invalidateAuthUserCache(userId);
      const updated = await getLatestAgencySubscription(userId);
      return res.json({
        success: true,
        message: 'Agency subscription resumed',
        subscription: updated,
      });
    } catch (error) {
      console.error('[AgencyPaymentsController.resume] error:', error?.message || error);
      return res.status(error?.status || 500).json({
        error: error?.message || 'Failed to resume Agency subscription',
        code: error?.code || 'AGENCY_RESUME_ERROR',
      });
    }
  },

  async invoices(req, res) {
    try {
      await ensureAgencySchemaReady();
      const userId = req.user?.id;
      if (!userId) throw apiError('Authentication required', 'AUTH_REQUIRED', 401);

      const subscription = await getLatestAgencySubscription(userId);
      if (!subscription) {
        return res.json({ invoices: [], source: 'none' });
      }

      const subscriptionId = cleanText(subscription.razorpay_subscription_id, null);
      if (!subscriptionId) {
        const fallback = await buildFallbackInvoices(subscription);
        return res.json({ invoices: fallback, source: 'fallback' });
      }

      if (!isDemoMode && isLikelyRazorpaySubscriptionId(subscriptionId)) {
        try {
          const rp = getRazorpayInstance();
          const response = await rp.invoices.all({
            subscription_id: subscriptionId,
            count: 30,
          });
          const items = Array.isArray(response?.items) ? response.items : [];
          const invoices = items.map((item) => mapInvoiceItem(item));
          if (invoices.length > 0) {
            return res.json({ invoices, source: 'razorpay' });
          }
        } catch (error) {
          console.warn('[AgencyPaymentsController.invoices] Falling back from Razorpay invoices:', error?.message || error);
        }
      }

      const fallback = await buildFallbackInvoices(subscription);
      return res.json({ invoices: fallback, source: 'fallback' });
    } catch (error) {
      console.error('[AgencyPaymentsController.invoices] error:', error?.message || error);
      return res.status(error?.status || 500).json({
        error: error?.message || 'Failed to fetch Agency invoices',
        code: error?.code || 'AGENCY_INVOICES_ERROR',
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
