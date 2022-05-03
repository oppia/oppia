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


var general = require('../webdriverio_utils/general.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var action = require('../webdriverio_utils/action.js');
var GetStartedPage = require('../webdriverio_utils/GetStartedPage.js');

describe('Oppia landing pages tour', () => {
  it('should visit the Fractions landing page', async() => {
    await browser.url('/fractions');

    await browser.url('/learn/maths/fractions');

    await browser.url('/math/fractions');
  });

  it('should visit the Partners landing page', async() => {
    await browser.url('/partners');
  });

  it('should visit the Nonprofits landing page', async() => {
    await browser.url('/nonprofits');
  });

  it('should visit the Parents landing page', async() => {
    await browser.url('/parents');
  });

  it('should visit the Teachers landing page', async() => {
    await browser.url('/teachers');
  });
});

describe('Donation flow', () => {
  it('should be able to donate via PayPal', async() => {
    await browser.url('/donate');
    var payPalButton = await $('.protractor-test-paypal-donate-button');
    await action.click('PayPal button', payPalButton);
    expect(await browser.getUrl()).toContain('www.paypal.com');
  });

  it('should be able to donate via credit card', async() => {
    await browser.url('/donate');
    var creditCardButton = await $(
      '.protractor-test-credit-card-donate-button');
    await action.click('Credit Card button', creditCardButton);
    expect(await browser.getUrl()).toContain('www.paypal.com');
  });
});

describe('Static Pages Tour', () => {
  var getStartedPage = new GetStartedPage.GetStartedPage();
  it('should visit the Get started page', async() => {
    await getStartedPage.get();
    expect(await $(
      '.protractor-test-get-started-page').isExisting()).tobeTrue();
  });

  it('should visit the Login page', async() => {
    await browser.url('/login');
    var loginPage = $('.protractor-test-login-page');
    await waitFor.presenceOf(loginPage, 'Login page did not load');
  });

  it('should visit the Teach page', async() => {
    await browser.url('/teach');
    expect(await $(
      '.protractor-test-teach-page').isExisting()).tobeTrue();
  });

  it('should visit the Home page', async() => {
    await browser.url('/');
    expect(await $(
      '.protractor-test-splash-page').isExisting()).tobeTrue();
  });

  it('should visit the About page', async() => {
    await browser.url('/about');
    expect(await $(
      '.protractor-test-about-page')).isExisting().tobeTrue();
  });

  it('should visit the Contact page', async() => {
    await browser.url('/contact');
    expect(await $(
      '.protractor-test-contact-page').isExisting()).tobeTrue();
  });

  it('should visit the Donate page', async() => {
    await browser.url('/donate');
    expect(await $(
      '.protractor-test-donate-page').isExisting()).tobeTrue();
  });

  it('should visit the Partnerships page', async() => {
    await browser.url('/partnerships');
    expect(await $(
      '.protractor-test-partnerships-page').isExisting()).tobeTrue();
  });

  it('should visit the About the Oppia Foundation page', async() => {
    await browser.url('/about-foundation');
    expect(await $(
      '.protractor-test-about-foundation-page').isExisting()).tobeTrue();
  });

  it('should visit the Privacy page', async() => {
    await browser.url('/privacy-policy');
    expect(await $(
      '.protractor-test-privacy-page').isExisting()).tobeTrue();
  });

  it('should visit the Terms page', async() => {
    await browser.url('/terms');
    expect(await $(
      '.protractor-test-terms-page').isExisting()).tobeTrue();
  });

  it('should visit the Thanks page', async() => {
    await browser.url('/thanks');
    expect(await $(
      '.protractor-test-thanks-page').isExisting()).tobeTrue();
  });

  it('should visit the Volunteer page', async() => {
    await browser.url('/volunteer');
    await waitFor.visibilityOf(
      $('.protractor-test-volunteer-page'),
      'Volunteer page taking too long to appear');
  });

  it('should show the error page when an incorrect url is given',
    async() => {
      await browser.url('/splashes');

      await general.expectErrorPage(404);
    });
});

describe('DEV MODE Test', () => {
  it('should not show Dev Mode label in prod', async() => {
    await browser.url('/');
    expect(await $('.protractor-test-dev-mode').isExisting())
      .toBeTrue();
  });
});
