// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Login script to access pages behind authentication for
 * lighthouse checks
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
const LOGIN_URL = 'http://localhost:8181/login';
const LOGOUT_URL = 'http://localhost:8181/logout';
const CREATOR_DASHBOARD_URL = 'http://localhost:8181/creator-dashboard';
const networkIdle = 'networkidle0';
// Bounds every navigation made while preparing an audit. The login, role
// assignment and admin pages can be slow under the emulated appserver, so the
// bound is generous; it exists so a page that never reaches networkidle0 (for
// example because of a long-lived polling request) fails the audit with a
// timeout instead of hanging the shard until the CI step times out.
const LOGIN_NAVIGATION_TIMEOUT_MS = 120000;
// Bounds every element wait that does not pass its own timeout. The navbar is
// rendered only after the Firebase sign-in round trip completes, which can
// exceed Puppeteer's 30s default under the emulated appserver, so the bound is
// raised to keep a slow sign-in from being mistaken for a broken page.
const LOGIN_WAIT_TIMEOUT_MS = 60000;
// The account that audits /signup, and the email it signs in with. It is
// deliberately never registered: the signup page only renders for an account
// that has not finished registration, and SignupPage in
// core/controllers/profile.py sends a registered account to the homepage.
// That redirect is invisible to an audit, because LHCI records lhr.finalUrl
// rather than the URL it asked for.
const SIGNUP_AUDIT_USERNAME = 'signup-audit';
const SIGNUP_AUDIT_EMAIL = 'signup-audit@example.com';
// The accounts available to the audits. The primary test admin is the
// facilitator of the seeded learner group; the learner account is its learner
// and is used to audit the learner-group-viewer page, which is gated on the
// logged-in user being a learner.
const USERNAME_TO_EMAIL = {
  username1: 'testadmin@example.com',
  username2: 'learner@example.com',
  [SIGNUP_AUDIT_USERNAME]: SIGNUP_AUDIT_EMAIL,
};
// The wrapper rendered whenever a page fails to load its content (a 400, 401,
// 404 or 500 response). This class is shared by both the generic error page
// (<error-page>) and the 404 page (<oppia-error-404-page>), so it covers every
// audited page. Lighthouse must never accept an audit result for a page that
// rendered this element, because the error page is cheap and would otherwise
// produce misleadingly good scores.
const ERROR_PAGE_SELECTOR = '.oppia-error-page-main-content';
// The /error routes are themselves error pages, so the absence check below is
// skipped for them.
const ERROR_ROUTE_PREFIX = '/error';
// The single path whose landing URL is verified after the navigation below.
// The signup page is only served to an account that has not completed
// registration, so a registered account would be redirected away from it and
// the audit would silently score the wrong page.
const SIGNUP_PATH = '/signup';

// Feature flags whose value has to differ between pages audited in the same
// shard. Each flag is tracked here so it is only toggled when a page actually
// needs a different value, and the release coordinator role (assigned in the
// shard setup) is what authorises the toggle below.
const NEW_LESSON_PLAYER_FLAG = 'new_lesson_player';
const STORY_EDITOR_ARCS_FLAG = 'story_editor_arcs';
const FEATURE_FLAG_STATES = {
  [NEW_LESSON_PLAYER_FLAG]: false,
  [STORY_EDITOR_ARCS_FLAG]: false,
};

var emailInput = '.e2e-test-sign-in-email-input';
var signInButton = '.e2e-test-sign-in-button';
var usernameInput = '.e2e-test-username-input';
var agreeToTermsCheckBox = '.e2e-test-agree-to-terms-checkbox';
var registerUser = '.e2e-test-register-user:not([disabled])';
var navbarToggle = '.oppia-navbar-dropdown-toggle';

var usernameInputFieldForRolesEditing = '.e2e-test-username-for-role-editor';
var editUserRoleButton = '.e2e-test-role-edit-button';
var roleEditorContainer = '.e2e-test-roles-editor-card-container';
var addNewRoleButton = '.e2e-test-add-new-role-button';
var roleSelect = '.e2e-test-new-role-selector';
var reloadCollectionButton = '.e2e-test-reload-collection-button';

var roleOptionLabels = {
  ADMIN: 'curriculum admin',
  BLOG_ADMIN: 'blog admin',
  COLLECTION_EDITOR: 'collection editor',
  MODERATOR: 'moderator',
};

// Tracks the account currently signed into the shared browser session. LHCI
// reuses one browser across every audited url, so switching accounts requires
// signing the previous one out first.
let currentLoggedInUsername = null;

// Returns the account to audit the given url with. The viewer route is the
// only /learner-group/ page; the editor route lives under /edit-learner-group/,
// so a leading-slash check distinguishes them without matching the editor.
// /signup is audited with the account that has never completed registration,
// because SignupPage sends a registered account to the homepage instead.
const getAuditUsernameForUrl = function (url) {
  const pathname = new URL(url).pathname;
  if (pathname === SIGNUP_PATH) {
    return SIGNUP_AUDIT_USERNAME;
  }
  return pathname.startsWith('/learner-group/') ? 'username2' : 'username1';
};

/**
 * Returns the CSRF token for the logged-in session, stripping the five-byte
 * XSSI prefix that the backend adds to every JSON response.
 *
 * @param {puppeteer.Page} page - The page to issue the request from.
 * @returns {Promise<string>} - The CSRF token.
 */
const getCsrfToken = async function (page) {
  return page.evaluate(async () => {
    const response = await fetch('/csrfhandler', {credentials: 'same-origin'});
    const responseText = await response.text();
    return JSON.parse(responseText.substring(5)).token;
  });
};

/**
 * Sets a feature flag's force-enable-for-all-users value through the release
 * coordinator handler, which is the same endpoint the release coordinator page
 * uses. The value is persisted to the shared datastore that the audit server
 * reads.
 *
 * @param {puppeteer.Page} page - The page to issue the request from.
 * @param {string} flagName - The feature flag name.
 * @param {boolean} enabled - Whether the flag should be force-enabled.
 */
const setFeatureFlag = async function (page, flagName, enabled) {
  const csrfToken = await getCsrfToken(page);
  const succeeded = await page.evaluate(
    async (csrfToken, flagName, enabled) => {
      const response = await fetch('/feature_flags', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          csrf_token: csrfToken,
          payload: JSON.stringify({
            action: 'update_feature_flag',
            feature_flag_name: flagName,
            force_enable_for_all_users: enabled,
            rollout_percentage: 0,
            user_group_ids: [],
          }),
        }).toString(),
      });
      if (!response.ok) {
        return false;
      }
      const body = await response.text();
      try {
        const parsed = JSON.parse(body.substring(5));
        return !parsed.error;
      } catch (error) {
        return response.ok;
      }
    },
    csrfToken,
    flagName,
    enabled
  );
  if (!succeeded) {
    throw new Error(`Failed to set feature flag ${flagName} to ${enabled}.`);
  }
};

/**
 * Returns the feature flag values that the given audited URL requires, or an
 * empty object when the URL does not care about either flag. Deriving the
 * requirement from the URL (rather than from the page's position in its shard)
 * keeps the toggle correct even if the shard ordering changes.
 *
 * @param {string} url - The audited URL.
 * @returns {Object} - A map from flag name to the required boolean value.
 */
const getRequiredFeatureFlagStates = function (url) {
  const pathname = new URL(url).pathname;
  const states = {};
  if (pathname.startsWith('/lesson') || pathname.startsWith('/embed/lesson')) {
    states[NEW_LESSON_PLAYER_FLAG] = true;
  } else if (
    pathname.startsWith('/explore') ||
    pathname.startsWith('/embed/exploration')
  ) {
    states[NEW_LESSON_PLAYER_FLAG] = false;
  }
  if (pathname.endsWith('/practice/session')) {
    states[STORY_EDITOR_ARCS_FLAG] = false;
  } else if (
    /\/practice\/[^/]+$/.test(pathname) ||
    pathname.endsWith('/mastery-challenge') ||
    pathname.indexOf('/test/arc/') !== -1
  ) {
    states[STORY_EDITOR_ARCS_FLAG] = true;
  }
  return states;
};

module.exports = async (browser, context) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(LOGIN_NAVIGATION_TIMEOUT_MS);
  await page.setDefaultTimeout(LOGIN_WAIT_TIMEOUT_MS);
  // Shard 1 audits only the static public pages and runs no login setup, so
  // the accounts this script would sign in as are never seeded. Attempting the
  // sign-in there can only end in the navbar wait timing out on every page, so
  // skip the account switch, sign-in and role setup entirely.
  if (process.env.LIGHTHOUSE_SKIP_LOGIN !== '1') {
    const username = getAuditUsernameForUrl(context.url);
    // The learner-group-viewer page has to be audited as the learner account,
    // and /signup as the account that has never completed registration, while
    // every other page is audited as the primary test admin. Since the browser
    // session is shared, sign the current account out before switching.
    if (
      currentLoggedInUsername !== null &&
      currentLoggedInUsername !== username
    ) {
      await logout(page);
    }
    // Sign into Oppia.
    await login(context, page, username);
    currentLoggedInUsername = username;
    if (context.url.includes('moderator')) {
      await setRole(page, 'MODERATOR');
    } else if (context.url.includes('collection/0')) {
      await createCollections(context, page);
    } else if (context.url.includes('explore/0')) {
      await createExplorations(context, page);
    } else if (context.url.includes('blog-dashboard')) {
      await setRole(page, 'BLOG_ADMIN');
    } else if (context.url.includes('blog-admin')) {
      await setRole(page, 'BLOG_ADMIN');
    }
  }
  if (process.env.LIGHTHOUSE_SKIP_LOGIN !== '1') {
    const requiredFlagStates = getRequiredFeatureFlagStates(context.url);
    for (const flagName of Object.keys(requiredFlagStates)) {
      const requiredValue = requiredFlagStates[flagName];
      if (FEATURE_FLAG_STATES[flagName] !== requiredValue) {
        await setFeatureFlag(page, flagName, requiredValue);
        FEATURE_FLAG_STATES[flagName] = requiredValue;
      }
    }
  }
  await seedBlankPagesForLighthouseRuns(browser, page, context);
  if (!isErrorRoute(context.url)) {
    await assertErrorPageIsAbsent(page, context.url);
  }
  if (new URL(context.url).pathname === SIGNUP_PATH) {
    assertLandedOnRequestedPath(page, context.url);
  }
  await page.close();
};

/**
 * Whether the given audited URL is one of the /error routes, which render the
 * error page on purpose.
 *
 * @param {string} url - The URL being audited.
 * @returns {boolean} True if the URL points at an intentional error route.
 */
const isErrorRoute = function (url) {
  const {pathname} = new URL(url);
  return (
    pathname === ERROR_ROUTE_PREFIX ||
    pathname.startsWith(ERROR_ROUTE_PREFIX + '/')
  );
};

/**
 * Asserts that the page at the given URL did not render the Oppia error page.
 *
 * LHCI invokes this script once per audited URL before Lighthouse collects it,
 * so throwing here stops the run before any audit result is accepted. Without
 * this check a page that silently rendered the error page (for example because
 * a request failed) would still be scored.
 *
 * @param {puppeteer.Page} page - The page to navigate and inspect.
 * @param {string} url - The audited URL to check.
 */
const assertErrorPageIsAbsent = async function (page, url) {
  try {
    // Waits for networkidle2 rather than networkidle0: an audited page can keep
    // one or two requests open (a poll or a long-lived connection), so
    // networkidle0 never settles and the navigation would time out even though
    // the page has rendered. networkidle2 tolerates those requests.
    await page.goto(url, {waitUntil: 'networkidle2'});
  } catch (error) {
    // The page was reached but never went network-idle, usually because of a
    // slow or long-lived request. Inspect whatever it rendered instead of
    // failing here; a page that actually rendered the error page is still
    // caught by the check below.
    // eslint-disable-next-line no-console
    console.log(error);
  }
  const errorPageIsPresent = await page.evaluate(
    selector => document.querySelector(selector) !== null,
    ERROR_PAGE_SELECTOR
  );
  if (errorPageIsPresent) {
    throw new Error(
      `Lighthouse cannot audit ${url}: the ${ERROR_PAGE_SELECTOR} element is ` +
        'present in the DOM, which means the page rendered the Oppia error ' +
        'page instead of its content.'
    );
  }
};

/**
 * Asserts that the loaded page is still at the path of the audited URL.
 *
 * The error-page check above only rejects a URL that rendered the error page,
 * so a URL that silently redirected elsewhere would still be scored, and would
 * be recorded under the page it landed on because LHCI reports lhr.finalUrl.
 * That is exactly how the signup audit disappeared: a registered account makes
 * /signup redirect to the homepage, which then forwards to a dashboard.
 *
 * @param {puppeteer.Page} page - The page to inspect.
 * @param {string} url - The audited URL whose path must be the loaded one.
 */
const assertLandedOnRequestedPath = function (page, url) {
  const requestedPath = new URL(url).pathname;
  const loadedPath = new URL(page.url()).pathname;
  if (loadedPath !== requestedPath) {
    throw new Error(
      `Lighthouse cannot audit ${url}: the page landed on ${loadedPath}, so ` +
        'the audit would score a different page than the one registered for ' +
        'this route.'
    );
  }
};

const seedBlankPagesForLighthouseRuns = async function (
  browser,
  page,
  context
) {
  const numberOfRuns = Number(context.options.numberOfRuns) || 1;

  let pages = await browser.pages();
  for (let i = pages.length; i <= numberOfRuns; i++) {
    const blankPage = await browser.newPage();
    await blankPage.goto('about:blank');
  }
};

// Needed to relogin after lighthouse_setup.js.
const login = async function (context, page, username) {
  const email = USERNAME_TO_EMAIL[username];
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(LOGIN_URL, {waitUntil: networkIdle});
    // The user is already logged in.
    if (!page.url().includes('login')) {
      return;
    }
    await page.waitForSelector(emailInput, {visible: true});
    await page.type(emailInput, email);
    await page.click(signInButton);
    if (username === SIGNUP_AUDIT_USERNAME) {
      // The username input is rendered only by the signup page, so waiting
      // for it proves this unregistered account was signed in and sent
      // there. Stop before submitting the form: registering the account
      // would make SignupPage redirect the audit to the homepage. This wait
      // sits outside the try block below, so an account that is somehow
      // already registered fails the run instead of being read as a normal
      // sign-in.
      await page.waitForSelector(usernameInput, {visible: true});
      return;
    }
    try {
      await page.waitForSelector(usernameInput, {visible: true});
      await page.type(usernameInput, username);
      await Promise.all([
        page.waitForResponse(response =>
          response.url().includes('/usernamehandler/data')
        ),
        page.evaluate(selector => {
          document.querySelector(selector).blur();
        }, usernameInput),
      ]);
      await page.click(agreeToTermsCheckBox);
      await page.waitForSelector(registerUser);
      await page.click(registerUser);
      await page.waitForSelector(navbarToggle);
    } catch (error) {
      // Already registered: signing in redirects to a page with the navbar.
      // Waiting for it confirms the session is established before auditing.
      await page.waitForSelector(navbarToggle);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};

// Signs the current account out so that a different one can sign in. The
// logout page signs out of Firebase and then redirects away from /logout, so a
// short settle is needed before the next login attempts to navigate away.
const logout = async function (page) {
  await page.goto(LOGOUT_URL, {waitUntil: 'networkidle2'});
  await page.waitForTimeout(2000);
};

const setRole = async function (page, role) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/roles', {
      waitUntil: networkIdle,
    });
    await page.waitForSelector(usernameInputFieldForRolesEditing);
    await page.type(usernameInputFieldForRolesEditing, 'username1');
    await page.waitForSelector(editUserRoleButton);
    await page.click(editUserRoleButton);
    await page.waitForSelector(roleEditorContainer);

    await page.waitForSelector(addNewRoleButton);
    await page.click(addNewRoleButton);

    await page.click(roleSelect);
    await page.waitForSelector('mat-option');
    const roleOptionWasSelected = await page.evaluate(
      (role, roleOptionLabels) => {
        const roleOptionLabel = roleOptionLabels[role];
        if (!roleOptionLabel) {
          throw new Error(`No role option label configured for ${role}.`);
        }

        const normalizedRoleOptionLabel = roleOptionLabel.toLowerCase();
        const normalizedRole = role.toLowerCase();
        const options = Array.from(document.querySelectorAll('mat-option'));
        const match = options.find(option => {
          const optionValue = (
            option.getAttribute('ng-reflect-value') ||
            option.getAttribute('value') ||
            option.id ||
            ''
          ).toLowerCase();
          const optionLabel = option.textContent.trim().toLowerCase();

          return (
            optionValue === normalizedRole ||
            optionLabel === normalizedRoleOptionLabel ||
            optionLabel === normalizedRole
          );
        });

        if (!match) {
          return false;
        }

        match.click();
        return true;
      },
      role,
      roleOptionLabels
    );

    if (roleOptionWasSelected) {
      await page.waitForResponse(response =>
        response.url().includes('/adminrolehandler')
      );
    } else {
      const roleIsAlreadyAssigned = await page.evaluate(
        (role, roleOptionLabels, roleEditorContainer) => {
          const roleOptionLabel = roleOptionLabels[role];
          const roleEditorText = document
            .querySelector(roleEditorContainer)
            .textContent.toLowerCase();
          return roleEditorText.includes(roleOptionLabel.toLowerCase());
        },
        role,
        roleOptionLabels,
        roleEditorContainer
      );
      if (!roleIsAlreadyAssigned) {
        throw new Error(`Could not find role option for ${role}.`);
      }
    }
    await page.waitForTimeout(2000);
    // eslint-disable-next-line dot-notation
    await page.goto(CREATOR_DASHBOARD_URL, {waitUntil: networkIdle});
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    throw e;
  }
};

const createCollections = async function (context, page) {
  try {
    // eslint-disable-next-line no-console
    console.log('Creating Collections...');
    await setRole(page, 'COLLECTION_EDITOR');
    // Load the admin activities tab, where the demo collection reload buttons
    // are rendered. The hash selects the tab explicitly so the buttons are
    // present regardless of the page's default tab.
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/activities');
    // The admin page paints its tabs asynchronously and is slow under the
    // emulated appserver, so wait for the reload button itself. The fixed
    // two-second delay this replaced raced that render and intermittently
    // missed the button, leaving the demo collection unreloaded.
    await page.waitForSelector(reloadCollectionButton, {timeout: 60000});
    await page.evaluate('window.confirm = () => true');
    await page.click(reloadCollectionButton);
    // eslint-disable-next-line no-console
    console.log('Collections Created');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};

const createExplorations = async function (context, page) {
  try {
    // eslint-disable-next-line no-console
    console.log('Creating Exploration...');
    // Load in Exploration
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin', {waitUntil: 'networkidle0'});
    await page.waitForTimeout(2000);
    await page.evaluate('window.confirm = () => true');
    await page.click('.e2e-test-reload-exploration-button');
    // eslint-disable-next-line no-console
    console.log('Exploration Created');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};
