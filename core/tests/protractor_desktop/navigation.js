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
var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');
var ThanksPage = require('../protractor_utils/ThanksPage.js');
var GetStartedPage = require('../protractor_utils/GetStartedPage.js');

describe('Oppia static pages tour', function() {
  var thanksPage = null;

  beforeEach(async function() {
    await browser.driver.get("about:blank");
    await browser.get(general.SERVER_URL_PREFIX);
    await waitFor.pageToFullyLoad();
  });

  it('visits the links in About dropdown', async function() {
    var LINKS_CLASS_NAMES = [
      '.protractor-test-about-link',
      '.protractor-test-get-started-link',
      '.protractor-test-playbook-link'
    ];

    for (i = 0; i++; i < LINKS_CLASS_NAMES.length) {
      var className = LINKS_CLASS_NAMES[i];
      var dropdown = element(by.css('.protractor-test-about-oppia-list-item'));
      await browser.actions().mouseMove(dropdown).perform();
      await dropdown.element(by.css(className)).click();
      await waitFor.pageToFullyLoad();
    }
  });

  it('visits the donate link', async function() {
    await element(by.css('.protractor-test-donate-link')).click();
    await waitFor.pageToFullyLoad();
  });

  it('visits the thanks for donating page', async function() {
    thanksPage = new ThanksPage.ThanksPage();
    thanksPage.get();
    await waitFor.pageToFullyLoad();
  });

  it('visits the terms page', async function() {
    browser.ignoresynchronisation = true
    await element(by.css('.protractor-test-terms-link')).click();
    await waitFor.pageToFullyLoad();
  });

  it('visits the privacy page', async function() {
    await element(by.css('.protractor-test-privacy-policy-link')).click();
    await waitFor.pageToFullyLoad();
  });

  it('visits the Fractions landing page', async function() {
    await browser.get('/fractions');
    await waitFor.pageToFullyLoad();
  });

  it('visits the Partners landing page', async function() {
    await browser.get('/partners');
    await waitFor.pageToFullyLoad();
  });

  it('visits the Nonprofits landing page', async function() {
    await browser.get('/nonprofits');
    await waitFor.pageToFullyLoad();
  });

  it('visits the Parents landing page', async function() {
    await browser.get('/parents');
    await waitFor.pageToFullyLoad();
  });

  it('visits the Teachers landing page', async function() {
    await browser.get('/teachers');
    await waitFor.pageToFullyLoad();
  });

  it('visits the Volunteers landing page', async function() {
    await browser.get('/volunteers');
    await waitFor.pageToFullyLoad();
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      // TODO(Jacob): Remove when
      // https://code.google.com/p/google-cast-sdk/issues/detail?id=309 is fixed
      'cast_sender.js - Failed to load resource: net::ERR_FAILED',
      'Uncaught ReferenceError: ytcfg is not defined',
      // TODO(pranavsid98): This error is caused by the upgrade from Chrome 60
      // to Chrome 61. Chrome version at time of recording this is 61.0.3163.
      'chrome-extension://invalid/ - Failed to load resource: net::ERR_FAILED',
      'Error parsing header X-XSS-Protection: 1; mode=block; ' +
      'report=https:\/\/www.google.com\/appserve\/security-bugs\/log\/youtube:',
    ]);
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
      'http://localhost:9001/get_started');
  });

  it('should set the correct application name', async function() {
    expect(await getStartedPage.getMetaTagContent(
      'application-name', 'name')).toEqual('Oppia.org');
  });
});

describe('DEV MODE Test', function() {
  it('should not show Dev Mode label in prod', async function() {
    await browser.get('/');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-dev-mode')).isPresent())
      .toBe(general.isInDevMode());
  });
});

describe('Static Pages Tour', function() {
  var getStartedPage = new GetStartedPage.GetStartedPage();
  it('visits the Get started page', async function() {
    await getStartedPage.get();
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-get-started-page')).isPresent()).toBe(true);
  });

  it('visits the Teach page', async function() {
    await browser.get('/teach');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-teach-page')).isPresent()).toBe(true);
  });

  it('visits the Home page', async function() {
    await browser.get('/');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-splash-page')).isPresent()).toBe(true);
  });

  it('visits the About page', async function() {
    await browser.get('/about');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-about-page')).isPresent()).toBe(true);
  });

  it('visits the Contact page', async function() {
    await browser.get('/contact');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-contact-page')).isPresent()).toBe(true);
  });

  it('visits the Donate page', async function() {
    await browser.get('/donate');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-donate-page')).isPresent()).toBe(true);
  });

  it('visits the Privacy page', async function() {
    await browser.get('/privacy');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-privacy-page')).isPresent()).toBe(true);
  });

  it('visits the Terms page', async function() {
    await browser.get('/terms');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-terms-page')).isPresent()).toBe(true);
  });

  it('visits the Thanks page', async function() {
    await browser.get('/thanks');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-thanks-page')).isPresent()).toBe(true);
  });

  it('shows the error page when an incorrect url is given', async function() {
    await browser.get('/splashes');
    await waitFor.pageToFullyLoad();
    expect(await element(
      by.css('.protractor-test-error-page')).isPresent()).toBe(true);
  });
});
