# SSO Integration for Oppia

**Adding GitHub and LinkedIn Sign-In to Oppia**

---

## 📖 About

This project adds **GitHub** and **LinkedIn** authentication to Oppia, an open-source learning platform. Currently, Oppia only supports Google Sign-In. I'm adding more options so users can sign in with their preferred accounts.

**Current:** Google Sign-In only  
**Adding:** GitHub (Phase 1) -> LinkedIn (Phase 2)

---

## 🎯 What I'm Adding

### Phase 1: GitHub Sign-In (Current)

- New "Sign in with GitHub" button
- OAuth 2.0 integration via Firebase
- Same security as Google auth

### Phase 2: LinkedIn Sign-In (Future)

- "Sign in with LinkedIn" button
- Professional network integration
- Reuse GitHub implementation patterns

---

## 🔄 User Flow

```
┌─────────────────────────────────────┐
│     Welcome to Oppia - Sign In      │
├─────────────────────────────────────┤
│                                     │
│  [🔵 Sign in with Google]          │
│                                     │
│  [⚫ Sign in with GitHub]  <- NEW   │
│                                     │
│  [🔷 Sign in with LinkedIn] <- SOON │
│                                     │
└─────────────────────────────────────┘
         ↓
User clicks GitHub button
         ↓
Redirects to GitHub login
         ↓
User logs in with GitHub
         ↓
GitHub sends back token
         ↓
Oppia validates & creates session
         ↓
User is logged in! ✅
```

---

## 🔧 How to Use This Feature

### For Developers Testing Locally:

**1. Enable GitHub OAuth in Firebase:**

```
1. Go to Firebase Console
2. Authentication -> Sign-in method
3. Enable "GitHub" provider
4. Add your GitHub OAuth credentials
```

**2. Create GitHub OAuth App:**

```
1. Go to GitHub Settings -> Developer settings -> OAuth Apps
2. Click "New OAuth App"
3. Set callback URL: http://localhost:8181/__/auth/handler
4. Copy Client ID and Client Secret
5. Paste in Firebase Console
```

**3. Configuration Fields Needed:**

- GitHub Client ID
- GitHub Client Secret
- Firebase API Key (already in app.constants.ts)

**4. Test the Button:**

```bash
# Start Oppia
docker-compose up

# Go to http://localhost:8181
# Click "Sign in with GitHub"
# Should redirect to GitHub login
```

---

## 📂 Files I'm Working With

### 🎨 **FRONTEND (Angular/TypeScript)**

#### Files I Will Edit

**1. oppia/core/templates/services/auth.service.ts**

- **What it is:** Main authentication service
- **Current:** Handles Google Sign-In only
- **Changes:**
  - Add GitHub provider
  - Update signInWithRedirectAsync() to accept provider type
  - Add provider selection logic

**2. oppia/core/templates/pages/oppia-root/oppia-root.module.ts**

- **What it is:** Angular module registration
- **Current:** Registers all components
- **Changes:**
  - Import SignInButtonsComponent
  - Add to declarations array

---

#### Files I Will Create

**3. oppia/core/templates/components/sign-in-buttons/sign-in-buttons.component.ts**

- **What it is:** New component for sign-in buttons
- **Purpose:** Handle button clicks for different providers
- **Will contain:**
  - signInWithGoogle() method
  - signInWithGitHub() method
  - signInWithLinkedIn() method (future)

**4. oppia/core/templates/components/sign-in-buttons/sign-in-buttons.component.html**

- **What it is:** UI template for buttons
- **Purpose:** Display sign-in buttons
- **Will contain:**
  - Google button
  - GitHub button
  - LinkedIn button (future)

**5. oppia/core/templates/components/sign-in-buttons/sign-in-buttons.component.css**

- **What it is:** Styling for buttons
- **Purpose:** Make buttons look good
- **Will contain:**
  - Button layout and spacing
  - Provider-specific colors
  - Hover effects

---

#### 🧪 Frontend Tests

**6. oppia/core/templates/services/auth.service.spec.ts**

- **What it is:** Test file for auth service
- **Purpose:** Test authentication flows
- **Will test:**
  - GitHub sign-in flow
  - Provider switching
  - Redirect handling
  - Error cases

---

#### 🔍 Frontend Files to Verify (No Changes)

**7. oppia/core/templates/services/auth-backend-api.service.ts**

- **What it is:** Backend API communication service
- **Current:** Sends tokens to backend
- **Action:** Verify it works with GitHub tokens (no changes needed)

---

### **BACKEND (Python)**

#### 🔍 Files I Will Check (No Changes Needed)

**8. oppia/core/platform/auth/firebase_auth_services.py**

- **What it is:** Main backend authentication service
- **Current:** Validates tokens and creates sessions
- **Action:** Verify GitHub tokens work with existing validation
- **Why no changes:** Already supports all OAuth providers!

**9. oppia/core/domain/auth_services.py**

- **What it is:** Domain layer authentication service
- **Current:** User account management
- **Action:** Verify user creation works with GitHub
- **Why no changes:** Provider-agnostic design

**10. oppia/core/domain/auth_domain.py**

- **What it is:** Authentication data structures
- **Current:** Defines AuthClaims, UserAuthDetails
- **Action:** Verify it handles GitHub data
- **Why no changes:** Works with all providers

---

#### 🧪 Backend Tests

**11. oppia/core/platform/auth/firebase_auth_services_test.py**

- **What it is:** Backend authentication tests
- **Purpose:** Test token validation
- **Will test:**
  - GitHub token validation
  - Session creation with GitHub
  - User association with GitHub auth ID

---

### 📊 Summary

| Category            | Count        | Details                                                     |
| ------------------- | ------------ | ----------------------------------------------------------- |
| **Frontend Edit**   | 2 files      | auth.service.ts, oppia-root.module.ts                       |
| **Frontend Create** | 3 files      | Component (ts, html, css)                                   |
| **Frontend Test**   | 1 file       | auth.service.spec.ts                                        |
| **Frontend Verify** | 1 file       | auth-backend-api.service.ts                                 |
| **Backend Verify**  | 3 files      | firebase_auth_services.py, auth_services.py, auth_domain.py |
| **Backend Test**    | 1 file       | firebase_auth_services_test.py                              |
| **TOTAL**           | **11 files** | 7 Frontend + 4 Backend                                      |

---

## 🧪 How to Test

### Manual Testing:

```bash
# 1. Start Oppia
docker-compose up

# 2. Open browser
http://localhost:8181

# 3. Click "Sign in with GitHub"

# 4. Log in with GitHub account

# 5. Should redirect back and be logged in
```

### Automated Tests:

```bash
# Frontend tests
python -m scripts.run_frontend_tests

# Backend tests
python -m scripts.run_backend_tests

# All checks
python -m scripts.run_presubmit_checks
```

### What to Verify:

- ✅ GitHub button appears on sign-in page
- ✅ Clicking redirects to GitHub
- ✅ After login, redirects back to Oppia
- ✅ User is logged in with GitHub email
- ✅ Session persists on page refresh
- ✅ Sign out works correctly

---

## 📋 Implementation Timeline

**Week 2:** ✅ Documentation & Planning  
**Week 3:** Firebase + GitHub OAuth setup  
**Week 4:** Frontend implementation  
**Week 5:** Testing & bug fixes  
**Week 6:** PR submission

---

## 🔗 Related PRs

**My PRs:**

- [ ] #XXXX - Add GitHub SSO (In Progress)
- [ ] #XXXX - Add LinkedIn SSO (Future)

**Reference PRs I Studied:**

- Firebase authentication migration
- OAuth provider integration
- Session management improvements

---

## 👤 Author

**Name:** Sristy  
**Institution:** [Your College/University]  
**Project:** SSO Integration for Oppia  
**Duration:** November 2024 - [End Date]  
**Mentor:** [Mentor Name]

---

## 📚 Resources

- [Oppia GitHub](https://github.com/oppia/oppia)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [GitHub OAuth Guide](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [LinkedIn OAuth Guide](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)

---

**Last Updated:** November 25, 2024
