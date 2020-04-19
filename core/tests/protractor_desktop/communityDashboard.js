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
    communityDashboardTranslateTextTab.changeLanguage(HINDI_LANGUAGE);
    communityDashboardTranslateTextTab.expectSelectedLanguageToBe(
      HINDI_LANGUAGE);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Admin page community reviewer form', function() {
  var HINDI_LANGUAGE = 'Hindi';
  var adminPage = null;
  var communityDashboardPage = null;
  var translationReviewerUsername = 'translator';
  var translationReviewerEmail = 'translator@community.com';
  var voiceoverReviewerUsername = 'voiceartist';
  var voiceoverReviewerEmail = 'voiceartist@community.com';
  var questionReviewerUsername = 'questionreviewer';
  var questionReviewerEmail = 'questionreviewer@community.com';
  var superAdminEmail = 'management@adminTab.com';

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    communityDashboardPage = (
      new CommunityDashboardPage.CommunityDashboardPage());
    users.createUser(translationReviewerEmail, translationReviewerUsername);
    users.createUser(voiceoverReviewerEmail, voiceoverReviewerUsername);
    users.createUser(questionReviewerEmail, questionReviewerUsername);
    users.createUser(superAdminEmail, 'management');
  });

  beforeEach(function() {
    users.login(superAdminEmail, true);
  });

  it('should allow admin to add translation reviewer', function() {
    adminPage.get();
    adminPage.assignTranslationReviewer(
      translationReviewerUsername, HINDI_LANGUAGE);
    adminPage.expectUserToBeTranslationReviewer(
      translationReviewerUsername, HINDI_LANGUAGE);
    users.logout();

    users.login(translationReviewerEmail);
    communityDashboardPage.get();
    communityDashboardPage.expectUserToBeTranslationReviewer(HINDI_LANGUAGE);
    users.logout();
  });

  it('should allow admin to add voiceover reviewer', function() {
    adminPage.get();
    adminPage.assignVoiceoverReviewer(
      voiceoverReviewerUsername, HINDI_LANGUAGE);
    adminPage.expectUserToBeVoiceoverReviewer(
      voiceoverReviewerUsername, HINDI_LANGUAGE);
    users.logout();

    users.login(voiceoverReviewerEmail);
    communityDashboardPage.get();
    communityDashboardPage.expectUserToBeVoiceoverReviewer(HINDI_LANGUAGE);
    users.logout();
  });

  it('should allow admin to add question reviewer', function() {
    adminPage.get();
    adminPage.assignQuestionReviewer(questionReviewerUsername);
    adminPage.expectUserToBeQuestionReviewer(questionReviewerUsername);
    users.logout();

    users.login(questionReviewerEmail);
    communityDashboardPage.get();
    communityDashboardPage.expectUserToBeQuestionReviewer();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
