# SSO Integration for Oppia

**Adding GitHub and LinkedIn Sign-In to Oppia**

---

## About

This project adds **GitHub** and **LinkedIn** authentication to Oppia, an open-source learning platform. Currently, Oppia only supports Google Sign-In. I'm adding more options so users can sign in with their preferred accounts.

**Current:** Google Sign-In only  
**Adding:** GitHub (Phase 1) → LinkedIn (Phase 2)

---

## Tech Stack

**Frontend:**

- Angular 11
- TypeScript 4.1
- Firebase SDK
- RxJS

**Backend:**

- Python 3.10
- Google App Engine
- Firebase Admin SDK

**Authentication:**

- OAuth 2.0
- OpenID Connect 1.0
- JWT (JSON Web Tokens)

**Infrastructure:**

- Docker & Docker Compose
- Redis (caching)
- Elasticsearch (search)
- Google Cloud Datastore (database)

**Development Tools:**

- ESLint, Pylint, MyPy
- Karma, Jasmine, Jest
- Puppeteer (E2E testing)

---

## What I'm Adding

### Phase 1: GitHub Sign-In (Current)

- New "Sign in with GitHub" button
- OAuth 2.0 integration via Firebase
- Same security as Google auth

### Phase 2: LinkedIn Sign-In (Future)

- "Sign in with LinkedIn" button
- Professional network integration
- Reuse GitHub implementation patterns

## Data Flow Diagram

### Level 1 - Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Clicks "Sign in with GitHub"
     ↓
┌─────────────────────────────────────┐
│  Frontend (Angular)                 │
│  - auth.service.ts                  │
│  - sign-in-buttons.component.ts     │
└────┬────────────────────────────────┘
     │
     │ 2. signInWithRedirectAsync('github')
     ↓
┌─────────────────────────────────────┐
│  Firebase SDK                       │
│  - Redirects to GitHub OAuth        │
└────┬────────────────────────────────┘
     │
     │ 3. OAuth Request
     ↓
┌─────────────────────────────────────┐
│  GitHub (External)                  │
│  - User logs in                     │
│  - Authorizes Oppia                 │
└────┬────────────────────────────────┘
     │
     │ 4. Authorization Code
     ↓
┌─────────────────────────────────────┐
│  Firebase Authentication            │
│  - Exchanges code for ID Token      │
└────┬────────────────────────────────┘
     │
     │ 5. ID Token (JWT)
     ↓
┌─────────────────────────────────────┐
│  Frontend (Angular)                 │
│  - auth-backend-api.service.ts      │
└────┬────────────────────────────────┘
     │
     │ 6. POST /session_begin
     │    Header: Bearer <ID_TOKEN>
     ↓
┌─────────────────────────────────────┐
│  Backend (Python)                   │
│  - firebase_auth_services.py        │
│  - Validates token                  │
│  - Extracts user info               │
└────┬────────────────────────────────┘
     │
     │ 7. Create Session Cookie
     ↓
┌─────────────────────────────────────┐
│  Backend (Python)                   │
│  - auth_services.py                 │
│  - Check if user exists             │
└────┬────────────────────────────────┘
     │
     │ 8. Query/Store User
     ↓
┌─────────────────────────────────────┐
│  Database (Datastore)               │
│  - UserAuthDetailsModel             │
│  - UserIdByFirebaseAuthIdModel      │
└────┬────────────────────────────────┘
     │
     │ 9. User Data
     ↓
┌─────────────────────────────────────┐
│  Backend (Python)                   │
│  - Returns session cookie           │
└────┬────────────────────────────────┘
     │
     │ 10. Set-Cookie: session_cookie
     ↓
┌─────────────────────────────────────┐
│  Frontend (Angular)                 │
│  - Stores cookie                    │
│  - Redirects to dashboard           │
└────┬────────────────────────────────┘
     │
     │ 11. User logged in!
     ↓
┌─────────┐
│  User   │
└─────────┘
```

## Files I'm Working With

### **FRONTEND (Angular/TypeScript)**

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

#### Frontend Tests

**6. oppia/core/templates/services/auth.service.spec.ts**

- **What it is:** Test file for auth service
- **Purpose:** Test authentication flows
- **Will test:**
  - GitHub sign-in flow
  - Provider switching
  - Redirect handling
  - Error cases

---

#### Frontend Files to Verify

**7. oppia/core/templates/services/auth-backend-api.service.ts**

- **What it is:** Backend API communication service
- **Current:** Sends tokens to backend
- **Action:** Verify it works with GitHub tokens (no changes needed)

---

#### Backend Tests

**11. oppia/core/platform/auth/firebase_auth_services_test.py**

- **What it is:** Backend authentication tests
- **Purpose:** Test token validation
- **Will test:**
  - GitHub token validation
  - Session creation with GitHub
  - User association with GitHub auth ID

---

## How to Test

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

- GitHub button appears on sign-in page
- Clicking redirects to GitHub
- After login, redirects back to Oppia
- User is logged in with GitHub email
- Session persists on page refresh
- Sign out works correctly

---

## 📋 Implementation Timeline

**Week 2:** Documentation & Planning  
**Week 3:** Firebase + GitHub OAuth setup  
**Week 4:** Frontend implementation  
**Week 5:** Testing & bug fixes  
**Week 6:** PR submission

---

## Author

**Name:** Sristy  
**Institution:** [Your College/University]  
**Project:** SSO Integration for Oppia  
**Duration:** November 2024 - [End Date]  
**Mentor:** [Mentor Name]

---

## Resources

- [Oppia GitHub](https://github.com/oppia/oppia)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [GitHub OAuth Guide](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [LinkedIn OAuth Guide](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)

---

**Last Updated:** November 25, 2024
