// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for testing navigation
 * on mobile as a guest and check for any console errors.
 */

var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');

var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Navigation features on mobile', function() {
  var libraryPage = null;

  beforeEach(async function() {
    libraryPage = new LibraryPage.LibraryPage();
    await libraryPage.get();
  });

  it('should open the sidebar menu by clicking on the hamburger button',
    async function() {
      var navbarButton = element(
        by.css('.e2e-mobile-test-navbar-button'));
      await waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      await navbarButton.click();
      var sidebarMenuOpen = element(by.css('.oppia-sidebar-menu-open'));
      expect(await sidebarMenuOpen).not.toBeNull();
    });

  it('should navigate to About page using the sidebar menu',
    async function() {
      var navbarButton = element(
        by.css('.e2e-mobile-test-navbar-button'));
      await waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      await navbarButton.click();
      var aboutLink = element(by.css('.e2e-mobile-test-about-link'));
      await waitFor.elementToBeClickable(
        aboutLink, 'Could not click about link');
      await aboutLink.click();
      await waitFor.pageToFullyLoad();
      expect(await browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/about');
    });

  it('should navigate to Donate page using the sidebar menu',
    async function() {
      var navbarButton = element(
        by.css('.e2e-mobile-test-navbar-button'));
      await waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      await navbarButton.click();
      var donateLink = element(
        by.css('.e2e-mobile-test-donate-link'));
      await waitFor.elementToBeClickable(
        donateLink, 'Could not click donate link');
      await donateLink.click();
      await waitFor.pageToFullyLoad();
      expect(await browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/donate');
    });

  it('should navigate to Library page using the sidebar menu',
    async function() {
      var navbarButton = element(
        by.css('.e2e-mobile-test-navbar-button'));
      await waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      await navbarButton.click();
      var learnButton = element(
        by.css('.e2e-mobile-test-learn'));
      await waitFor.elementToBeClickable(
        learnButton, 'Could not click learn button');
      await learnButton.click();
      var libraryLink = element(by.css('.e2e-mobile-test-library-link'));
      await waitFor.elementToBeClickable(
        libraryLink, 'Could not click library link');
      await libraryLink.click();
      await waitFor.pageToFullyLoad();
      expect(await browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/community-library');
    });

  it('should navigate to Classroom page using the sidebar menu',
    async function() {
      var navbarButton = element(
        by.css('.e2e-mobile-test-navbar-button'));
      await waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      await navbarButton.click();
      var learnButton = element(
        by.css('.e2e-mobile-test-learn'));
      await waitFor.elementToBeClickable(
        learnButton, 'Could not click learn button');
      await learnButton.click();
      var mathematicsLink = element(
        by.css('.e2e-mobile-test-mathematics-link'));
      await waitFor.elementToBeClickable(
        mathematicsLink, 'Could not click mathematics link');
      await mathematicsLink.click();
      await waitFor.pageToFullyLoad();
      expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/learn/math');
    });

  it('should navigate to Home page by clicking on the Oppia logo',
    async function() {
      var oppiaLogo = element(by.css('.e2e-test-oppia-main-logo'));
      await waitFor.elementToBeClickable(
        oppiaLogo, 'Could not click oppia logo');
      await oppiaLogo.click();
      await waitFor.pageToFullyLoad();
      expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/');
    });

  it('should navigate to the login page by clicking on the sign in button',
    async function() {
      var signInButton = element(
        by.css('.e2e-mobile-test-login'));
      await waitFor.elementToBeClickable(
        signInButton, 'Could not click sign in button');
      // For the rationale behind this statement, see
      // https://github.com/angular/protractor/issues/2643#issuecomment-213257116
      // Here, we are transitioning from an angular page (Library page) to a
      // non-angular page (Login page) using the 'Sign In' button. Protractor,
      // by default, waits for angular to load completely. Since there is no
      // angular on the login page, the test times out saying,
      // "Could not find Angular on this page...". The
      // browser.ignoreSynchronization = true asks Protractor
      // not to wait for the Angular page.
      browser.ignoreSynchronization = true;
      await signInButton.click();
      // We should not wait for angular here since
      // the login page is non-angular.
      expect(await browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/login?return_url=http%253A%252F%252Flocalhost%253A9001%252Flibrary');
      // As soon as this page loads up, we are again
      // setting browser.ignoreSynchronization = false
      // to prevent any flakiness.
      browser.ignoreSynchronization = false;
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
