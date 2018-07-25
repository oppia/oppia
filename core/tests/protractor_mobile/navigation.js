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
 * @fileoverview  End-to-end tests for testing navigation
 * on mobile as a guest and check for any console errors.
 */

var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');

var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('navigation features on mobile', function() {
  var libraryPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    libraryPage.get();
  });

  it('should open the sidebar menu by clicking on the hamburger button',
    function() {
      var navbarButton = element(
        by.css('.protractor-mobile-test-navbar-button'));
      waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      navbarButton.click();
      var sidebarMenuOpen = element(by.css('.oppia-sidebar-menu-open'));
      expect(sidebarMenuOpen).not.toBeNull();
    });

  it('should navigate to About page using the sidebar menu',
    function() {
      var navbarButton = element(
        by.css('.protractor-mobile-test-navbar-button'));
      waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      navbarButton.click();
      var aboutLink = element(by.css('.protractor-mobile-test-about-link'));
      waitFor.elementToBeClickable(
        aboutLink, 'Could not click about link');
      aboutLink.click();
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/about');
    });

  it('should navigate to Get Started page using the sidebar menu',
    function() {
      var navbarButton = element(
        by.css('.protractor-mobile-test-navbar-button'));
      waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      navbarButton.click();
      var getStartedLink = element(
        by.css('.protractor-mobile-test-get-started-link'));
      waitFor.elementToBeClickable(
        getStartedLink, 'Could not click get started link');
      getStartedLink.click();
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/get_started');
    });

  it('should navigate to Teach with Oppia page using the sidebar menu',
    function() {
      var navbarButton = element(
        by.css('.protractor-mobile-test-navbar-button'));
      waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      navbarButton.click();
      var teachLink = element(
        by.css('.protractor-mobile-test-teach-link'));
      waitFor.elementToBeClickable(
        teachLink, 'Could not click teach link');
      teachLink.click();
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/teach');
    });

  it('should navigate to Donate page using the sidebar menu',
    function() {
      var navbarButton = element(
        by.css('.protractor-mobile-test-navbar-button'));
      waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      navbarButton.click();
      var donateLink = element(
        by.css('.protractor-mobile-test-donate-link'));
      waitFor.elementToBeClickable(
        donateLink, 'Could not click donate link');
      donateLink.click();
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/donate');
    });

  it('should navigate to Contact page using the sidebar menu',
    function() {
      var navbarButton = element(
        by.css('.protractor-mobile-test-navbar-button'));
      waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      navbarButton.click();
      var contactLink = element(
        by.css('.protractor-mobile-test-contact-link'));
      waitFor.elementToBeClickable(
        contactLink, 'Could not click contact link');
      contactLink.click();
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/contact');
    });

  it('should navigate to Library page using the sidebar menu',
    function() {
      var navbarButton = element(
        by.css('.protractor-mobile-test-navbar-button'));
      waitFor.elementToBeClickable(
        navbarButton, 'Could not click navbar button');
      navbarButton.click();
      var libraryLink = element(by.css('.protractor-mobile-test-library-link'));
      waitFor.elementToBeClickable(
        libraryLink, 'Could not click library link');
      libraryLink.click();
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/library');
    });

  it('should navigate to Splash page by clicking on the Oppia logo',
    function() {
      var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));
      waitFor.elementToBeClickable(
        oppiaLogo, 'Could not click oppia logo');
      oppiaLogo.click();
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/splash');
    });

  it('should navigate to the login page by clicking on the sign in button',
    function() {
      var signInButton = element(
        by.css('.protractor-mobile-test-login'));
      waitFor.elementToBeClickable(
        signInButton, 'Could not click sign in button');
      // For the rationale behind this statement, see
      // https://github.com/angular/protractor/issues/2643#issuecomment-213257116
      browser.ignoreSynchronization = true;
      signInButton.click();
      // We should not wait for angular here since
      // the login page is non-angular.
      expect(browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/_ah/login?continue=http%3A//localhost%3A9001/signup%3Freturn_url%3Dhttp%253A%252F%252Flocalhost%253A9001%252Flibrary');
      browser.ignoreSynchronization = false;
    });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
