import { query, pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const hasRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id_here');
const isDemoMode = !hasRazorpay;

function getRazorpayInstance() {
    if (!hasRazorpay) {
        throw new Error('Razorpay credentials not configured');
    }
    return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

const CREDIT_PACKAGES = {
    '25': { credits: 25, price: 45 },
    '50': { credits: 50, price: 75 },
    '80': { credits: 80, price: 100 }
};

const PLAN_PACKAGES = {
    pro: { price: 800, name: 'Pro Plan' },
    enterprise: { price: 1100, name: 'Enterprise Plan' }
};

class PaymentsController {
    static async createOrder(req, res) {
        try {
            if (!hasRazorpay) {
                // Demo mode - simulate order creation
                if (isDemoMode) {
                    const { type } = req.body;
                    const pkg = req.body['package'];
                    let amount, currency, description, notes;

                    if (type === 'credits') {
                        const creditPackage = CREDIT_PACKAGES[pkg];
                        if (!creditPackage) return res.status(400).json({ error: 'Invalid credit package', code: 'INVALID_CREDIT_PACKAGE' });
                        amount = creditPackage.price * 100;
                        currency = 'INR';
                        description = `${creditPackage.credits} Credits Top-up`;
                        notes = { type: 'credits', credits: creditPackage.credits, package: pkg };
                    } else if (type === 'plan') {
                        const planPackage = PLAN_PACKAGES[pkg];
                        if (!planPackage) return res.status(400).json({ error: 'Invalid plan package', code: 'INVALID_PLAN_PACKAGE' });
                        amount = planPackage.price * 100;
                        currency = 'INR';
                        description = `${planPackage.name} Subscription`;
                        notes = { type: 'plan', plan: pkg, name: planPackage.name };
                    } else {
                        return res.status(400).json({ error: 'Invalid order type', code: 'INVALID_ORDER_TYPE' });
                    }

                    // Create demo order
                    const demoOrderId = `demo_order_${Date.now()}`;
                    console.log('🧪 DEMO MODE: Simulated order creation', { orderId: demoOrderId, amount, description });
                    
                    return res.json({ 
                        orderId: demoOrderId, 
                        amount, 
                        currency, 
                        description, 
                        notes,
                        demo: true,
                        message: 'Demo mode: Razorpay not configured. This is a simulated order.'
                    });
                }
                
                return res.status(503).json({ error: 'Payments are disabled (Razorpay keys not configured)' });
            }

            const { type } = req.body;
            const pkg = req.body['package'];
            let amount, currency, description, notes;

            if (type === 'credits') {
                const creditPackage = CREDIT_PACKAGES[pkg];
                if (!creditPackage) return res.status(400).json({ error: 'Invalid credit package', code: 'INVALID_CREDIT_PACKAGE' });
                amount = creditPackage.price * 100;
                currency = 'INR';
                description = `${creditPackage.credits} Credits Top-up`;
                notes = { type: 'credits', credits: creditPackage.credits, package: pkg };
            } else if (type === 'plan') {
                const planPackage = PLAN_PACKAGES[pkg];
                if (!planPackage) return res.status(400).json({ error: 'Invalid plan package', code: 'INVALID_PLAN_PACKAGE' });
                amount = planPackage.price * 100;
                currency = 'INR';
                description = `${planPackage.name} Subscription`;
                notes = { type: 'plan', plan: pkg, name: planPackage.name };
            } else {
                return res.status(400).json({ error: 'Invalid order type', code: 'INVALID_ORDER_TYPE' });
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
                    const { razorpayOrderId } = req.body;
                    
                    if (!razorpayOrderId || !razorpayOrderId.startsWith('demo_order_')) {
                        return res.status(400).json({ error: 'Invalid demo order ID', code: 'INVALID_DEMO_ORDER' });
                    }

                    // Simulate successful demo payment
                    console.log('🧪 DEMO MODE: Simulated payment verification for', razorpayOrderId);
                    
                    // Add demo credits to user account
                    const client = await pool.connect();
                    try {
                        await client.query('BEGIN');
                        
                        // Demo: Add 25 credits
                        const demoCredits = 25;
                        await client.query('UPDATE users SET credits_remaining = credits_remaining + $1, updated_at = NOW() WHERE id = $2', [demoCredits, req.user.id]);
                        
                        const transactionId = uuidv4();
                        await client.query(
                            `INSERT INTO credit_transactions (id, user_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
                            [transactionId, req.user.id, 'purchase', demoCredits, 45, razorpayOrderId, 'demo_payment_id', 'demo_signature', `Demo credit top-up: ${demoCredits} credits`]
                        );
                        
                        await client.query('COMMIT');
                        
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
            const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(text).digest('hex');
            if (signature !== razorpaySignature) return res.status(400).json({ error: 'Invalid payment signature', code: 'INVALID_SIGNATURE' });

            const rp = getRazorpayInstance();
            const order = await rp.orders.fetch(razorpayOrderId);
            const payment = await rp.payments.fetch(razorpayPaymentId);
            if (payment.status !== 'captured') return res.status(400).json({ error: 'Payment not captured', code: 'PAYMENT_NOT_CAPTURED' });

            const orderType = order.notes.type;
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                if (orderType === 'credits') {
                    const credits = order.notes.credits;
                    const costInRupees = order.amount / 100;
                    await client.query('UPDATE users SET credits_remaining = credits_remaining + $1, updated_at = NOW() WHERE id = $2', [credits, req.user.id]);
                    const transactionId = uuidv4();
                    await client.query(
                        `INSERT INTO credit_transactions (id, user_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
                        [transactionId, req.user.id, 'purchase', credits, costInRupees, razorpayOrderId, razorpayPaymentId, razorpaySignature, `Credit top-up: ${credits} credits`]
                    );
                    await client.query('COMMIT');
                    const balanceResult = await query('SELECT credits_remaining FROM users WHERE id = $1', [req.user.id]);
                    return res.json({ message: 'Payment verified and credits added successfully', creditsAdded: credits, creditsRemaining: balanceResult.rows[0].credits_remaining, transactionId });
                } else if (orderType === 'plan') {
                    const planType = order.notes.plan;
                    const costInRupees = order.amount / 100;
                    await client.query('UPDATE users SET plan_type = $1, updated_at = NOW() WHERE id = $2', [planType, req.user.id]);
                    const transactionId = uuidv4();
                    await client.query(
                        `INSERT INTO credit_transactions (id, user_id, type, credits_amount, cost_in_rupees, razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
                        [transactionId, req.user.id, 'purchase', 0, costInRupees, razorpayOrderId, razorpayPaymentId, razorpaySignature, `Plan upgrade: ${order.notes.name}`]
                    );
                    await client.query('COMMIT');
                    return res.json({ message: 'Payment verified and plan upgraded successfully', newPlan: planType, planName: order.notes.name });
                }
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
            planPackages: Object.keys(PLAN_PACKAGES).map((id) => ({ id, name: PLAN_PACKAGES[id].name, price: PLAN_PACKAGES[id].price }))
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


