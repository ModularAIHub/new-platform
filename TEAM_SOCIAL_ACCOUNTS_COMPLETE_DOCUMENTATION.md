# 📋 Complete Team Social Accounts Implementation Documentation

## 🎯 Overview
We implemented a comprehensive team-based social media account management system for Pro plan users, allowing teams to collaboratively manage up to 8 social media profiles with role-based permissions.

---

## 🗄️ Database Implementation

### **1. Enhanced user_social_accounts Table**
```sql
CREATE TABLE user_social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    account_username VARCHAR(255),
    account_display_name VARCHAR(255), 
    account_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    profile_image_url TEXT,
    oauth1_access_token TEXT,
    oauth1_access_token_secret TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_user_social_accounts_context 
        CHECK (team_id IS NOT NULL OR user_id IS NOT NULL),
    
    -- Unique constraint for team accounts
    UNIQUE (team_id, platform, account_id) 
        WHERE is_active = true AND team_id IS NOT NULL
);
```

### **2. Performance Indexes**
```sql
CREATE INDEX idx_user_social_accounts_team_id ON user_social_accounts(team_id);
CREATE INDEX idx_user_social_accounts_user_id ON user_social_accounts(user_id);  
CREATE INDEX idx_user_social_accounts_platform ON user_social_accounts(platform);
```

### **3. Key Database Features**
- **Team Context**: `team_id` foreign key links accounts to teams
- **Cascade Deletion**: When team is deleted, all social accounts are removed
- **Unique Constraints**: Prevents duplicate accounts per team/platform
- **OAuth Support**: Both OAuth2 and OAuth1 token storage
- **Active Status**: Soft delete capability with `is_active` flag

---

## 🏗️ Backend API Implementation

### **1. ProTeamController Enhancements**

**File**: `server/controllers/proTeamController.js`

#### **Key Methods Added:**

**a) getTeamSocialAccounts()**
```javascript
// GET /api/pro-team/social-accounts
// Returns all connected social accounts for the user's team
async getTeamSocialAccounts(req, res) {
    // Validates team membership
    // Returns accounts with platform, username, display_name, profile_image
    // Shows connected count (X/8 accounts)
}
```

**b) connectAccount()**
```javascript  
// POST /api/pro-team/social-accounts/connect
// Initiates OAuth connection to subdomain platforms
async connectAccount(req, res) {
    // Validates role permissions (owner/admin only)
    // Checks team account limit (8 max)
    // Generates redirect URL to subdomain with team context
    // Returns: { success: true, redirectUrl: "http://localhost:3002/api/twitter/team-connect?..." }
}
```

**c) disconnectAccount()**
```javascript
// DELETE /api/pro-team/social-accounts/:id
// Removes a connected social account
async disconnectAccount(req, res) {
    // Validates role permissions (owner/admin only)
    // Soft deletes account (sets is_active = false)
    // Returns success confirmation
}
```

**d) getPermissions()**
```javascript
// GET /api/pro-team/permissions
// Returns user's role and connection limits
async getPermissions(req, res) {
    // Returns: { role, max_profile_connections: 8, can_connect_profiles: boolean }
}
```

### **2. Role-Based Permission System**

| Role   | Max Team Accounts | Can Connect | Can Disconnect | Can Use for Posting |
|--------|------------------|-------------|----------------|-------------------|
| Owner  | 8               | ✅          | ✅             | ✅                |
| Admin  | 8               | ✅          | ✅             | ✅                |
| Editor | 8               | ❌          | ❌             | ✅                |
| Viewer | 8               | ❌          | ❌             | ✅                |

**Key Rule**: **Team-wide limit of 8 accounts total** (not per user)

### **3. API Routes Added**
```javascript
// In server/routes/proTeam.js
router.get('/social-accounts', proTeamController.getTeamSocialAccounts);
router.post('/social-accounts/connect', proTeamController.connectAccount);
router.delete('/social-accounts/:id', proTeamController.disconnectAccount);
router.get('/permissions', proTeamController.getPermissions);
```

---

## 🎨 Frontend Implementation

### **1. TeamPage.jsx Enhancements**

**File**: `client/src/pages/TeamPage.jsx`

#### **Key Features Added:**

**a) Social Accounts Section**
```jsx
// 8-slot visual grid showing connected/available slots
<div className="grid grid-cols-4 gap-4">
  {[...Array(8)].map((_, index) => (
    <div key={index} className="social-account-slot">
      {/* Shows connected account or empty slot */}
    </div>
  ))}
</div>
```

**b) Platform Connection Grid**
```jsx
const platforms = [
  { id: 'twitter', name: 'Twitter', icon: Twitter },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'wordpress', name: 'WordPress', icon: Globe },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'instagram', name: 'Instagram', icon: Instagram }
];

// Role-based connection buttons
{platforms.map(platform => (
  <button 
    onClick={() => handleConnect(platform.id)}
    disabled={!['owner', 'admin'].includes(userPermissions.role)}
  >
    Connect {platform.name}
  </button>
))}
```

**c) Team Account Management**
```jsx
// Connected accounts list with disconnect option
{socialAccounts.map(account => (
  <div key={account.id} className="connected-account">
    <img src={account.profile_image_url} />
    <span>{account.account_display_name}</span>
    {['owner', 'admin'].includes(userPermissions.role) && (
      <button onClick={() => handleDisconnect(account.id)}>
        Disconnect
      </button>
    )}
  </div>
))}
```

### **2. Team Context Management**
```jsx
// Fetches user's team and role information
const { data: userPermissions } = useQuery({
  queryKey: ['team-permissions'],
  queryFn: () => api.get('/pro-team/permissions')
});

// Loads team's connected social accounts
const { data: socialAccounts } = useQuery({
  queryKey: ['team-social-accounts'], 
  queryFn: () => api.get('/pro-team/social-accounts')
});
```

### **3. Role-Based UI Features**
- **Connection buttons**: Only visible to owners/admins
- **Account limits**: Shows "X/8 connected" with team-wide context
- **Permission messages**: Clear explanations of who can do what
- **Disconnect controls**: Only owners/admins can remove accounts

---

## 🔗 OAuth Integration (Subdomain Enhanced)

### **1. Tweet Genie OAuth Enhancement**

**File**: `tweet-genie/server/routes/twitter.js`

#### **New Team-Connect Routes:**

**a) GET /api/twitter/team-connect**
```javascript
// Accepts teamId, userId, returnUrl parameters
// Generates OAuth2 URL with team context in state
// Stores team session data with PKCE verifier
router.get('/team-connect', async (req, res) => {
  const { teamId, userId, returnUrl } = req.query;
  // Validates required parameters
  // Generates PKCE challenge
  // Stores session: { codeVerifier, teamId, userId, returnUrl }
  // Redirects to Twitter OAuth
});
```

**b) GET /api/twitter/team-connect-oauth1**  
```javascript
// OAuth1 flow for media uploads with team context
// Similar to OAuth2 but uses OAuth1.0a flow
router.get('/team-connect-oauth1', async (req, res) => {
  // Generates OAuth1 request token
  // Stores team context with token
  // Redirects to Twitter OAuth1 flow
});
```

#### **Enhanced Callback Handler:**
```javascript
// Modified handleOAuth2Callback() to support team connections
async function handleOAuth2Callback(req, res) {
  // Detects team vs individual connection from session data
  const isTeamConnection = typeof sessionData === 'object' && sessionData.teamId;
  
  if (isTeamConnection) {
    // Team connection flow:
    // 1. Validate team membership and role
    // 2. Check team account limit (8 max)
    // 3. Store in user_social_accounts with team_id
    // 4. Redirect back to main platform
  } else {
    // Individual connection flow (legacy)
    // Store in twitter_auth table
  }
}
```

### **2. Team Validation Logic**
```javascript
// Validates user is authorized for team
const teamMemberResult = await pool.query(`
  SELECT role FROM team_members 
  WHERE team_id = $1 AND user_id = $2 AND status = 'active'
`, [teamId, userId]);

// Checks role permissions
if (!['owner', 'admin'].includes(userRole)) {
  return res.redirect(`${returnUrl}?error=insufficient_permissions`);
}

// Validates team account limit
const teamAccountsCount = await pool.query(`
  SELECT COUNT(*) as count FROM user_social_accounts 
  WHERE team_id = $1 AND is_active = true
`, [teamId]);

if (parseInt(teamAccountsCount.rows[0].count) >= 8) {
  return res.redirect(`${returnUrl}?error=account_limit_reached`);
}
```

### **3. Database Storage Enhancement**
```javascript
// Stores team social account with all OAuth data
await pool.query(`
  INSERT INTO user_social_accounts (
    user_id, team_id, platform, account_id, account_username, 
    account_display_name, access_token, refresh_token, token_expires_at,
    profile_image_url, oauth1_access_token, oauth1_access_token_secret,
    is_active, created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (team_id, platform, account_id) WHERE is_active = true AND team_id IS NOT NULL
  DO UPDATE SET /* update tokens and metadata */
`);
```

---

## 🔄 Complete Connection Flow

### **Step-by-Step User Journey:**

1. **Team Page Access**
   - User visits `/team` page in main platform
   - System loads user's team and role information
   - Displays 8-slot social accounts grid

2. **Initiate Connection** 
   - Owner/Admin clicks "Connect Twitter" button
   - Frontend calls `POST /api/pro-team/social-accounts/connect`
   - Backend validates permissions and generates redirect URL

3. **OAuth Redirect**
   - User redirected to: `http://localhost:3002/api/twitter/team-connect?teamId=xxx&userId=yyy&returnUrl=zzz`
   - Tweet Genie validates parameters and initiates Twitter OAuth

4. **Twitter Authentication**
   - User completes Twitter OAuth flow
   - Twitter redirects back to Tweet Genie callback

5. **Account Storage**
   - Tweet Genie validates team membership
   - Stores account in `user_social_accounts` with `team_id`
   - Redirects back to main platform: `http://localhost:3000/team?success=twitter_connected`

6. **Updated UI**
   - Main platform refreshes social accounts list
   - Shows new Twitter account in team grid
   - Updates counter (e.g., "1/8 connected")

---

## 🧪 Testing & Validation

### **1. Database Tests**
**File**: `server/test-team-social-accounts.js`
- ✅ Schema validation
- ✅ Constraint verification  
- ✅ Index optimization
- ✅ Foreign key relationships

### **2. API Tests**
**File**: `server/test-role-api.js`
- ✅ Role-based permissions
- ✅ Team member management
- ✅ Social account CRUD operations

### **3. OAuth Integration Tests**
**File**: `server/test-team-oauth.js`
- ✅ Team context URL generation
- ✅ Database connectivity
- ✅ Sample connection flows

---

## 📊 Current System Status

### **✅ Fully Implemented:**
- Database schema with team support
- Backend API with role-based permissions
- Frontend UI with 8-slot team management
- Twitter OAuth integration with team context
- Team validation and account limits
- Cascade deletion and data integrity

### **🔧 Architecture Components:**

**Main Platform (localhost:3000):**
- Team management interface
- Role-based permissions
- Social account grid display
- Connection initiation

**Tweet Genie (localhost:3002):**
- Enhanced OAuth flows with team support
- Team validation and storage
- Return redirect handling

**Shared Database:**
- Unified storage in `user_social_accounts`
- Team context preservation
- OAuth token management

### **📈 Team Limits & Permissions:**
- **Team-wide limit**: 8 social accounts total
- **Connection permissions**: Owner and Admin only
- **Usage permissions**: All team members
- **Account management**: Role-based UI controls

---

## 🚀 What's Working:

1. ✅ **Team Formation**: Users can create teams and invite members
2. ✅ **Role Management**: 4-tier permission system (owner/admin/editor/viewer)
3. ✅ **Account Connection**: Twitter OAuth with team context
4. ✅ **Team Limits**: 8-account limit enforced team-wide
5. ✅ **Data Storage**: All accounts stored with team relationships
6. ✅ **UI Integration**: Clean team management interface

## 🔮 Next Steps:

1. **Posting Integration**: Enable team members to post using connected accounts
2. **LinkedIn Support**: Apply same pattern to LinkedIn Genie
3. **Platform Expansion**: Add WordPress, Facebook, Instagram
4. **Analytics**: Track team social media performance
5. **Scheduling**: Queue posts for optimal timing

---

**🎉 The team social accounts foundation is complete and fully functional!**

---

# 🚀 THE FINAL ARCHITECTURE PLAN

## 🎯 Core System Design

### **Main Platform (Hub) - Central Command Center**
- Team management & invitations
- Account connection orchestration (OAuth redirects)  
- Unified quick-post interface
- Cross-platform analytics dashboard
- Role & permission management
- Billing & subscription management

### **Subdomains (Specialists) - Platform-Specific Tools**
- **TweetGenie**: Twitter scheduling, analytics, AI content
- **LinkedInGenie**: LinkedIn management & networking tools  
- **SuiteGenie**: WordPress, blogs, other platforms
- Each has full feature set for their platform
- Each has account switcher for multiple accounts
- Each enforces role-based permissions via SSO

### **Shared Database - Single Source of Truth**
- `teams` table
- `team_members` table (with roles)
- `user_social_accounts` table (all connected accounts)
- `posts` table (unified posting history)
- `analytics` table (cross-platform metrics)

## 🏗️ Key Principles

1. **User never manages accounts separately** - All accounts are team-owned and accessible to all members (with role restrictions)
2. **SSO everywhere** - One login, seamless navigation between services
3. **Role travels with user** - JWT token carries role, every subdomain enforces it
4. **Account context is explicit** - User always knows which account they're working with via switcher
5. **Hybrid access pattern** - Quick actions on main platform, deep work on subdomains

---

# 📋 THE COMPLETE IMPLEMENTATION PLAN

## **Phase 1: Foundation (2-3 Weeks)**

### **1.1 SSO Infrastructure**
- JWT token generation on main platform
- Token validation middleware for all subdomains
- Shared secret/key management across services
- Session management in each subdomain
- Token expiry & refresh logic

### **1.2 Enhanced Database Schema**
```sql
-- Add to user_social_accounts
ALTER TABLE user_social_accounts 
ADD COLUMN account_nickname VARCHAR(100),
ADD COLUMN connection_order INTEGER DEFAULT 0,
ADD COLUMN last_used_at TIMESTAMP,
ADD COLUMN created_by_user_id UUID REFERENCES users(id);

-- Track who posts what
CREATE TABLE post_history (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  account_id UUID REFERENCES user_social_accounts(id),
  created_by_user_id UUID REFERENCES users(id),
  platform VARCHAR(50),
  content TEXT,
  scheduled_at TIMESTAMP,
  posted_at TIMESTAMP,
  status VARCHAR(50), -- 'draft', 'scheduled', 'posted', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **1.3 Main Platform Updates**
- Add "Access [Platform]" buttons on team dashboard
- Generate SSO tokens with user role
- Redirect to subdomains with token
- Display all connected accounts grouped by platform
- Show connection limits per platform (e.g., Twitter: 2/3 connected)

**Deliverable**: User can click "Go to TweetGenie" from main platform and land there authenticated with their role

---

## **Phase 2: Account Switching (2 Weeks)**

### **2.1 Account Switcher Component (Reusable)**
Build once, deploy to all subdomains:
- Dropdown in navbar showing all team accounts for this platform
- Fetches accounts from database WHERE team_id = X AND platform = Y
- Stores selected account_id in session/localStorage
- Reloads page data when account changes

### **2.2 Context-Aware Data Loading**
Every subdomain page/API checks:
```javascript
const currentAccountId = session.current_account_id;
// Fetch data filtered by this account
const analytics = await getAnalytics(currentAccountId);
const scheduledPosts = await getScheduledPosts(currentAccountId);
```

### **2.3 Per-Subdomain Implementation**
- **TweetGenie**: Account switcher queries for platform='twitter'
- **LinkedInGenie**: Account switcher queries for platform='linkedin'
- **SuiteGenie**: Account switcher queries for platform='wordpress' (or others)

**Deliverable**: User lands on TweetGenie, sees dropdown with all Twitter accounts, switches between them seamlessly

---

## **Phase 3: Role-Based Permissions (1-2 Weeks)**

### **3.1 Frontend Permission Gates**
```javascript
// Reusable hook for all subdomains
const { role, canPost, canEdit, canDelete, canManageSettings } = usePermissions();

// Conditionally render
{canPost && <NewPostButton />}
{canManageSettings && <SettingsTab />}
{role === 'viewer' && <ReadOnlyBanner />}
```

### **3.2 Backend Permission Middleware**
```javascript
// Protect routes based on role
requireRole(['owner', 'admin', 'editor']) // For posting
requireRole(['owner', 'admin']) // For settings
requireRole(['owner']) // For account disconnection
```

### **3.3 Permission Matrix Implementation**

| Feature | Viewer | Editor | Admin | Owner |
|---------|--------|--------|-------|-------|
| View analytics | ✅ | ✅ | ✅ | ✅ |
| Switch accounts | ✅ | ✅ | ✅ | ✅ |
| Create posts | ❌ | ✅ | ✅ | ✅ |
| Edit own posts | ❌ | ✅ | ✅ | ✅ |
| Edit any posts | ❌ | ❌ | ✅ | ✅ |
| Delete own posts | ❌ | ✅ | ✅ | ✅ |
| Delete any posts | ❌ | ❌ | ✅ | ✅ |
| Access settings | ❌ | ❌ | ✅ | ✅ |
| Disconnect accounts | ❌ | ❌ | ✅ | ✅ |

**Deliverable**: Editors can post but not access settings, Viewers can only see data, Owners/Admins have full control

---

## **Phase 4: Multi-Account OAuth (2 Weeks)**

### **4.1 Connection Token System**
- Main platform generates secure token before OAuth redirect
- Store connection context in Redis/database (10-minute expiry)
- Token contains: teamId, userId, platform, existingAccounts
- Pass only token to subdomain (not sensitive data in URL)

### **4.2 Duplicate Prevention**
```javascript
// Check if account already connected
const existingAccount = await db.query(`
  SELECT id FROM user_social_accounts 
  WHERE team_id = $1 AND platform = $2 AND account_id = $3 AND is_active = true
`, [teamId, platform, twitterUserId]);

if (existingAccount.rows.length > 0) {
  return redirect(mainPlatform + '?error=duplicate_account');
}
```

### **4.3 Per-Platform Limits**
```javascript
// Check account limit before allowing connection
const accountCount = await db.query(`
  SELECT COUNT(*) FROM user_social_accounts 
  WHERE team_id = $1 AND platform = $2 AND is_active = true
`, [teamId, platform]);

if (accountCount.rows[0].count >= 3) { // 3 per platform
  return redirect(mainPlatform + '?error=platform_limit_reached');
}
```

**Deliverable**: Users can connect multiple accounts per platform without duplicates, with per-platform limits enforced

---

## **Phase 5: Unified Posting (2 Weeks)**

### **5.1 Main Platform Quick Post**
- Modal with content editor
- Multi-select account picker (all platforms)
- "Post Now" or "Schedule" buttons
- Sends API calls to appropriate subdomains

### **5.2 Subdomain Posting APIs**
```javascript
// POST /api/team-post
// Accepts: team_id, account_id, content, media, scheduled_time
// Validates permissions
// Posts using account's tokens
// Logs to post_history table
```

### **5.3 Cross-Platform Posting Logic**
```javascript
// User selects: @twitter1, @twitter2, @linkedin1
// Main platform makes:
POST tweetgenie.com/api/team-post (account: @twitter1)
POST tweetgenie.com/api/team-post (account: @twitter2)
POST linkedingenie.com/api/team-post (account: @linkedin1)

// Shows success/failure for each
```

**Deliverable**: Users can post to multiple accounts across platforms from one interface

---

## **Phase 6: Analytics & Scheduling (2-3 Weeks)**

### **6.1 Subdomain Scheduling**
- Full calendar view per account
- Drag-drop scheduling interface
- Bulk scheduling
- Post templates
- Account-specific: shows only posts for currently selected account

### **6.2 Subdomain Analytics**
- Per-account dashboards
- Engagement metrics
- Best posting times
- Content performance
- Account-specific: switches when user changes account in dropdown

### **6.3 Main Platform Unified View**
- Combined analytics across all accounts
- Team activity feed
- "What's scheduled today across all accounts?"
- Top performing content
- Team member contributions

**Deliverable**: Deep analytics in subdomains, overview analytics on main platform

---

## **Phase 7: Polish & Enhancement (Ongoing)**

### **7.1 Token Management**
- Auto-refresh expired tokens
- Detect disconnected accounts
- Notify team owners when reconnection needed
- Health check dashboard

### **7.2 Account Nicknames**
- Prompt user to nickname accounts after connection
- "Personal Twitter", "Brand Account", "CEO's LinkedIn"
- Display nicknames everywhere (switcher, post selector, analytics)

### **7.3 Advanced Features**
- AI content suggestions per platform
- Content calendar collaboration (comments, approvals)
- Post approval workflow (editor creates → admin approves → posts)
- Content library (saved templates, brand assets)
- Performance alerts (notifications for viral posts, negative sentiment)

### **7.4 Mobile Optimization**
- Responsive account switcher
- Mobile posting interface
- Push notifications for scheduled posts

**Deliverable**: Production-ready, polished experience

---

# 🚀 IMPLEMENTATION PRIORITY ORDER

## **Sprint 1 (Week 1-2): Make SSO Work**
- Build JWT token system
- Implement in TweetGenie first (prove it works)
- User can click "Go to TweetGenie" and land there authenticated

## **Sprint 2 (Week 3-4): Account Switcher**
- Build switcher component
- Deploy to TweetGenie
- Test with 2-3 connected Twitter accounts
- User can switch and see different account data

## **Sprint 3 (Week 5-6): Role Enforcement**
- Implement permission checks
- Test all 4 roles (owner, admin, editor, viewer)
- Ensure editors can't access settings, viewers can't post

## **Sprint 4 (Week 7-8): Multi-Account OAuth**
- Fix duplicate prevention
- Add per-platform limits
- Test connecting 3 Twitter accounts sequentially

## **Sprint 5 (Week 9-10): Replicate to Other Subdomains**
- Deploy SSO, switcher, roles to LinkedInGenie
- Deploy to SuiteGenie
- Now all subdomains work the same way

## **Sprint 6 (Week 11-12): Unified Posting**
- Build quick-post on main platform
- Build team-post APIs on each subdomain
- Test cross-platform posting

## **Sprint 7 (Week 13+): Analytics & Polish**
- Build scheduling calendars
- Build analytics dashboards
- Add account nicknames
- Token refresh automation

---

# 📊 SUCCESS METRICS

After full implementation, your users should be able to:

✅ Create a team and invite 3 members (owner, admin, editor, viewer)  
✅ Connect 3 Twitter accounts, 2 LinkedIn accounts, 1 WordPress site  
✅ Owner clicks "Go to TweetGenie", sees all 3 Twitter accounts, switches between them  
✅ Editor clicks "Go to TweetGenie", creates posts for any Twitter account  
✅ Viewer clicks "Go to TweetGenie", sees analytics but cannot post  
✅ From main platform, create one post and send to 2 Twitter + 1 LinkedIn simultaneously  
✅ View unified dashboard showing today's scheduled posts across all platforms  
✅ No duplicate account connections possible  
✅ Cannot exceed 3 accounts per platform  
✅ Token refresh happens automatically, users never see "disconnected" errors  

---

# ⚠️ CRITICAL IMPLEMENTATION RISKS

## **Risk 1: Token Security**
- **Risk**: JWT tokens stolen or leaked
- **Mitigation**: Short expiry (15-30 min), HTTPS only, HttpOnly cookies, IP validation

## **Risk 2: Account Context Confusion**
- **Risk**: User posts to wrong account
- **Mitigation**: Always show current account prominently, confirmation before posting

## **Risk 3: Role Bypass**
- **Risk**: Editor manipulates frontend to access admin features
- **Mitigation**: Backend validates every request, never trust frontend

## **Risk 4: Cross-Subdomain State**
- **Risk**: User switches account on TweetGenie, goes to main platform, confusion about which account is "active"
- **Mitigation**: Each subdomain maintains its own account context, main platform always shows all accounts

## **Risk 5: OAuth Rate Limits**
- **Risk**: Connecting 8 accounts triggers platform rate limits
- **Mitigation**: Space out connections, implement retry logic, notify users of limits

---

# 🎯 YOUR NEXT ACTION ITEMS

## **This Week:**
- Design the JWT token structure (what fields to include)
- Build SSO token generation on main platform
- Build SSO validation on TweetGenie (prove the concept)

## **Next Week:**
- Test full SSO flow: Main platform → TweetGenie → Authenticated
- Build account switcher component (frontend only)
- Load available accounts from database and display in dropdown

## **Week 3:**
- Implement account switching logic (store selection, reload data)
- Test with 2-3 Twitter accounts connected
- Deploy account switcher to production

---

**🚀 This complete plan provides a clear roadmap from current state to full enterprise-grade social media management platform!**