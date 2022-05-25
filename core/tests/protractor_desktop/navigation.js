// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
var action = require('../protractor_utils/action.js');
var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');
var GetStartedPage = require('../protractor_utils/GetStartedPage.js');

describe('Oppia landing pages tour', function() {
  it('should visit the Fractions landing page', async function() {
    await browser.get('/fractions');
    await waitFor.pageToFullyLoad();

    await browser.get('/learn/maths/fractions');
    await waitFor.pageToFullyLoad();

    await browser.get('/math/fractions');
    await waitFor.pageToFullyLoad();
  });

  it('should visit the Partners landing page', async function() {
    await browser.get('/partners');
    await waitFor.pageToFullyLoad();
  });

  it('should visit the Nonprofits landing page', async function() {
    await browser.get('/nonprofits');
    await waitFor.pageToFullyLoad();
  });

  it('should visit the Parents landing page', async function() {
    await browser.get('/parents');
    await waitFor.pageToFullyLoad();
  });

  it('should visit the Teachers landing page', async function() {
    await browser.get('/teachers');
    await waitFor.pageToFullyLoad();
  });
});

describe('DEV MODE Test', function() {
  it('should not show Dev Mode label in prod', async function() {
    await browser.get('/');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-dev-mode')).isPresent())
      .toBe(false);
  });
});

describe('Donation flow', function() {
  var payPalButton = element(by.css('.protractor-test-paypal-donate-button'));
  var creditCardButton = element(
    by.css('.protractor-test-credit-card-donate-button'));
  it('should be able to donate via PayPal', async function() {
    await browser.get('/donate');
    await action.click('PayPal button', payPalButton);
    expect(await browser.driver.getCurrentUrl()).toContain('www.paypal.com');
  });

  it('should be able to donate via credit card', async function() {
    await browser.get('/donate');
    await action.click('Credit Card button', creditCardButton);
    expect(await browser.driver.getCurrentUrl()).toContain('www.paypal.com');
  });
});

describe('Static Pages Tour', function() {
  var getStartedPage = new GetStartedPage.GetStartedPage();
  it('should visit the Get started page', async function() {
    await getStartedPage.get();
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-get-started-page')).isPresent()).toBe(true);
  });

  it('should visit the Login page', async function() {
    await browser.get('/login');
    await waitFor.pageToFullyLoad();
    var loginPage = element(by.css('.protractor-test-login-page'));
    await waitFor.presenceOf(loginPage, 'Login page did not load');
  });

  it('should visit the Teach page', async function() {
    await browser.get('/teach');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-teach-page')).isPresent()).toBe(true);
  });

  it('should visit the Home page', async function() {
    await browser.get('/');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-splash-page')).isPresent()).toBe(true);
  });

  it('should visit the About page', async function() {
    await browser.get('/about');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-about-page')).isPresent()).toBe(true);
  });

  it('should visit the Contact page', async function() {
    await browser.get('/contact');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-contact-page')).isPresent()).toBe(true);
  });

  it('should visit the Donate page', async function() {
    await browser.get('/donate');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-donate-page')).isPresent()).toBe(true);
  });

  it('should visit the Partnerships page', async function() {
    await browser.get('/partnerships');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-partnerships-page')).isPresent()).toBe(true);
  });

  it('should visit the About the Oppia Foundation page', async function() {
    await browser.get('/about-foundation');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-about-foundation-page')).isPresent()).toBe(true);
  });

  it('should visit the Privacy page', async function() {
    await browser.get('/privacy-policy');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-privacy-page')).isPresent()).toBe(true);
  });

  it('should visit the Terms page', async function() {
    await browser.get('/terms');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-terms-page')).isPresent()).toBe(true);
  });

  it('should visit the Thanks page', async function() {
    await browser.get('/thanks');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-thanks-page')).isPresent()).toBe(true);
  });

  it('should visit the Volunteer page', async function() {
    await browser.get('/volunteer');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      element(by.css('.protractor-test-volunteer-page')),
      'Volunteer page taking too long to appear');
  });

  it('should show the error page when an incorrect url is given',
    async function() {
      await browser.get('/splashes');
      await waitFor.pageToFullyLoad();
      await general.expectErrorPage(404);
    });
});
