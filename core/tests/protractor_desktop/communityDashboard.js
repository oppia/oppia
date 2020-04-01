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
 * @fileoverview End-to-end tests for the community dashboard page.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var CommunityDashboardPage = require(
  '../protractor_utils/CommunityDashboardPage.js');

describe('Community dashboard page', function() {
  var communityDashboardPage = null;
  var communityDashboardTranslateTextTab = null;

  beforeAll(function() {
    communityDashboardPage = (
      new CommunityDashboardPage.CommunityDashboardPage());
    communityDashboardTranslateTextTab = (
      communityDashboardPage.getTranslateTextTab());
  });

  it('should allow user to switch to translate text tab', function() {
    communityDashboardPage.get();
    communityDashboardPage.navigateToTranslateTextTab();
    communityDashboardTranslateTextTab.changeLanguage('Hindi');
    communityDashboardTranslateTextTab.expectSelectedLanguageToBe('Hindi');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Admin page community reviewer form', function() {
  var adminPage = null;
  var communityDashboardPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    communityDashboardPage = (
      new CommunityDashboardPage.CommunityDashboardPage());
    users.createUser('translator@community.com', 'translator');
    users.createUser('voiceartist@community.com', 'voiceartist');
    users.createUser('questionreviewer@community.com', 'questionreviewer');
    users.createAdmin('management@adminTab.com', 'management');
  });

  beforeEach(function() {
    users.login('management@adminTab.com', true);
  });

  it('should allow admin to add translation reviewer', function() {
    adminPage.get();
    adminPage.assignTranslationReviewer('Hindi', 'translator');
    users.logout();

    users.login('translator@community.com');
    communityDashboardPage.get();
    communityDashboardPage.expectUserToBeTranslationReviewer('Hindi');
    users.logout();
  });

  it('should allow admin to add voiceover reviewer', function() {
    adminPage.get();
    adminPage.assignVoiceoverReviewer('Hindi', 'voiceartist');
    users.logout();

    users.login('voiceartist@community.com');
    communityDashboardPage.get();
    communityDashboardPage.expectUserToBeVoiceoverReviewer('Hindi');
    users.logout();
  });

  it('should allow admin to add question reviewer', function() {
    adminPage.get();
    adminPage.assignQuestionReviewer('questionreviewer');
    users.logout();

    users.login('questionreviewer@community.com');
    communityDashboardPage.get();
    communityDashboardPage.expectUserToBeQuestionReviewer('Hindi');
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
