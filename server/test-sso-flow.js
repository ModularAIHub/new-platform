// Test SSO Token Generation and Validation with Real Database Data
import jwt from 'jsonwebtoken';
import { pool, query } from './config/database.js';

async function testSSOFlow() {
  console.log('🧪 Testing Production-Ready SSO Token Generation and Validation...');
  
  try {
    // Step 1: Fetch real team and user data from database
    console.log('\n1️⃣ Fetching Real Team and User Data...');
    
    // Get the team owner from the actual database
    const ownerResult = await query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.name,
        tm.team_id,
        tm.role,
        tm.status,
        t.name as team_name,
        t.id as team_uuid
      FROM users u
      JOIN team_members tm ON u.id = tm.user_id
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.role = 'owner' AND tm.status = 'active'
      ORDER BY tm.joined_at ASC
      LIMIT 1
    `);
    
    if (ownerResult.rows.length === 0) {
      throw new Error('No active team owner found in database');
    }
    
    const ownerData = ownerResult.rows[0];
    console.log('✅ Found team owner:', ownerData.name, `(${ownerData.email})`);
    console.log('   Team:', ownerData.team_name);
    console.log('   User ID:', ownerData.user_id);
    console.log('   Team ID:', ownerData.team_id);
    
    // Step 2: Generate SSO Token with real data
    console.log('\n2️⃣ Testing JWT Token Generation with Real Data...');
    
    const dynamicPayload = {
      userId: ownerData.user_id,
      teamId: ownerData.team_id,
      role: ownerData.role,
      email: ownerData.email,
      name: ownerData.name,
      teamName: ownerData.team_name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      iss: 'main-platform',
      aud: ['tweetgenie', 'linkedingenie', 'suitegenie']
    };
    
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(dynamicPayload, secret);
    
    console.log('✅ Token generated successfully with real data');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Test 3: Validate Token (simulating TweetGenie)
    console.log('\n3️⃣ Testing JWT Token Validation...');
    
    try {
      const decoded = jwt.verify(token, secret);
      console.log('✅ Token validated successfully');
      console.log('Decoded payload:', {
        userId: decoded.userId,
        teamId: decoded.teamId,
        role: decoded.role,
        email: decoded.email,
        teamName: decoded.teamName,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
    } catch (err) {
      console.log('❌ Token validation failed:', err.message);
    }
    
    // Test 4: Test with expired token
    console.log('\n4️⃣ Testing Expired Token...');
    
    const expiredPayload = {
      ...dynamicPayload,
      exp: Math.floor(Date.now() / 1000) - 60 // Expired 1 minute ago
    };
    
    const expiredToken = jwt.sign(expiredPayload, secret);
    
    try {
      jwt.verify(expiredToken, secret);
      console.log('❌ Expired token should have failed validation');
    } catch (err) {
      console.log('✅ Expired token correctly rejected:', err.message);
    }
    
    // Test 5: Generate SSO URL
    console.log('\n5️⃣ Testing SSO URL Generation...');
    
    const ssoUrl = `http://localhost:3002/sso?token=${encodeURIComponent(token)}`;
    console.log('✅ SSO URL generated:');
    console.log(ssoUrl);
    
    // Test 6: Database connectivity for team validation
    console.log('\n6️⃣ Testing Team Database Validation...');
    
    const client = await pool.connect();
    const teamMember = await client.query(`
      SELECT tm.role, t.name as team_name, u.email, u.name as user_name
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1 AND tm.user_id = $2 AND tm.status = 'active'
    `, [dynamicPayload.teamId, dynamicPayload.userId]);
    
    if (teamMember.rows.length > 0) {
      console.log('✅ Team membership validated');
      console.log('User:', teamMember.rows[0].user_name, `(${teamMember.rows[0].email})`);
      console.log('Role:', teamMember.rows[0].role);
      console.log('Team:', teamMember.rows[0].team_name);
      
      // Verify the role matches what we expect
      if (teamMember.rows[0].role === dynamicPayload.role) {
        console.log('✅ Role verification passed');
      } else {
        console.log(`❌ Role mismatch: Expected ${dynamicPayload.role}, got ${teamMember.rows[0].role}`);
      }
    } else {
      console.log('❌ Team membership not found');
    }
    
    client.release();
    
    // Test 7: Test the actual proTeamController SSO generation logic
    console.log('\n7️⃣ Testing ProTeamController SSO Generation Logic...');
    
    // Simulate the controller's query logic
    const controllerResult = await query(`
      SELECT tm.team_id, tm.role, t.name as team_name, u.email, u.name
      FROM team_members tm 
      JOIN teams t ON tm.team_id = t.id
      JOIN users u ON tm.user_id = u.id
      WHERE tm.user_id = $1 AND tm.status = 'active'
      ORDER BY tm.role DESC, tm.joined_at ASC
    `, [ownerData.user_id]);
    
    if (controllerResult.rows.length > 0) {
      const controllerData = controllerResult.rows[0];
      console.log('✅ Controller query successful');
      console.log('   Selected Role:', controllerData.role);
      console.log('   Selected Team:', controllerData.team_name);
      console.log('   User:', controllerData.name, `(${controllerData.email})`);
      
      if (controllerData.role === 'owner') {
        console.log('✅ Controller correctly identifies owner role');
      } else {
        console.log('⚠️  Controller selected non-owner role:', controllerData.role);
      }
    } else {
      console.log('❌ Controller query returned no results');
    }
    
    console.log('\n🎉 Production-Ready SSO Flow Test Complete!');
    console.log('\n💡 Next steps:');
    console.log('1. Visit the SSO URL above in your browser');
    console.log('2. Check if TweetGenie authenticates the user');
    console.log('3. Verify role-based permissions work');
    
  } catch (error) {
    console.error('❌ SSO Test failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testSSOFlow();