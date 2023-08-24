// Copyright 2022 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview End-to-end tests for general site navigation.
 */
var action = require('../webdriverio_utils/action.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var GetStartedPage = require('../webdriverio_utils/GetStartedPage.js');
var PreferencesPage = require('../webdriverio_utils/PreferencesPage.js');

describe('Oppia landing pages tour', function() {
  it('should visit the Fractions landing page', async function() {
    await browser.url('/fractions');
    await waitFor.pageToFullyLoad();

    await browser.url('/learn/maths/fractions');
    await waitFor.pageToFullyLoad();

    await browser.url('/math/fractions');
    await waitFor.pageToFullyLoad();
  });

  it('should visit the Partners landing page', async function() {
    await browser.url('/partners');
    await waitFor.pageToFullyLoad();
  });

  it('should visit the Nonprofits landing page', async function() {
    await browser.url('/nonprofits');
    await waitFor.pageToFullyLoad();
  });

  it('should visit the Parents landing page', async function() {
    await browser.url('/parents');
    await waitFor.pageToFullyLoad();
  });

  it('should visit the Teachers landing page', async function() {
    await browser.url('/teachers');
    await waitFor.pageToFullyLoad();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Meta Tags', function() {
  var EXPECTED_META_NAME = 'Personalized Online Learning from Oppia';
  var EXPECTED_META_DESCRIPTION = 'Learn how to get started using Oppia.';
  var getStartedPage = new GetStartedPage.GetStartedPage();

  beforeEach(async function() {
    await getStartedPage.get();
  });

  it('should set the correct itemprop meta tags', async function() {
    expect(await getStartedPage.getMetaTagContent('name', 'itemprop')).toEqual(
      EXPECTED_META_NAME);
    expect(
      await getStartedPage.getMetaTagContent(
        'description', 'itemprop')).toEqual(EXPECTED_META_DESCRIPTION);
  });

  it('should set the correct og meta tags', async function() {
    expect(await getStartedPage.getMetaTagContent('title', 'og')).toEqual(
      EXPECTED_META_NAME);
    expect(await getStartedPage.getMetaTagContent('description', 'og')).toEqual(
      EXPECTED_META_DESCRIPTION);
    expect(await getStartedPage.getMetaTagContent('url', 'og')).toEqual(
      'http://localhost:8181/get-started');
  });

  it('should set the correct application name', async function() {
    expect(await getStartedPage.getMetaTagContent(
      'application-name', 'name')).toEqual('Oppia.org');
  });
});

describe('DEV MODE Test', function() {
  it('should not show Dev Mode label in prod', async function() {
    await browser.url('/');
    await waitFor.pageToFullyLoad();
    var devMode = await general.isInDevMode();
    expect(await $('.e2e-test-dev-mode').isExisting())
      .toBe(devMode);
  });
});

describe('Donation flow', function() {
  it('should be able to donate via PayPal', async function() {
    await browser.url('/donate');
    let iframeElement = $('.e2e-test-donate-page-iframe');
    await waitFor.presenceOf(
      iframeElement,
      'Donorbox Iframe taking too long to appear.'
    );
  });
});

describe('Static Pages Tour', function() {
  var getStartedPage = new GetStartedPage.GetStartedPage();
  it('should visit the Get started page', async function() {
    await getStartedPage.get();
    await waitFor.pageToFullyLoad();
    expect(await $('.e2e-test-get-started-page').isExisting()).toBe(true);
  });

  it('should visit the Login page', async function() {
    await browser.url('/login');
    await waitFor.pageToFullyLoad();
    var loginPage = $('.e2e-test-login-page');
    await waitFor.presenceOf(loginPage, 'Login page did not load');
  });

  it('should redirect away from the Login page when visited by logged-in user',
    async function() {
      var loginPage = $('.e2e-test-login-page');
      var learnerDashboardPage = (
        $('.e2e-test-learner-dashboard-page'));

      await users.createAndLoginUser('user@navigation.com', 'navigationUser');

      await waitFor.clientSideRedirection(async() => {
        // Login page will redirect user away if logged in.
        await browser.url('/login');

        // Wait for first redirection (login page to splash page).
        await browser.waitUntil(async() => {
          var url = await browser.getUrl();
          // Wait until the URL has changed to something that is not /login.
          return !(/login/.test(url));
        }, { timeout: 10000 });
      },
      (url) => {
        // Wait for second redirection (splash page to preferred dashboard
        // page).
        return url !== 'http://localhost:8181/';
      },
      async() => {
        await waitFor.presenceOf(
          learnerDashboardPage, 'Learner dashboard page did not load');
      });

      expect(await loginPage.isExisting()).toBe(false);

      await users.logout();
      await browser.url('/login');
      await waitFor.pageToFullyLoad();
      await waitFor.presenceOf(loginPage, 'Login page did not load');
    });

  it('should visit the Teach page', async function() {
    await browser.url('/teach');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-teach-page'), 'Teach page takes too long to appear');
  });

  it('should visit the Home page', async function() {
    await browser.url('/');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-splash-page'), 'Splash page takes too long to appear');
  });

  it('should visit the About page', async function() {
    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-about-page'), 'About page takes too long to appear');
  });

  it('should visit the Contact page', async function() {
    await browser.url('/contact');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-contact-page'), 'Contact page takes too long to appear');
  });

  it('should visit the Donate page', async function() {
    await browser.url('/donate');
    await waitFor.pageToFullyLoad();
    let iframeElement = $('.e2e-test-donate-page-iframe');
    await waitFor.presenceOf(
      iframeElement,
      'Donorbox Iframe taking too long to appear.'
    );
  });

  it('should visit the Partnerships page', async function() {
    await browser.url('/partnerships');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-partnerships-page'),
      'Partnerships page takes too long to appear');
  });

  it('should visit the About the Oppia Foundation page', async function() {
    await browser.url('/about-foundation');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-about-foundation-page'),
      'About Foundation page takes too long to appear');
  });

  it('should visit the Privacy page', async function() {
    await browser.url('/privacy-policy');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-privacy-page'), 'Privacy page takes too long to appear');
  });

  it('should visit the Terms page', async function() {
    await browser.url('/terms');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-terms-page'), 'Terms page takes too long to appear');
  });

  it('should visit the Thanks page', async function() {
    await browser.url('/thanks');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-thanks-page'), 'Terms page takes too long to appear');
  });

  it('should visit the Volunteer page', async function() {
    await browser.url('/volunteer');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.e2e-test-volunteer-page'),
      'Volunteer page taking too long to appear');
  });

  it('should show the error page when an incorrect url is given',
    async function() {
      await browser.url('/splashes');
      await waitFor.pageToFullyLoad();
      await general.expectErrorPage(404);
    });
});

describe('Error reporting', function() {
  it('should report a client error to the backend', async() => {
    let preferencesPage = new PreferencesPage.PreferencesPage();
    await users.createUser('lorem@preferences.com', 'loremPreferences');
    await users.login('lorem@preferences.com');
    await preferencesPage.get();
    // This delay is needed so that the page gets a chance to fully load before
    // cookies are deleted. The page makes a backend request for feature flags
    // and the additional pause avoids that being recorded as an error due to
    // the user no longer being logged in.
    // eslint-disable-next-line oppia/e2e-practices
    await browser.pause(2000);
    // Deleting the cookies simulates an expired session error.
    await browser.deleteCookies();
    await browser.setupInterceptor();
    // Expect that the frontend error is sent to the backend handler.
    await browser.expectRequest('POST', '/frontend_errors', 200);
    let creatorDashboardRadio = $('.e2e-test-creator-dashboard-radio');
    await action.click(
      'Creator Dashboard radio', creatorDashboardRadio);
    // Add a 1 second delay to ensure that expected request gets triggered.
    // eslint-disable-next-line oppia/e2e-practices
    await browser.pause(1000);
    await browser.assertExpectedRequestsOnly();
  });
});
