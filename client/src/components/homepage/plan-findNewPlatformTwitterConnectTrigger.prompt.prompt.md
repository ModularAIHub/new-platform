# Plan: Find the New Platform Twitter Connect Trigger

1. Search for backend files in new-platform/server that handle Twitter connect logic.
2. Check for files named or containing:
   - twitter.js, twitter.ts, tweet.js, tweetService.js, tweetController.js
   - team.js, teamController.js, teamService.js
   - auth.js, oauth.js, social.js
3. Search for keywords in codebase:
   - "twitter", "connect", "oauth", "social", "auth"
   - API endpoint patterns (e.g., /api/twitter, /api/team/twitter, /api/social/twitter)
4. If not found, check if frontend triggers Twitter connect by calling tweet-genie backend instead of new-platform backend.
5. If still not found, conclude that new-platform does not have direct Twitter connect logic and all such logic is in tweet-genie/server/routes/twitter.js.
6. Document findings and next steps for integration or clarification.
