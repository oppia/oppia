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
 * @fileoverview End-to-end tests to login, check various pages
 * and then logout.
 */

var action = require('../webdriverio_utils/action.js');
var LearnerDashboardPage = require(
  '../webdriverio_utils/LearnerDashboardPage.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');

describe('Profile menu flow', function() {
  var learnerDashboardPage = null;

  beforeAll(async function() {
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    var VISITOR_USERNAME = 'desktopAndMobileVisitor';
    await users.createUser(
      'desktopAndMobileVisitor@profileMenuFlow.com', VISITOR_USERNAME);
  });

  it('should visit the topics and skills dashboard from the profile ' +
    'dropdown menu when user is admin', async function() {
    await users.createAndLoginCurriculumAdminUser(
      'desktopAndMobileAdm@profileMenuFlow.com', 'desktopAndMobileAdm');
    await learnerDashboardPage.get();
    await general.navigateToTopicsAndSkillsDashboardPage();
    await waitFor.pageToFullyLoad();
    expect(await browser.getUrl()).toEqual(
      'http://localhost:8181/topics-and-skills-dashboard');
  });

  describe('profile dropdown menu', function() {
    beforeEach(async function() {
      await users.login('desktopAndMobileVisitor@profileMenuFlow.com');
      await learnerDashboardPage.get();
      await general.openProfileDropdown();
    });

    it('should land on the learner dashboard after successful login',
      async function() {
        expect(await browser.getUrl()).toEqual(
          'http://localhost:8181/learner-dashboard');
      });

    it('should visit the profile page from the profile dropdown menu',
      async function() {
        var profileLink = $('.e2e-test-profile-link');
        await action.click('Profile Link', profileLink);
        await waitFor.pageToFullyLoad();
        expect(await browser.getUrl()).toEqual(
          'http://localhost:8181/profile/desktopAndMobileVisitor');
      });

    it('should visit the creator dashboard from the profile dropdown menu',
      async function() {
        var creatorDashboardLink = $('.e2e-test-creator-dashboard-link');
        await action.click('Creator Dashboard Link', creatorDashboardLink);
        await waitFor.pageToFullyLoad();
        expect(await browser.getUrl()).toEqual(
          'http://localhost:8181/creator-dashboard');
      });

    it('should visit the learner dashboard from the profile dropdown menu',
      async function() {
        var learnerDashboardLink = $('.e2e-test-learner-dashboard-link');
        await action.click('Learner Dashboard Link', learnerDashboardLink);
        await waitFor.pageToFullyLoad();
        expect(await browser.getUrl()).toEqual(
          'http://localhost:8181/learner-dashboard');
      });

    it('should not show the topics and skills dashboard link in the profile ' +
      'dropdown menu when user is not admin', async function() {
      var links = await $$('.e2e-test-topics-and-skills-dashboard-link');
      expect(links.length).toEqual(0);
    });

    it('should visit the preferences page from the profile dropdown menu',
      async function() {
        var preferencesLink = $('.e2e-test-preferences-link');
        await action.click('Preferences Link', preferencesLink);
        await waitFor.pageToFullyLoad();
        expect(await browser.getUrl()).toEqual(
          'http://localhost:8181/preferences');
      });
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
