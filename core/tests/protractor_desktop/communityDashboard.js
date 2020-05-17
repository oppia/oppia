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

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var CommunityDashboardPage = require(
  '../protractor_utils/CommunityDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var SkillEditorPage =
  require('../protractor_utils/SkillEditorPage.js');
var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');

describe('Community dashboard page', function() {
  const TOPIC_NAMES = [
    'Topic 0 for contribution', 'Topic 1 for contribution'];
  const SKILL_DESCRIPTIONS = [
    'Skill 0 for suggestion', 'Skill 1 for suggestion'];
  const REVIEW_MATERIALS = [
    'Review Material 0',
    'Review Material 1'];
  const ADMIN_EMAIL = 'management@community.com';
  const USER_EMAILS = ['user0@community.com', 'user1@community.com'];
  const HINDI_LANGUAGE = 'Hindi';
  let communityDashboardPage = null;
  let communityDashboardTranslateTextTab = null;
  let topicsAndSkillsDashboardPage = null;
  let skillEditorPage = null;
  let explorationEditorPage = null;
  let explorationEditorMainTab = null;
  let adminPage = null;

  beforeAll(function() {
    communityDashboardPage = (
      new CommunityDashboardPage.CommunityDashboardPage());
    communityDashboardTranslateTextTab = (
      communityDashboardPage.getTranslateTextTab());
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    skillEditorPage =
      new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    adminPage = new AdminPage.AdminPage();
    users.createUser(USER_EMAILS[0], 'user0');
    users.createUser(USER_EMAILS[1], 'user1');
    users.createAndLoginAdminUser(ADMIN_EMAIL, 'management');
    // Create 2 topics and 2 skills. Link 1 skill to 1 topic.
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic(TOPIC_NAMES[0], 'abbrev');
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic(TOPIC_NAMES[1], 'abbrev');
    workflow.createSkillAndAssignTopic(
      SKILL_DESCRIPTIONS[0], REVIEW_MATERIALS[0], TOPIC_NAMES[0]);
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      SKILL_DESCRIPTIONS[1], REVIEW_MATERIALS[1]);
    // Allow user1 to review suggestions.
    adminPage.get();
    adminPage.assignQuestionReviewer('user1');
    users.logout();
  });

  it('should allow user to switch to translate text tab', function() {
    communityDashboardPage.get();
    communityDashboardPage.navigateToTranslateTextTab();
    communityDashboardTranslateTextTab.changeLanguage(HINDI_LANGUAGE);
    communityDashboardTranslateTextTab.expectSelectedLanguageToBe(
      HINDI_LANGUAGE);
  });

  it('should allow users to accept question suggestions', function() {
    // Baseline verification.
    users.login(USER_EMAILS[0]);
    communityDashboardPage.get();
    // Initially, there should be no opportunity contributions, only the 2
    // placeholder opportunities used when loading.
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectNumberOfOpportunitiesToBe(2);
    communityDashboardPage.navigateToSubmitQuestionTab();
    communityDashboardPage.waitForOpportunitiesToLoad();
    // Before submission, progress percentage should be 0/50 = 0%.
    communityDashboardPage.expectOpportunityListItemProgressPercentageToBe(
      '(0.00%)', 0);
    communityDashboardPage.expectOpportunityHeadingToBe(SKILL_DESCRIPTIONS[0]);

    // Submit suggestion as user0.
    communityDashboardPage.clickOpportunityListItemButton(0);
    skillEditorPage.confirmSkillDifficulty();
    explorationEditorMainTab.setContent(forms.toRichText('Question 1'));
    explorationEditorMainTab.setInteraction('TextInput', 'Placeholder', 5);
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', 'correct');
    explorationEditorMainTab.getResponseEditor(0).markAsCorrect();
    explorationEditorMainTab.addHint('Hint 1');
    explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    skillEditorPage.saveQuestion();
    users.logout();

    // Review and accept the suggestion as user1.
    users.login(USER_EMAILS[1]);
    communityDashboardPage.get();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.clickOpportunityListItemButton(0);
    communityDashboardPage.clickAcceptQuestionSuggestionButton();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectEmptyOpportunityAvailabilityMessage();

    // Validate progress percentage was updated in the opportunity.
    communityDashboardPage.get();
    communityDashboardPage.navigateToSubmitQuestionTab();
    communityDashboardPage.waitForOpportunitiesToLoad();
    // After acceptance, progress percentage should be 1/50 = 2%.
    communityDashboardPage.expectOpportunityListItemProgressPercentageToBe(
      '(2.00%)', 0);
    users.logout();

    // Validate the contribution status changed.
    users.login(USER_EMAILS[0]);
    communityDashboardPage.get();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectNumberOfOpportunitiesToBe(3);
    communityDashboardPage.expectOpportunityHeadingToBe('Question 1');
    communityDashboardPage.expectOpportunityListItemSubheadingToBe(
      SKILL_DESCRIPTIONS[0], 0);
    communityDashboardPage.expectOpportunityListItemLabelToBe(
      'Accepted', 0);
  });

  it('should allow users to reject question suggestions', function() {
    // Baseline verification.
    users.login(USER_EMAILS[0]);
    communityDashboardPage.get();
    communityDashboardPage.navigateToSubmitQuestionTab();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectOpportunityListItemProgressPercentageToBe(
      '(2.00%)', 0);

    // Submit suggestion as user0.
    communityDashboardPage.clickOpportunityListItemButton(0);
    skillEditorPage.confirmSkillDifficulty();
    explorationEditorMainTab.setContent(forms.toRichText('Question 1'));
    explorationEditorMainTab.setInteraction('TextInput', 'Placeholder', 5);
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', 'correct');
    explorationEditorMainTab.getResponseEditor(0).markAsCorrect();
    explorationEditorMainTab.addHint('Hint 1');
    explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    skillEditorPage.saveQuestion();
    users.logout();

    // Review and reject the suggestion as user1.
    users.login(USER_EMAILS[1]);
    communityDashboardPage.get();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.clickOpportunityListItemButton(0);
    communityDashboardPage.setQuestionSuggestionReviewMessage('review message');
    communityDashboardPage.clickRejectQuestionSuggestionButton();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectEmptyOpportunityAvailabilityMessage();

    // Validate progress percentage remains the same in the opportunity.
    communityDashboardPage.get();
    communityDashboardPage.navigateToSubmitQuestionTab();
    communityDashboardPage.waitForOpportunitiesToLoad();
    // After rejection, progress percentage should still be 0%.
    communityDashboardPage.expectOpportunityListItemProgressPercentageToBe(
      '(2.00%)', 0);
    users.logout();

    // Validate the contribution status changed.
    users.login(USER_EMAILS[0]);
    communityDashboardPage.get();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectNumberOfOpportunitiesToBe(4);
    communityDashboardPage.expectOpportunityHeadingToBe('Question 1');
    communityDashboardPage.expectOpportunityListItemSubheadingToBe(
      SKILL_DESCRIPTIONS[0], 0);
    communityDashboardPage.expectOpportunityListItemLabelToBe(
      'Rejected', 0);
  });

  describe('Submit question tab', function() {
    it('should list skill opportunities for admin user', function() {
      users.login(ADMIN_EMAIL, true);
      communityDashboardPage.get();
      communityDashboardPage.navigateToSubmitQuestionTab();
      communityDashboardPage.waitForOpportunitiesToLoad();

      // There are always at least 2 placeholder opportunity list items.
      communityDashboardPage.expectNumberOfOpportunitiesToBe(3);
      communityDashboardPage.expectOpportunityHeadingToBe(
        SKILL_DESCRIPTIONS[0]);
    });

    it('should list skill opportunities for non-admin user', function() {
      users.login(USER_EMAILS[0]);
      communityDashboardPage.get();
      communityDashboardPage.navigateToSubmitQuestionTab();
      communityDashboardPage.waitForOpportunitiesToLoad();

      // There are always at least 2 placeholder opportunity list items.
      communityDashboardPage.expectNumberOfOpportunitiesToBe(3);
      communityDashboardPage.expectOpportunityHeadingToBe(
        SKILL_DESCRIPTIONS[0]);
    });
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
  var ADMIN_EMAIL = 'adminToAssignReviewer@adminTab.com';

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    communityDashboardPage = (
      new CommunityDashboardPage.CommunityDashboardPage());
    users.createUser(translationReviewerEmail, translationReviewerUsername);
    users.createUser(voiceoverReviewerEmail, voiceoverReviewerUsername);
    users.createUser(questionReviewerEmail, questionReviewerUsername);
    users.createUser(ADMIN_EMAIL, 'assignReviewer');
  });

  beforeEach(function() {
    users.login(ADMIN_EMAIL, true);
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
