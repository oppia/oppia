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
 * @fileoverview End-to-end tests to login, check various pages
 * and then logout.
 */

var LearnerDashboardPage = require(
  '../protractor_utils/LearnerDashboardPage.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');

describe('Login flow', function() {
  var learnerDashboardPage = null;

  beforeAll(function() {
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    var VISITOR_USERNAME = 'desktopAndMobileVisitor';
    users.createAndLoginUser(
      'desktopAndMobileVisitor@loginFlow.com', VISITOR_USERNAME);
  });

  it('should land on the learner dashboard after successful login',
    function() {
      expect(browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/learner_dashboard');
    });

  describe('profile dropdown menu', function() {
    beforeEach(function() {
      users.login('desktopAndMobileVisitor@loginFlow.com');
      learnerDashboardPage.get();
      var profileDropdown = element(by.css(
        '.protractor-test-profile-dropdown'));
      waitFor.elementToBeClickable(
        profileDropdown, 'Could not click profile dropdown');
      profileDropdown.click();
    });

    it('should visit the profile page from the profile dropdown menu',
      function() {
        var profileLink = element(by.css(
          '.protractor-test-profile-link'));
        waitFor.elementToBeClickable(
          profileLink, 'Could not click on the profile link');
        profileLink.click();
        waitFor.pageToFullyLoad();
        expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/profile/desktopAndMobileVisitor');
      });

    it('should visit the creator dashboard from the profile dropdown menu',
      function() {
        var creatorDashboardLink = element(by.css(
          '.protractor-test-creator-dashboard-link'));
        waitFor.elementToBeClickable(
          creatorDashboardLink,
          'Could not click on the creator dashboard link');
        creatorDashboardLink.click();
        waitFor.pageToFullyLoad();
        expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/creator_dashboard');
      });

    it('should visit the learner dashboard from the profile dropdown menu',
      function() {
        var learnerDashboardLink = element(by.css(
          '.protractor-test-learner-dashboard-link'));
        waitFor.elementToBeClickable(
          learnerDashboardLink,
          'Could not click on the learner dashboard link');
        learnerDashboardLink.click();
        waitFor.pageToFullyLoad();
        expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/learner_dashboard');
      });

    it('should visit the notifications page from the profile dropdown menu',
      function() {
        var notificationsDashboardLink = element(by.css(
          '.protractor-test-notifications-link'));
        waitFor.elementToBeClickable(
          notificationsDashboardLink,
          'Could not click on the notifications dashboard link');
        notificationsDashboardLink.click();
        waitFor.pageToFullyLoad();
        expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/notifications_dashboard');
      });

    it('should visit the preferences page from the profile dropdown menu',
      function() {
        var preferencesLink = element(by.css(
          '.protractor-test-preferences-link'));
        waitFor.elementToBeClickable(
          preferencesLink,
          'Could not click on the preferences link');
        preferencesLink.click();
        waitFor.pageToFullyLoad();
        expect(browser.getCurrentUrl()).toEqual('http://localhost:9001/preferences');
      });

    afterEach(function() {
      general.checkForConsoleErrors([]);
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
