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
  const topicName0 = 'Topic 0';
  const skillDescription0 = 'Skill 0';
  const reviewMaterial0 = 'Review Material 0';
  const topicName1 = 'Topic 1';
  const skillDescription1 = 'Skill 1';
  const reviewMaterial1 = 'Review Material 1';
  const adminEmail = 'management@community.com';
  const user1Email = 'user1@community.com';
  const user2Email = 'user2@community.com';

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
    users.createUser(user1Email, 'user1');
    users.createUser(user2Email, 'user2');
    users.createAndLoginAdminUser(adminEmail, 'management');
    // Create 2 topics and 2 skills. Link 1 skill to 1 topic.
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic(topicName0, 'abbrev');
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic(topicName1, 'abbrev');
    workflow.createSkillAndAssignTopic(
      skillDescription0, reviewMaterial0, topicName0);
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      skillDescription1, reviewMaterial1);
    // Allow user2 to review suggestions.
    adminPage.get();
    adminPage.assignQuestionReviewer('user2');
    users.logout();
  });

  it('should allow user to switch to translate text tab', function() {
    communityDashboardPage.get();
    communityDashboardPage.navigateToTranslateTextTab();
    communityDashboardTranslateTextTab.changeLanguage('Hindi');
    communityDashboardTranslateTextTab.expectSelectedLanguageToBe('Hindi');
  });

  fit('should allow users to accept question suggestions', function() {
    // Baseline verification.
    users.login(user1Email);
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
    communityDashboardPage.expectOpportunityListItemHeadingToBe(
      skillDescription0, 0);

    // Submit suggestion as user1.
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

    // Review and accept the suggestion as user2.
    users.login(user2Email);
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
    users.login(user1Email);
    communityDashboardPage.get();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectNumberOfOpportunitiesToBe(3);
    communityDashboardPage.expectOpportunityListItemHeadingToBe(
      'Question 1', 0);
    communityDashboardPage.expectOpportunityListItemSubheadingToBe(
      skillDescription0, 0);
    communityDashboardPage.expectOpportunityListItemLabelToBe(
      'Accepted', 0);
  });

  fit('should allow users to reject question suggestions', function() {
    // Baseline verification.
    users.login(user1Email);
    communityDashboardPage.get();
    communityDashboardPage.navigateToSubmitQuestionTab();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectOpportunityListItemProgressPercentageToBe(
      '(2.00%)', 0);

    // Submit suggestion as user1.
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

    // Review and reject the suggestion as user2.
    users.login(user2Email);
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
    users.login(user1Email);
    communityDashboardPage.get();
    communityDashboardPage.waitForOpportunitiesToLoad();
    communityDashboardPage.expectNumberOfOpportunitiesToBe(4);
    communityDashboardPage.expectOpportunityListItemHeadingToBe(
      'Question 1', 0);
    communityDashboardPage.expectOpportunityListItemSubheadingToBe(
      skillDescription0, 0);
    communityDashboardPage.expectOpportunityListItemLabelToBe(
      'Rejected', 0);
  });

  describe('Submit question tab', function() {
    it('should list skill opportunities for admin user', function() {
      users.login(adminEmail, true /* isSuperAdmin */);
      communityDashboardPage.get();
      communityDashboardPage.navigateToSubmitQuestionTab();
      communityDashboardPage.waitForOpportunitiesToLoad();

      // There are always at least 2 placeholder opportunity list items.
      communityDashboardPage.expectNumberOfOpportunitiesToBe(3);
      communityDashboardPage.expectOpportunityListItemHeadingToBe(
        skillDescription0, 0);
    });

    it('should list skill opportunities for non-admin user', function() {
      users.login(user1Email);
      communityDashboardPage.get();
      communityDashboardPage.navigateToSubmitQuestionTab();
      communityDashboardPage.waitForOpportunitiesToLoad();

      // There are always at least 2 placeholder opportunity list items.
      communityDashboardPage.expectNumberOfOpportunitiesToBe(3);
      communityDashboardPage.expectOpportunityListItemHeadingToBe(
        skillDescription0, 0);
    });
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
