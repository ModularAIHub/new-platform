import { query, pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getCreditsForPlan } from '../utils/creditTiers.js';
import { invalidateAuthUserCache } from '../middleware/auth.js';

const hasRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id_here');
const isDemoMode = !hasRazorpay;

function getRazorpayInstance() {
    if (!hasRazorpay) {
        throw new Error('Razorpay credentials not configured');
    }
    return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

const CREDIT_PACKAGES = {
    '100': { credits: 100, price: 199 },
    '250': { credits: 250, price: 399 },
    '500': { credits: 500, price: 699 }
};

const PLAN_PACKAGES = {
    pro: { price: 499, name: 'SuiteGenie Pro Plan' }
};

const AUTOMATION_ADDON_PACKAGES = {
    solo_automation: {
        price: 799,
        name: 'Standalone Automation Add-on',
        description: 'Adds recurring automation for solo Pro workflows for 30 days.',
        category: 'automation',
        scopeType: 'user',
        durationDays: 30,
        eligiblePlans: ['pro', 'enterprise']
    },
    agency_automation: {
        price: 2999,
        name: 'Agency Automation Add-on',
        description: 'Adds deeper automation across Agency workspaces for 30 days.',
        category: 'automation',
        scopeType: 'agency',
        durationDays: 30,
        eligiblePlans: ['agency', 'enterprise']
    }
};

const AGENCY_EXPANSION_ADDON_PACKAGES = {
    agency_extra_seat: {
        price: 249,
        name: 'Agency Extra Seat',
        description: 'Permanently adds 1 more seat to your Agency plan.',
        category: 'agency_expansion',
        scopeType: 'agency',
        persistent: true,
        eligiblePlans: ['agency', 'enterprise'],
        limitField: 'seat_limit',
        incrementBy: 1
    },
    agency_extra_workspace: {
        price: 349,
        name: 'Agency Extra Workspace',
        description: 'Permanently adds 1 more client workspace to your Agency plan.',
        category: 'agency_expansion',
        scopeType: 'agency',
        persistent: true,
        eligiblePlans: ['agency', 'enterprise'],
        limitField: 'workspace_limit',
        incrementBy: 1
    },
    agency_white_label: {
        price: 999,
        name: 'Agency White-label',
        description: 'Unlocks white-label controls for client-facing Agency experiences.',
        category: 'agency_expansion',
        scopeType: 'agency',
        persistent: true,
        eligiblePlans: ['agency', 'enterprise'],
        featureFlag: 'white_label_enabled'
    },
    agency_reporting_export: {
        price: 699,
        name: 'Agency Reporting Export',
        description: 'Unlocks premium reporting export controls for Agency delivery.',
        category: 'agency_expansion',
        scopeType: 'agency',
        persistent: true,
        eligiblePlans: ['agency', 'enterprise'],
        featureFlag: 'reporting_export_enabled'
    },
    agency_media_library: {
        price: 499,
        name: 'Agency Media Library',
        description: 'Unlocks the shared Agency media library with 25 GB included storage.',
        category: 'agency_expansion',
        scopeType: 'agency',
        persistent: true,
        eligiblePlans: ['agency', 'enterprise'],
        featureFlag: 'media_library_enabled',
        storageGb: 25
    }
};

const ADDON_PACKAGES = {
    ...AUTOMATION_ADDON_PACKAGES,
    ...AGENCY_EXPANSION_ADDON_PACKAGES
};

const isValidNumber = (value) => Number.isFinite(Number(value));

const normalizePlanType = (value) => {
    const planType = String(value || '').trim().toLowerCase();
    return planType || 'free';
};

const compareSignatures = (expected, provided) => {
    const expectedBuffer = Buffer.from(String(expected || ''), 'utf8');
    const providedBuffer = Buffer.from(String(provided || ''), 'utf8');

    if (expectedBuffer.length === 0 || expectedBuffer.length !== providedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

let hasAgencyAccountAddonColumnsCache = null;
let hasAutomationAddonsTableCache = null;

async function hasAgencyAccountAddonColumns(db = query) {
    if (typeof hasAgencyAccountAddonColumnsCache === 'boolean') {
        return hasAgencyAccountAddonColumnsCache;
    }

    const result = await db(
        `SELECT COUNT(*)::int AS count
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'agency_accounts'
           AND column_name IN (
             'white_label_enabled',
             'reporting_export_enabled',
             'media_library_enabled',
             'media_library_storage_gb'
           )`,
        []
    );

    hasAgencyAccountAddonColumnsCache = Number(result.rows?.[0]?.count || 0) === 4;
    return hasAgencyAccountAddonColumnsCache;
}

async function hasAutomationAddonsTable(db = query) {
    if (typeof hasAutomationAddonsTableCache === 'boolean') {
        return hasAutomationAddonsTableCache;
    }

    const result = await db(
        `SELECT to_regclass('public.automation_addons') IS NOT NULL AS exists`,
        []
    );

    hasAutomationAddonsTableCache = Boolean(result.rows?.[0]?.exists);
    return hasAutomationAddonsTableCache;
}

function getAddonPackage(pkg) {
    return ADDON_PACKAGES[String(pkg || '').trim()];
}

async function getAddonContext(userId, pkg, db = query) {
    const addonPackage = getAddonPackage(pkg);
    if (!addonPackage) {
        return { error: 'Invalid add-on package', code: 'INVALID_ADDON_PACKAGE', status: 400 };
    }

    const userResult = await db('SELECT plan_type FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (!userResult.rows?.length) {
        return { error: 'User not found', code: 'USER_NOT_FOUND', status: 404 };
    }

    const planType = normalizePlanType(userResult.rows[0].plan_type);
    if (!addonPackage.eligiblePlans.includes(planType)) {
        return {
            error: addonPackage.scopeType === 'agency'
                ? (addonPackage.category === 'automation'
                    ? 'Agency Automation requires an active Agency base plan.'
                    : 'This Agency expansion pack requires an active Agency base plan.')
                : 'Standalone Automation requires an active Pro base plan.',
            code: 'ADDON_PLAN_MISMATCH',
            status: 400
        };
    }

    let agency = null;
    if (addonPackage.scopeType === 'agency') {
        const supportsAddonColumns = await hasAgencyAccountAddonColumns(db);
        const agencyResult = await db(
            supportsAddonColumns
                ? `SELECT
                    id,
                    name,
                    seat_limit,
                    workspace_limit,
                    white_label_enabled,
                    reporting_export_enabled,
                    media_library_enabled,
                    media_library_storage_gb
                 FROM agency_accounts
                 WHERE owner_id = $1
                 LIMIT 1`
                : `SELECT
                    id,
                    name,
                    seat_limit,
                    workspace_limit,
                    false AS white_label_enabled,
                    false AS reporting_export_enabled,
                    false AS media_library_enabled,
                    0 AS media_library_storage_gb
                 FROM agency_accounts
                 WHERE owner_id = $1
                 LIMIT 1`,
            [userId]
        );
        if (!agencyResult.rows?.length) {
            return {
                error: 'Agency account not found for this user.',
                code: 'AGENCY_ACCOUNT_NOT_FOUND',
                status: 404
            };
        }
        agency = agencyResult.rows[0];

        if (addonPackage.featureFlag && agency[addonPackage.featureFlag]) {
            return {
                error: `${addonPackage.name} is already active for this agency.`,
                code: 'ADDON_ALREADY_ACTIVE',
                status: 409
            };
        }
    }

    return { addonPackage, planType, agency };
}

const buildOrderConfig = ({ type, pkg, userId, addonContext = null }) => {
    if (type === 'credits') {
        const creditPackage = CREDIT_PACKAGES[pkg];
        if (!creditPackage) return { error: 'Invalid credit package', code: 'INVALID_CREDIT_PACKAGE' };
        return {
            amount: creditPackage.price * 100,
            currency: 'INR',
            description: `${creditPackage.credits} Credits Top-up`,
            notes: {
                type: 'credits',
                credits: String(creditPackage.credits),
                package: String(pkg),
                userId: String(userId)
            }
        };
    }

    if (type === 'plan') {
        const planPackage = PLAN_PACKAGES[pkg];
        if (!planPackage) return { error: 'Invalid plan package', code: 'INVALID_PLAN_PACKAGE' };
        return {
            amount: planPackage.price * 100,
            currency: 'INR',
            description: `${planPackage.name} Subscription`,
            notes: {
                type: 'plan',
                plan: String(pkg),
                name: planPackage.name,
                userId: String(userId)
            }
        };
    }

    if (type === 'addon') {
        const addonPackage = addonContext?.addonPackage || getAddonPackage(pkg);
        if (!addonPackage) return { error: 'Invalid add-on package', code: 'INVALID_ADDON_PACKAGE' };
        return {
            amount: addonPackage.price * 100,
            currency: 'INR',
            description: `${addonPackage.name} Activation`,
            notes: {
                type: 'addon',
                package: String(pkg),
                name: addonPackage.name,
                category: addonPackage.category,
                scopeType: addonPackage.scopeType,
                durationDays: addonPackage.durationDays ? String(addonPackage.durationDays) : '',
                persistent: addonPackage.persistent ? 'true' : 'false',
                userId: String(userId),
                agencyId: addonContext?.agency?.id ? String(addonContext.agency.id) : ''
            }
        };
    }

    return { error: 'Invalid order type', code: 'INVALID_ORDER_TYPE' };
};

async function activateAutomationAddon({
    client,
    userId,
    packageId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    costInRupees
}) {
    const addonContext = await getAddonContext(userId, packageId, client.query.bind(client));
    if (addonContext.error) {
        return addonContext;
    }

    const { addonPackage, agency } = addonContext;
    if (addonPackage.category !== 'automation') {
        return { error: 'Invalid automation add-on package', code: 'INVALID_ADDON_PACKAGE', status: 400 };
    }
    if (!(await hasAutomationAddonsTable(client.query.bind(client)))) {
        return {
            error: 'Automation add-ons are not available until the latest billing migration is applied.',
            code: 'AUTOMATION_ADDONS_UNAVAILABLE',
            status: 503
        };
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + addonPackage.durationDays * 24 * 60 * 60 * 1000);

    await client.query(
        `UPDATE automation_addons
         SET status = 'cancelled', updated_at = NOW()
         WHERE owner_user_id = $1
           AND package_id = $2
           AND scope_type = $3
           AND status = 'active'
           AND expires_at > NOW()`,
        [userId, packageId, addonPackage.scopeType]
    );

    const insertedAddon = await client.query(
        `INSERT INTO automation_addons
           (owner_user_id, agency_id, package_id, scope_type, status, starts_at, expires_at, razorpay_order_id, razorpay_payment_id, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', NOW(), $5, $6, $7, $8::jsonb, NOW(), NOW())
         RETURNING id, package_id, scope_type, expires_at`,
        [
            userId,
            agency?.id || null,
            packageId,
            addonPackage.scopeType,
            expiresAt,
            razorpayOrderId,
            razorpayPaymentId,
            JSON.stringify({
                addonName: addonPackage.name,
                durationDays: addonPackage.durationDays
            })
        ]
    );

    const transactionId = uuidv4();
    await client.query(
        `INSERT INTO credit_transactions
           (id, user_id, agency_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
        [
            transactionId,
            userId,
            agency?.id || null,
            'purchase',
            0,
            costInRupees,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            `Automation add-on activated: ${addonPackage.name}`
        ]
    );

    return {
        transactionId,
        addon: insertedAddon.rows[0],
        addonPackage
    };
}

async function activateAgencyExpansionAddon({
    client,
    userId,
    packageId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    costInRupees
}) {
    const addonContext = await getAddonContext(userId, packageId, client.query.bind(client));
    if (addonContext.error) {
        return addonContext;
    }

    const { addonPackage, agency } = addonContext;
    if (addonPackage.category !== 'agency_expansion') {
        return { error: 'Invalid agency add-on package', code: 'INVALID_ADDON_PACKAGE', status: 400 };
    }
    const supportsAddonColumns = await hasAgencyAccountAddonColumns(client.query.bind(client));

    let updatedAgencyResult = null;
    if (addonPackage.limitField) {
        updatedAgencyResult = await client.query(
            `UPDATE agency_accounts
             SET ${addonPackage.limitField} = ${addonPackage.limitField} + $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING id, seat_limit, workspace_limit${supportsAddonColumns ? ', white_label_enabled, reporting_export_enabled, media_library_enabled, media_library_storage_gb' : ''}`,
            [addonPackage.incrementBy || 1, agency.id]
        );
    } else if (addonPackage.featureFlag === 'media_library_enabled') {
        if (!supportsAddonColumns) {
            return {
                error: 'Agency addon columns are not available until the latest billing migration is applied.',
                code: 'AGENCY_ADDON_COLUMNS_UNAVAILABLE',
                status: 503
            };
        }
        updatedAgencyResult = await client.query(
            `UPDATE agency_accounts
             SET media_library_enabled = true,
                 media_library_storage_gb = GREATEST(COALESCE(media_library_storage_gb, 0), $1),
                 updated_at = NOW()
             WHERE id = $2
             RETURNING id, seat_limit, workspace_limit, white_label_enabled, reporting_export_enabled, media_library_enabled, media_library_storage_gb`,
            [addonPackage.storageGb || 25, agency.id]
        );
    } else if (addonPackage.featureFlag) {
        if (!supportsAddonColumns) {
            return {
                error: 'Agency addon columns are not available until the latest billing migration is applied.',
                code: 'AGENCY_ADDON_COLUMNS_UNAVAILABLE',
                status: 503
            };
        }
        updatedAgencyResult = await client.query(
            `UPDATE agency_accounts
             SET ${addonPackage.featureFlag} = true,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id, seat_limit, workspace_limit, white_label_enabled, reporting_export_enabled, media_library_enabled, media_library_storage_gb`,
            [agency.id]
        );
    }

    const quantity = addonPackage.incrementBy || 1;
    const insertedAddon = await client.query(
        `INSERT INTO agency_expansion_addons
           (owner_user_id, agency_id, package_id, status, quantity, razorpay_order_id, razorpay_payment_id, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', $4, $5, $6, $7::jsonb, NOW(), NOW())
         RETURNING id, package_id, quantity, status, created_at`,
        [
            userId,
            agency.id,
            packageId,
            quantity,
            razorpayOrderId,
            razorpayPaymentId,
            JSON.stringify({
                addonName: addonPackage.name,
                persistent: true,
                category: addonPackage.category,
                storageGb: addonPackage.storageGb || null
            })
        ]
    );

    const transactionId = uuidv4();
    await client.query(
        `INSERT INTO credit_transactions
           (id, user_id, agency_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
        [
            transactionId,
            userId,
            agency.id,
            'purchase',
            0,
            costInRupees,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            `Agency add-on activated: ${addonPackage.name}`
        ]
    );

    return {
        transactionId,
        addon: insertedAddon.rows[0],
        addonPackage,
        agencyState: updatedAgencyResult?.rows?.[0] || null
    };
}

class PaymentsController {
    static async createOrder(req, res) {
        try {
            const { type } = req.body;
            const pkg = req.body['package'];
            let addonContext = null;

            if (type === 'addon') {
                addonContext = await getAddonContext(req.user.id, pkg);
                if (addonContext.error) {
                    return res.status(addonContext.status || 400).json({
                        error: addonContext.error,
                        code: addonContext.code
                    });
                }
            }

            const orderConfig = buildOrderConfig({ type, pkg, userId: req.user.id, addonContext });

            if (orderConfig.error) {
                return res.status(400).json({ error: orderConfig.error, code: orderConfig.code });
            }

            const { amount, currency, description, notes } = orderConfig;

            if (!hasRazorpay) {
                // Demo mode - simulate order creation
                if (isDemoMode) {
                    // Create demo order
                    const demoOrderId = `demo_order_${Date.now()}`;
                    console.log('🧪 DEMO MODE: Simulated order creation', { orderId: demoOrderId, amount, description });
                    
                    return res.json({ 
                        orderId: demoOrderId, 
                        amount, 
                        currency, 
                        description, 
                        notes,
                        type,
                        package: pkg,
                        demo: true,
                        message: 'Demo mode: Razorpay not configured. This is a simulated order.'
                    });
                }
                
                return res.status(503).json({ error: 'Payments are disabled (Razorpay keys not configured)' });
            }

            // Create a short receipt ID (max 40 characters)
            const shortId = uuidv4().replace(/-/g, '').substring(0, 20);
            const receipt = `ord_${shortId}`;

            const order = await getRazorpayInstance().orders.create({ amount, currency, receipt, notes, payment_capture: 1 });
            res.json({ 
                orderId: order.id, 
                amount: order.amount, 
                currency: order.currency, 
                description, 
                notes,
                razorpayKey: process.env.RAZORPAY_KEY_ID // Expose public key for frontend
            });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ error: 'Failed to create order', code: 'CREATE_ORDER_ERROR' });
        }
    }

    static async verify(req, res) {
        try {
            if (!hasRazorpay) {
                // Demo mode - simulate payment verification
                if (isDemoMode) {
                    const { razorpayOrderId, demoOrderType = 'credits', demoPackage = null } = req.body;
                    
                    if (!razorpayOrderId || !razorpayOrderId.startsWith('demo_order_')) {
                        return res.status(400).json({ error: 'Invalid demo order ID', code: 'INVALID_DEMO_ORDER' });
                    }

                    // Simulate successful demo payment
                    console.log('🧪 DEMO MODE: Simulated payment verification for', razorpayOrderId);
                    
                    // Add demo credits to user account
                    const client = await pool.connect();
                    try {
                        await client.query('BEGIN');

                        const existingResult = await client.query(
                            'SELECT id, user_id FROM credit_transactions WHERE razorpay_order_id = $1 LIMIT 1',
                            [razorpayOrderId]
                        );

                        if (existingResult.rows.length > 0) {
                            const existing = existingResult.rows[0];
                            const sameUser = String(existing.user_id) === String(req.user.id);

                            if (!sameUser) {
                                await client.query('ROLLBACK');
                                return res.status(409).json({
                                    error: 'This payment is already linked to another account',
                                    code: 'PAYMENT_ALREADY_LINKED'
                                });
                            }

                            await client.query('COMMIT');
                            const balanceResult = await query('SELECT credits_remaining FROM users WHERE id = $1', [req.user.id]);
                            return res.json({
                                message: 'Payment already verified',
                                alreadyProcessed: true,
                                creditsRemaining: balanceResult.rows[0].credits_remaining,
                                transactionId: existing.id,
                                demo: true
                            });
                        }
                        
                        const demoPaymentId = `demo_payment_${razorpayOrderId.replace('demo_order_', '')}`;
                        if (demoOrderType === 'plan') {
                            const planType = String(demoPackage || 'pro').trim();
                            if (!PLAN_PACKAGES[planType]) {
                                await client.query('ROLLBACK');
                                return res.status(400).json({ error: 'Invalid demo plan package', code: 'INVALID_DEMO_PLAN' });
                            }

                            const userStateResult = await client.query(
                                'SELECT credits_remaining, api_key_preference FROM users WHERE id = $1 FOR UPDATE',
                                [req.user.id]
                            );
                            const currentCredits = Number(userStateResult.rows[0]?.credits_remaining) || 0;
                            const apiPreference = userStateResult.rows[0]?.api_key_preference || null;
                            const targetCredits = getCreditsForPlan(planType, apiPreference, { defaultToPlatform: false });
                            const newCredits = apiPreference ? Math.max(currentCredits, targetCredits) : currentCredits;
                            const bonusCredits = Math.max(0, newCredits - currentCredits);

                            await client.query(
                                'UPDATE users SET plan_type = $1, credits_remaining = $2, updated_at = NOW() WHERE id = $3',
                                [planType, newCredits, req.user.id]
                            );

                            const transactionId = uuidv4();
                            await client.query(
                                `INSERT INTO credit_transactions (id, user_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
                                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
                                [transactionId, req.user.id, 'purchase', bonusCredits, PLAN_PACKAGES[planType].price, razorpayOrderId, demoPaymentId, 'demo_signature', `Demo plan upgrade: ${PLAN_PACKAGES[planType].name}`]
                            );

                            await client.query('COMMIT');
                            invalidateAuthUserCache(req.user.id);
                            return res.json({
                                message: 'Demo payment verified and plan upgraded successfully',
                                newPlan: planType,
                                planName: PLAN_PACKAGES[planType].name,
                                bonusCredits,
                                creditsRemaining: newCredits,
                                transactionId,
                                demo: true
                            });
                        }

                        if (demoOrderType === 'addon') {
                            const activationResult = await activateAutomationAddon({
                                client,
                                userId: req.user.id,
                                packageId: String(demoPackage || '').trim(),
                                razorpayOrderId,
                                razorpayPaymentId: demoPaymentId,
                                razorpaySignature: 'demo_signature',
                                costInRupees: getAddonPackage(String(demoPackage || '').trim())?.price || 0
                            });

                            if (activationResult.error) {
                                const addonPackage = getAddonPackage(String(demoPackage || '').trim());
                                if (addonPackage?.category === 'agency_expansion') {
                                    const expansionResult = await activateAgencyExpansionAddon({
                                        client,
                                        userId: req.user.id,
                                        packageId: String(demoPackage || '').trim(),
                                        razorpayOrderId,
                                        razorpayPaymentId: demoPaymentId,
                                        razorpaySignature: 'demo_signature',
                                        costInRupees: addonPackage?.price || 0
                                    });
                                    if (expansionResult.error) {
                                        await client.query('ROLLBACK');
                                        return res.status(expansionResult.status || 400).json({
                                            error: expansionResult.error,
                                            code: expansionResult.code
                                        });
                                    }

                                    await client.query('COMMIT');
                                    invalidateAuthUserCache(req.user.id);
                                    return res.json({
                                        message: `${expansionResult.addonPackage.name} activated successfully`,
                                        agencyAddon: {
                                            active: true,
                                            packageId: expansionResult.addon.package_id,
                                            quantity: expansionResult.addon.quantity,
                                            persistent: true
                                        },
                                        transactionId: expansionResult.transactionId,
                                        demo: true
                                    });
                                }

                                await client.query('ROLLBACK');
                                return res.status(activationResult.status || 400).json({
                                    error: activationResult.error,
                                    code: activationResult.code
                                });
                            }

                            await client.query('COMMIT');
                            invalidateAuthUserCache(req.user.id);
                            return res.json({
                                message: `${activationResult.addonPackage.name} activated successfully`,
                                automationAddon: {
                                    active: true,
                                    packageId: activationResult.addon.package_id,
                                    scopeType: activationResult.addon.scope_type,
                                    expiresAt: activationResult.addon.expires_at
                                },
                                transactionId: activationResult.transactionId,
                                demo: true
                            });
                        }

                        const demoCredits = 25;
                        await client.query('UPDATE users SET credits_remaining = credits_remaining + $1, updated_at = NOW() WHERE id = $2', [demoCredits, req.user.id]);

                        const transactionId = uuidv4();
                        await client.query(
                            `INSERT INTO credit_transactions (id, user_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
                            [transactionId, req.user.id, 'purchase', demoCredits, 45, razorpayOrderId, demoPaymentId, 'demo_signature', `Demo credit top-up: ${demoCredits} credits`]
                        );

                        await client.query('COMMIT');
                        invalidateAuthUserCache(req.user.id);

                        const balanceResult = await query('SELECT credits_remaining FROM users WHERE id = $1', [req.user.id]);

                        return res.json({ 
                            message: 'Demo payment verified and credits added successfully', 
                            creditsAdded: demoCredits, 
                            creditsRemaining: balanceResult.rows[0].credits_remaining, 
                            transactionId,
                            demo: true
                        });
                    } catch (err) {
                        await client.query('ROLLBACK');
                        throw err;
                    } finally {
                        client.release();
                    }
                }
                
                return res.status(503).json({ error: 'Payments are disabled (Razorpay keys not configured)' });
            }
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

            const text = `${razorpayOrderId}|${razorpayPaymentId}`;
            const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(text).digest('hex');
            if (!compareSignatures(expectedSignature, razorpaySignature)) {
                return res.status(400).json({ error: 'Invalid payment signature', code: 'INVALID_SIGNATURE' });
            }

            const rp = getRazorpayInstance();
            const [order, payment] = await Promise.all([
                rp.orders.fetch(razorpayOrderId),
                rp.payments.fetch(razorpayPaymentId)
            ]);

            if (!order || !payment) {
                return res.status(400).json({ error: 'Payment details not found', code: 'PAYMENT_DETAILS_NOT_FOUND' });
            }

            if (payment.order_id !== razorpayOrderId) {
                return res.status(400).json({ error: 'Payment order mismatch', code: 'PAYMENT_ORDER_MISMATCH' });
            }

            if (payment.amount !== order.amount || payment.currency !== order.currency) {
                return res.status(400).json({ error: 'Payment amount mismatch', code: 'PAYMENT_AMOUNT_MISMATCH' });
            }

            if (payment.status !== 'captured') return res.status(400).json({ error: 'Payment not captured', code: 'PAYMENT_NOT_CAPTURED' });

            const orderUserId = order.notes?.userId ? String(order.notes.userId) : null;
            if (orderUserId && orderUserId !== String(req.user.id)) {
                return res.status(403).json({ error: 'Order does not belong to this account', code: 'ORDER_OWNERSHIP_MISMATCH' });
            }

            const orderType = order.notes.type;
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const existingResult = await client.query(
                    'SELECT id, user_id FROM credit_transactions WHERE razorpay_payment_id = $1 OR razorpay_order_id = $2 LIMIT 1',
                    [razorpayPaymentId, razorpayOrderId]
                );

                if (existingResult.rows.length > 0) {
                    const existing = existingResult.rows[0];
                    const sameUser = String(existing.user_id) === String(req.user.id);

                    if (!sameUser) {
                        await client.query('ROLLBACK');
                        return res.status(409).json({
                            error: 'This payment is already linked to another account',
                            code: 'PAYMENT_ALREADY_LINKED'
                        });
                    }

                    await client.query('COMMIT');
                    const userResult = await query('SELECT credits_remaining, plan_type FROM users WHERE id = $1', [req.user.id]);
                    return res.json({
                        message: 'Payment already verified',
                        alreadyProcessed: true,
                        creditsRemaining: userResult.rows[0].credits_remaining,
                        currentPlan: userResult.rows[0].plan_type || 'free',
                        transactionId: existing.id
                    });
                }

                if (orderType === 'credits') {
                    const credits = Number(order.notes.credits);
                    if (!isValidNumber(credits) || Number(credits) <= 0) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: 'Invalid credits in order', code: 'INVALID_ORDER_CREDITS' });
                    }
                    const costInRupees = order.amount / 100;
                    await client.query('UPDATE users SET credits_remaining = credits_remaining + $1, updated_at = NOW() WHERE id = $2', [credits, req.user.id]);
                    const transactionId = uuidv4();
                    await client.query(
                        `INSERT INTO credit_transactions (id, user_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
                        [transactionId, req.user.id, 'purchase', credits, costInRupees, razorpayOrderId, razorpayPaymentId, razorpaySignature, `Credit top-up: ${credits} credits`]
                    );
                    await client.query('COMMIT');
                    invalidateAuthUserCache(req.user.id);
                    const balanceResult = await query('SELECT credits_remaining FROM users WHERE id = $1', [req.user.id]);
                    return res.json({ message: 'Payment verified and credits added successfully', creditsAdded: credits, creditsRemaining: balanceResult.rows[0].credits_remaining, transactionId });
                } else if (orderType === 'plan') {
                    const planType = String(order.notes.plan || '').trim();
                    if (!PLAN_PACKAGES[planType]) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: 'Invalid plan in order', code: 'INVALID_ORDER_PLAN' });
                    }
                    const costInRupees = order.amount / 100;
                    const planName = order.notes.name || PLAN_PACKAGES[planType].name;

                    const userStateResult = await client.query(
                        'SELECT credits_remaining, api_key_preference FROM users WHERE id = $1 FOR UPDATE',
                        [req.user.id]
                    );
                    if (userStateResult.rows.length === 0) {
                        await client.query('ROLLBACK');
                        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
                    }

                    const currentCredits = Number(userStateResult.rows[0].credits_remaining) || 0;
                    const apiPreference = userStateResult.rows[0].api_key_preference || null;
                    const targetCredits = getCreditsForPlan(planType, apiPreference, { defaultToPlatform: false });
                    const newCredits = apiPreference ? Math.max(currentCredits, targetCredits) : currentCredits;
                    const bonusCredits = Math.max(0, newCredits - currentCredits);

                    await client.query(
                        'UPDATE users SET plan_type = $1, credits_remaining = $2, updated_at = NOW() WHERE id = $3',
                        [planType, newCredits, req.user.id]
                    );
                    
                    const transactionId = uuidv4();
                    await client.query(
                        `INSERT INTO credit_transactions (id, user_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
                        [transactionId, req.user.id, 'purchase', bonusCredits, costInRupees, razorpayOrderId, razorpayPaymentId, razorpaySignature, `Plan upgrade: ${planName}${bonusCredits > 0 ? ` (+${bonusCredits} plan credits)` : ''}`]
                    );
                    await client.query('COMMIT');
                    invalidateAuthUserCache(req.user.id);
                    return res.json({
                        message: 'Payment verified and plan upgraded successfully',
                        newPlan: planType,
                        planName,
                        bonusCredits,
                        creditsRemaining: newCredits
                    });
                } else if (orderType === 'addon') {
                    const packageId = String(order.notes.package || '').trim();
                    const addonPackage = getAddonPackage(packageId);
                    const activationResult = addonPackage?.category === 'agency_expansion'
                        ? await activateAgencyExpansionAddon({
                            client,
                            userId: req.user.id,
                            packageId,
                            razorpayOrderId,
                            razorpayPaymentId,
                            razorpaySignature,
                            costInRupees: order.amount / 100
                        })
                        : await activateAutomationAddon({
                            client,
                            userId: req.user.id,
                            packageId,
                            razorpayOrderId,
                            razorpayPaymentId,
                            razorpaySignature,
                            costInRupees: order.amount / 100
                        });

                    if (activationResult.error) {
                        await client.query('ROLLBACK');
                        return res.status(activationResult.status || 400).json({
                            error: activationResult.error,
                            code: activationResult.code
                        });
                    }

                    await client.query('COMMIT');
                    invalidateAuthUserCache(req.user.id);
                    return res.json({
                        message: `${activationResult.addonPackage.name} activated successfully`,
                        automationAddon: activationResult.addonPackage.category === 'automation' ? {
                            active: true,
                            packageId: activationResult.addon.package_id,
                            scopeType: activationResult.addon.scope_type,
                            expiresAt: activationResult.addon.expires_at
                        } : undefined,
                        agencyAddon: activationResult.addonPackage.category === 'agency_expansion' ? {
                            active: true,
                            packageId: activationResult.addon.package_id,
                            quantity: activationResult.addon.quantity,
                            persistent: true
                        } : undefined,
                        transactionId: activationResult.transactionId
                    });
                }

                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Unsupported order type', code: 'UNSUPPORTED_ORDER_TYPE' });
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Verify payment error:', error);
            res.status(500).json({ error: 'Failed to verify payment', code: 'VERIFY_ERROR' });
        }
    }

    static packages(req, res) {
        res.json({
            creditPackages: Object.keys(CREDIT_PACKAGES).map((id) => ({ id, credits: CREDIT_PACKAGES[id].credits, price: CREDIT_PACKAGES[id].price })),
            planPackages: Object.keys(PLAN_PACKAGES).map((id) => ({ id, name: PLAN_PACKAGES[id].name, price: PLAN_PACKAGES[id].price })),
            addonPackages: Object.keys(ADDON_PACKAGES).map((id) => ({
                id,
                name: ADDON_PACKAGES[id].name,
                description: ADDON_PACKAGES[id].description,
                price: ADDON_PACKAGES[id].price,
                category: ADDON_PACKAGES[id].category,
                scopeType: ADDON_PACKAGES[id].scopeType,
                persistent: Boolean(ADDON_PACKAGES[id].persistent),
                durationDays: ADDON_PACKAGES[id].durationDays || null,
                eligiblePlans: ADDON_PACKAGES[id].eligiblePlans || []
            }))
        });
    }

    static async history(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const countResult = await query('SELECT COUNT(*) FROM credit_transactions WHERE user_id = $1 AND type = $2', [req.user.id, 'purchase']);
            const totalCount = parseInt(countResult.rows[0].count);
            const result = await query(
                `SELECT id, credits_amount, cost_in_rupees, description, razorpay_order_id, razorpay_payment_id, created_at
                 FROM credit_transactions WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
                [req.user.id, 'purchase', limit, offset]
            );
            res.json({
                payments: result.rows.map((row) => ({ id: row.id, creditsAmount: row.credits_amount, costInRupees: row.cost_in_rupees, description: row.description, orderId: row.razorpay_order_id, paymentId: row.razorpay_payment_id, createdAt: row.created_at })),
                pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
            });
        } catch (error) {
            console.error('Get payment history error:', error);
            res.status(500).json({ error: 'Failed to get payment history', code: 'PAYMENT_HISTORY_ERROR' });
        }
    }
}

export default PaymentsController;


