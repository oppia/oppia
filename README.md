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

#### Modified Files

**1. `core/templates/services/auth.service.ts`**

- **Location:** `oppia/core/templates/services/auth.service.ts`
- **What it is:** Core authentication service for all sign-in providers
- **Purpose:** Handles OAuth authentication flows using Firebase SDK
- **Contains:**
  - `signInWithGithubRedirectAsync()` - Initiates GitHub OAuth via Firebase redirect
  - `signInWithGithubUsername()` - Emulator mode GitHub sign-in with username
  - `handleRedirectResultAsync()` - Processes OAuth redirect callback
  - `GithubAuthProvider` instance from Firebase
  - Integration with `authBackendApiService.beginSessionAsync()` for session creation

**2. `core/templates/pages/login-page/login-page.component.ts`**

- **Location:** `oppia/core/templates/pages/login-page/login-page.component.ts`
- **What it is:** TypeScript component logic for the login page
- **Purpose:** Manages login UI interactions and routes to auth service
- **Contains:**
  - `onClickGithubSignIn()` - Production mode handler for GitHub sign-in button
  - `onClickGithubSignInButtonAsync()` - Emulator mode handler with username input
  - `githubUsername` FormControl for emulator testing
  - Event handlers that call `authService` methods

**3. `core/templates/pages/login-page/login-page.component.html`**

- **Location:** `oppia/core/templates/pages/login-page/login-page.component.html`
- **What it is:** HTML template for the login page
- **Purpose:** Displays sign-in buttons and forms
- **Contains:**
  - "Sign in with GitHub" button for production mode
  - GitHub username input field for emulator mode
  - SVG icon references for GitHub branding
  - Click handlers bound to component methods

**4. `core/templates/services/auth-backend-api.service.ts`**

- **Location:** `oppia/core/templates/services/auth-backend-api.service.ts`
- **What it is:** API service for backend authentication communication
- **Purpose:** Sends Firebase ID tokens to backend for session establishment
- **Contains:**
  - `beginSessionAsync(idToken)` - Sends GET request to `/session_begin` endpoint
  - Authorization header with Bearer token
  - Works universally for all Firebase auth providers (Google, GitHub, etc.)

---

#### Created Files

**5. `assets/images/google_signin_buttons/github_signin.svg`**

- **Location:** `oppia/assets/images/google_signin_buttons/github_signin.svg`
- **What it is:** SVG graphic for GitHub sign-in button
- **Purpose:** Visual branding for GitHub authentication option
- **Contains:**
  - GitHub logo SVG
  - Styled for consistent button appearance

---

### **BACKEND (Python)**

#### Created Files

**6. `core/controllers/github_auth.py`**

- **Location:** `oppia/core/controllers/github_auth.py`
- **What it is:** HTTP request handlers for GitHub OAuth flow
- **Purpose:** Handle OAuth authorization and callback (NOT CURRENTLY USED)
- **Contains:**
  - `GitHubAuthHandler` - Initiates OAuth flow (INCOMPLETE)
  - `GitHubCallbackHandler` - Processes OAuth callback (BROKEN - line 97 truncated)
  - State token CSRF protection
  - Token exchange logic
  - User creation/retrieval calls
- **Issues:**
  - Syntax errors (incomplete lines, indentation problems)
  - Not compatible with Firebase flow used by frontend
  - Routes registered but never called

**7. `core/domain/github_auth_services.py`**

- **Location:** `oppia/core/domain/github_auth_services.py`
- **What it is:** Domain services for GitHub authentication (EMPTY FILE)
- **Purpose:** Should contain business logic for GitHub auth
- **Contains:** Nothing (file is empty)

---

#### Modified Files

**8. `core/domain/auth_services.py`**

- **Location:** `oppia/core/domain/auth_services.py`
- **What it is:** Core authentication domain services
- **Purpose:** Manages auth sessions and tokens
- **Contains:**
  - `establish_auth_session_for_github_user()` - Creates authenticated session for GitHub users
  - `_create_session_token()` - Generates secure session tokens
  - `_store_github_session()` - Caches GitHub session data
  - `get_user_id_from_github_session()` - Retrieves user ID from session
  - `GITHUB_OAUTH_STATE_COOKIE_NAME` constant
  - `GITHUB_AUTH_SESSION_COOKIE_NAME` constant

**9. `core/domain/user_services.py`**

- **Location:** `oppia/core/domain/user_services.py`
- **What it is:** User management domain services
- **Purpose:** Creates and manages user accounts
- **Contains:**
  - `get_or_create_user_by_github_auth()` (line 1259) - Gets existing user or creates new account from GitHub OAuth data
  - Checks `UserIdByGitHubAuthIdModel` for existing associations
  - Creates new user with GitHub email or synthetic email
  - Stores GitHub ID → User ID mapping

**10. `core/platform/auth/firebase_auth_services.py`**

- **Location:** `oppia/core/platform/auth/firebase_auth_services.py`
- **What it is:** Firebase authentication platform services
- **Purpose:** Validates Firebase ID tokens and manages Firebase sessions
- **Contains:**
  - `establish_auth_session()` - Creates session from Firebase ID token
  - `get_auth_claims_from_request()` - Extracts user info from Firebase token
  - Token validation using `firebase_admin` SDK
  - Works with all Firebase providers (Google, GitHub, etc.)

**11. `main.py`**

- **Location:** `oppia/main.py`
- **What it is:** Main application routing configuration
- **Purpose:** Maps URLs to handler classes
- **Contains:**
  - Import of `github_auth` module (line 21)
  - Route registration for `/auth/github` → `GitHubAuthHandler` (line 1365)
  - Route registration for `/auth/github/callback` → `GitHubCallbackHandler` (line 1366)
- **Note:** Routes are registered but unused because frontend uses Firebase

**12. `core/controllers/base.py`**

- **Location:** `oppia/core/controllers/base.py`
- **What it is:** Base HTTP request handlers
- **Purpose:** Provides common handler functionality
- **Contains:**
  - `SessionBeginHandler` - Handles `/session_begin` endpoint
  - Calls `auth_services.establish_auth_session()` to create session
  - Works for all authentication providers

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
