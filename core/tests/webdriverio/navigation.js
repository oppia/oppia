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

const { remote } = require('webdriverio');

var general = require('../webdriverio_utils/general.js');
var waitFor = require('../webdriverio_utils/waitFor.js');


describe('Oppia landing pages tour', function() {
  it('should visit the Fractions landing page', async function() {
    const browser = await remote({
      capabilities: {
        browserName: 'chrome'
      }
    });
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

  // afterEach(async function() {
  //   await general.checkForConsoleErrors([]);
  // });
});

describe('Donation flow', function() {
  var payPalButton = $('.protractor-test-paypal-donate-button');
  var creditCardButton = $('.protractor-test-credit-card-donate-button');
  it('should be able to donate via PayPal', async function() {
    await browser.url('/donate');
    await action.click('PayPal button', payPalButton);
    expect(await browser.getUrl()).toContain('www.paypal.com');
  });

  it('should be able to donate via credit card', async function() {
    await browser.url('/donate');
    await action.click('Credit Card button', creditCardButton);
    expect(await browser.getUrl()).toContain('www.paypal.com');
  });
});

describe('Static Pages Tour', function() {
  var getStartedPage = new GetStartedPage.GetStartedPage();
  it('should visit the Get started page', async function() {
    await getStartedPage.get();
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-get-started-page').isExisting()).tobeTrue();
  });

  it('should visit the Login page', async function() {
    await browser.url('/login');
    await waitFor.pageToFullyLoad();
    var loginPage = $('.protractor-test-login-page');
    await waitFor.presenceOf(loginPage, 'Login page did not load');
  });

  it('should visit the Teach page', async function() {
    await browser.url('/teach');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-teach-page').isExisting()).tobeTrue();
  });

  it('should visit the Home page', async function() {
    await browser.url('/');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-splash-page').isExisting()).tobeTrue();
  });

  it('should visit the About page', async function() {
    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-about-page')).isExisting().tobeTrue();
  });

  it('should visit the Contact page', async function() {
    await browser.url('/contact');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-contact-page').isExisting()).tobeTrue();
  });

  it('should visit the Donate page', async function() {
    await browser.url('/donate');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-donate-page').isExisting()).tobeTrue();
  });

  it('should visit the Partnerships page', async function() {
    await browser.url('/partnerships');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-partnerships-page').isExisting()).tobeTrue();
  });

  it('should visit the About the Oppia Foundation page', async function() {
    await browser.url('/about-foundation');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-about-foundation-page').isExisting()).tobeTrue();
  });

  it('should visit the Privacy page', async function() {
    await browser.url('/privacy-policy');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-privacy-page').isExisting()).tobeTrue();
  });

  it('should visit the Terms page', async function() {
    await browser.url('/terms');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-terms-page').isExisting()).tobeTrue();
  });

  it('should visit the Thanks page', async function() {
    await browser.url('/thanks');
    await waitFor.pageToFullyLoad();
    expect(await $(
      '.protractor-test-thanks-page').isExisting()).tobeTrue();
  });

  it('should visit the Volunteer page', async function() {
    await browser.url('/volunteer');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      $('.protractor-test-volunteer-page'),
      'Volunteer page taking too long to appear');
  });

  it('should show the error page when an incorrect url is given',
    async function() {
      await browser.url('/splashes');
      await waitFor.pageToFullyLoad();
      await general.expectErrorPage(404);
    });
});

describe('DEV MODE Test', function() {
  it('should not show Dev Mode label in prod', async function() {
    await browser.url('/');
    await waitFor.pageToFullyLoad();
    expect(await $('.protractor-test-dev-mode').isExisting())
      .toBeTrue();
  });
});
