// Script to check OAuth 1.0a tokens for Twitter team accounts
import { query } from './config/database.js';

async function checkOAuth1Tokens(teamId) {
  try {
    // Print all Twitter accounts for this team, regardless of active status
    const result = await query(
      `SELECT id, platform, account_username, account_display_name, account_id, profile_image_url, is_active, oauth1_access_token, oauth1_access_token_secret, access_token, refresh_token, token_expires_at FROM user_social_accounts WHERE team_id = $1 AND platform = 'twitter'`,
      [teamId]
    );
    if (result.rows.length === 0) {
      console.log('No Twitter accounts found for this team in user_social_accounts.');
    } else {
      result.rows.forEach(acc => {
        console.log('user_social_accounts:');
        console.log(`  Account ID: ${acc.id}`);
        console.log(`  Username: ${acc.account_username}`);
        console.log(`  Display Name: ${acc.account_display_name}`);
        console.log(`  Account ID (Twitter): ${acc.account_id}`);
        console.log(`  Profile Image: ${acc.profile_image_url}`);
        console.log(`  Is Active: ${acc.is_active}`);
        console.log(`  OAuth1 Access Token: ${acc.oauth1_access_token}`);
        console.log(`  OAuth1 Access Token Secret: ${acc.oauth1_access_token_secret}`);
        console.log(`  OAuth2 Access Token: ${acc.access_token}`);
        console.log(`  OAuth2 Refresh Token: ${acc.refresh_token}`);
        console.log(`  Token Expires At: ${acc.token_expires_at}`);
        if (acc.oauth1_access_token && acc.oauth1_access_token_secret) {
          console.log('  OAuth 1.0a tokens PRESENT');
        } else {
          console.log('  OAuth 1.0a tokens MISSING');
        }
        console.log('---');
      });
    }

    // Also check team_accounts table for Twitter accounts
    const teamResult = await query(
      `SELECT id, twitter_username, twitter_display_name, twitter_user_id, twitter_profile_image_url, active, access_token, refresh_token, token_expires_at FROM team_accounts WHERE team_id = $1`,
      [teamId]
    );
    if (teamResult.rows.length === 0) {
      console.log('No Twitter accounts found for this team in team_accounts.');
    } else {
      teamResult.rows.forEach(acc => {
        console.log('team_accounts:');
        console.log(`  Account ID: ${acc.id}`);
        console.log(`  Username: ${acc.twitter_username}`);
        console.log(`  Display Name: ${acc.twitter_display_name}`);
        console.log(`  Account ID (Twitter): ${acc.twitter_user_id}`);
        console.log(`  Profile Image: ${acc.twitter_profile_image_url}`);
        console.log(`  Active: ${acc.active}`);
        console.log(`  OAuth2 Access Token: ${acc.access_token}`);
        console.log(`  OAuth2 Refresh Token: ${acc.refresh_token}`);
        console.log(`  Token Expires At: ${acc.token_expires_at}`);
        if (acc.access_token && acc.refresh_token) {
          console.log('  OAuth2 tokens PRESENT');
        } else {
          console.log('  OAuth2 tokens MISSING');
        }
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error checking OAuth tokens:', error);
  }
}

// Replace with your actual team ID
const teamId = process.argv[2];
if (!teamId) {
  console.error('Usage: node check-oauth1-tokens.js <TEAM_ID>');
  process.exit(1);
}

checkOAuth1Tokens(teamId);