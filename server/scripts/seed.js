import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Check if we already have users
        const existingUsers = await query('SELECT COUNT(*) as count FROM users');
        if (parseInt(existingUsers.rows[0].count) > 0) {
            console.log('⚠️  Database already has data, skipping seeding');
            return;
        }

        // Create test users
        const testUsers = [
            {
                id: uuidv4(),
                email: 'admin@autoverse.com',
                password: 'admin123',
                name: 'Admin User',
                planType: 'enterprise',
                credits: 500
            },
            {
                id: uuidv4(),
                email: 'pro@autoverse.com',
                password: 'pro123',
                name: 'Pro User',
                planType: 'pro',
                credits: 150
            },
            {
                id: uuidv4(),
                email: 'free@autoverse.com',
                password: 'free123',
                name: 'Free User',
                planType: 'free',
                credits: 25
            }
        ];

        for (const user of testUsers) {
            const passwordHash = await bcrypt.hash(user.password, 12);

            await query(
                `INSERT INTO users (id, email, password_hash, name, plan_type, credits_remaining, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [user.id, user.email, passwordHash, user.name, user.planType, user.credits]
            );

            console.log(`✅ Created user: ${user.email} (${user.planType})`);
        }

        // Create sample API keys for pro and enterprise users
        const proUser = testUsers.find(u => u.planType === 'pro');
        const enterpriseUser = testUsers.find(u => u.planType === 'enterprise');

        if (proUser) {
            await query(
                `INSERT INTO api_keys (id, user_id, provider, encrypted_key, key_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [
                    uuidv4(),
                    proUser.id,
                    'openai',
                    'encrypted_sample_key_1',
                    'OpenAI Production Key',
                    true
                ]
            );

            await query(
                `INSERT INTO api_keys (id, user_id, provider, encrypted_key, key_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [
                    uuidv4(),
                    proUser.id,
                    'gemini',
                    'encrypted_sample_key_2',
                    'Gemini API Key',
                    true
                ]
            );

            console.log('✅ Created sample API keys for Pro user');
        }

        if (enterpriseUser) {
            await query(
                `INSERT INTO api_keys (id, user_id, provider, encrypted_key, key_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [
                    uuidv4(),
                    enterpriseUser.id,
                    'openai',
                    'encrypted_sample_key_3',
                    'OpenAI Enterprise Key',
                    true
                ]
            );

            await query(
                `INSERT INTO api_keys (id, user_id, provider, encrypted_key, key_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [
                    uuidv4(),
                    enterpriseUser.id,
                    'perplexity',
                    'encrypted_sample_key_4',
                    'Perplexity API Key',
                    true
                ]
            );

            console.log('✅ Created sample API keys for Enterprise user');
        }

        // Create sample credit transactions
        const sampleTransactions = [
            {
                userId: proUser.id,
                type: 'usage',
                creditsAmount: 5,
                description: 'Twitter Genie: Generated 3 posts'
            },
            {
                userId: proUser.id,
                type: 'usage',
                creditsAmount: 3,
                description: 'LinkedIn Genie: Created 2 articles'
            },
            {
                userId: enterpriseUser.id,
                type: 'purchase',
                creditsAmount: 100,
                costInRupees: 350,
                description: 'Credit top-up: 100 credits',
                razorpayOrderId: 'order_sample_1',
                razorpayPaymentId: 'pay_sample_1',
                razorpaySignature: 'sample_signature_1'
            },
            {
                userId: enterpriseUser.id,
                type: 'usage',
                creditsAmount: 10,
                description: 'Twitter Genie: Generated 10 posts'
            }
        ];

        for (const transaction of sampleTransactions) {
            await query(
                `INSERT INTO credit_transactions (
          id, user_id, type, credits_amount, cost_in_rupees, 
          razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
                [
                    uuidv4(),
                    transaction.userId,
                    transaction.type,
                    transaction.creditsAmount,
                    transaction.costInRupees || null,
                    transaction.razorpayOrderId || null,
                    transaction.razorpayPaymentId || null,
                    transaction.razorpaySignature || null,
                    transaction.description
                ]
            );
        }

        console.log('✅ Created sample credit transactions');

        // Create sample team members for enterprise user
        if (enterpriseUser) {
            const teamMemberId = uuidv4();

            // Create a team member user
            const teamMemberPasswordHash = await bcrypt.hash('member123', 12);
            await query(
                `INSERT INTO users (id, email, password_hash, name, plan_type, credits_remaining, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [teamMemberId, 'member@autoverse.com', teamMemberPasswordHash, 'Team Member', 'free', 25]
            );

            // Add to team
            await query(
                `INSERT INTO team_members (id, user_id, account_owner_id, role, invited_at)
         VALUES ($1, $2, $3, $4, NOW())`,
                [uuidv4(), teamMemberId, enterpriseUser.id, 'member']
            );

            console.log('✅ Created sample team member for Enterprise user');
        }

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('Admin: admin@autoverse.com / admin123');
        console.log('Pro: pro@autoverse.com / pro123');
        console.log('Free: free@autoverse.com / free123');
        console.log('Team Member: member@autoverse.com / member123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding if this file is executed directly

// ES module entrypoint
if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
    seedDatabase().then(() => {
        console.log('✅ Database seeding complete');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    });
}
