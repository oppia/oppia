// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
var waitFor = require('../protractor_utils/waitFor.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var CommunityDashboardPage = require(
  '../protractor_utils/CommunityDashboardPage.js');
var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');
var SkillEditorPage = require(
  '../protractor_utils/SkillEditorPage.js');
var TopicsAndSkillsDashboardPage = require(
  '../protractor_utils/TopicsAndSkillsDashboardPage.js');

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

  beforeAll(async function() {
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
    await users.createUser(USER_EMAILS[0], 'user0');
    await users.createUser(USER_EMAILS[1], 'user1');
    await users.createAndLoginAdminUser(ADMIN_EMAIL, 'management');
    // Create 2 topics and 2 skills. Link 1 skill to 1 topic.
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(TOPIC_NAMES[0], 'abbrev');
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(TOPIC_NAMES[1], 'abbrev');
    await workflow.createSkillAndAssignTopic(
      SKILL_DESCRIPTIONS[0], REVIEW_MATERIALS[0], TOPIC_NAMES[0]);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      SKILL_DESCRIPTIONS[1], REVIEW_MATERIALS[1]);
    // Allow user1 to review suggestions.
    await adminPage.get();
    await adminPage.assignQuestionReviewer('user1');
    await users.logout();
  });

  it('should allow user to switch to translate text tab', async function() {
    await communityDashboardPage.get();
    await communityDashboardPage.navigateToTranslateTextTab();
    await communityDashboardTranslateTextTab.changeLanguage(HINDI_LANGUAGE);
    await communityDashboardTranslateTextTab.expectSelectedLanguageToBe(
      HINDI_LANGUAGE);
  });

  it('should allow users to accept question suggestions', async function() {
    // Baseline verification.
    await users.login(USER_EMAILS[0]);
    await communityDashboardPage.get();

    await communityDashboardPage.navigateToSubmitQuestionTab();

    await communityDashboardPage.expectOpportunityPropertiesToBe(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(0.00%)');

    // Submit suggestion as user0.
    await communityDashboardPage.clickOpportunityActionButton(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0]);
    await skillEditorPage.confirmSkillDifficulty();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', 'correct');
    await (await explorationEditorMainTab.getResponseEditor(0)).markAsCorrect();
    await explorationEditorMainTab.addHint('Hint 1');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    await skillEditorPage.saveQuestion();
    await users.logout();

    // Review and accept the suggestion as user1.
    await users.login(USER_EMAILS[1]);
    await communityDashboardPage.get();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    await communityDashboardPage.clickOpportunityActionButton(
      'Question 1', SKILL_DESCRIPTIONS[0]);
    await communityDashboardPage.waitForQuestionSuggestionReviewModalToAppear();
    await communityDashboardPage.clickAcceptQuestionSuggestionButton();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    await communityDashboardPage.expectEmptyOpportunityAvailabilityMessage();

    // Validate progress percentage was updated in the opportunity.
    await communityDashboardPage.get();
    await communityDashboardPage.navigateToSubmitQuestionTab();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    // After acceptance, progress percentage should be 1/50 = 2%.
    await communityDashboardPage.expectOpportunityPropertiesToBe(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(2.00%)');
    await users.logout();

    // Validate the contribution status changed.
    await users.login(USER_EMAILS[0]);
    await communityDashboardPage.get();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    await communityDashboardPage.expectNumberOfOpportunitiesToBe(1);
    await communityDashboardPage.expectOpportunityPropertiesToBe(
      'Question 1', SKILL_DESCRIPTIONS[0], 'Accepted', null);
  });

  it('should allow users to reject question suggestions', async function() {
    // Baseline verification.
    await users.login(USER_EMAILS[0]);
    await communityDashboardPage.get();
    await communityDashboardPage.navigateToSubmitQuestionTab();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    await communityDashboardPage.expectOpportunityPropertiesToBe(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(2.00%)');

    // Submit suggestion as user0.
    await communityDashboardPage.clickOpportunityActionButton(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0]);
    await skillEditorPage.confirmSkillDifficulty();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', 'correct');
    await (await explorationEditorMainTab.getResponseEditor(0)).markAsCorrect();
    await explorationEditorMainTab.addHint('Hint 1');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    await skillEditorPage.saveQuestion();
    await users.logout();

    // Review and reject the suggestion as user1.
    await users.login(USER_EMAILS[1]);
    await communityDashboardPage.get();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    await communityDashboardPage.clickOpportunityActionButton(
      'Question 1', SKILL_DESCRIPTIONS[0]);
    await communityDashboardPage.waitForQuestionSuggestionReviewModalToAppear();
    await communityDashboardPage.setQuestionSuggestionReviewMessage(
      'review message');
    await communityDashboardPage.clickRejectQuestionSuggestionButton();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    await communityDashboardPage.expectEmptyOpportunityAvailabilityMessage();

    // Validate progress percentage remains the same in the opportunity.
    await communityDashboardPage.get();
    await communityDashboardPage.navigateToSubmitQuestionTab();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    await communityDashboardPage.expectOpportunityPropertiesToBe(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(2.00%)');
    await users.logout();

    // Validate the contribution status changed.
    await users.login(USER_EMAILS[0]);
    await communityDashboardPage.get();
    await communityDashboardPage.waitForOpportunitiesToLoad();
    await communityDashboardPage.expectNumberOfOpportunitiesToBe(2);
    await communityDashboardPage.expectOpportunityPropertiesToBe(
      'Question 1', SKILL_DESCRIPTIONS[0], 'Rejected', null);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
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

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    communityDashboardPage = (
      new CommunityDashboardPage.CommunityDashboardPage());
    await users.createUser(
      translationReviewerEmail, translationReviewerUsername);
    await users.createUser(voiceoverReviewerEmail, voiceoverReviewerUsername);
    await users.createUser(questionReviewerEmail, questionReviewerUsername);
    await users.createAdmin(ADMIN_EMAIL, 'assignReviewer');
  });

  beforeEach(async function() {
    await users.login(ADMIN_EMAIL, true);
  });

  it('should allow admin to add translation reviewer', async function() {
    await adminPage.get();
    await adminPage.assignTranslationReviewer(
      translationReviewerUsername, HINDI_LANGUAGE);
    await adminPage.expectUserToBeTranslationReviewer(
      translationReviewerUsername, HINDI_LANGUAGE);
    await users.logout();

    await users.login(translationReviewerEmail);
    await communityDashboardPage.get();
    await communityDashboardPage.expectUserToBeTranslationReviewer(
      HINDI_LANGUAGE);
    await users.logout();
  });

  it('should allow admin to add voiceover reviewer', async function() {
    await adminPage.get();
    await adminPage.assignVoiceoverReviewer(
      voiceoverReviewerUsername, HINDI_LANGUAGE);
    await adminPage.expectUserToBeVoiceoverReviewer(
      voiceoverReviewerUsername, HINDI_LANGUAGE);
    await users.logout();

    await users.login(voiceoverReviewerEmail);
    await communityDashboardPage.get();
    await communityDashboardPage.expectUserToBeVoiceoverReviewer(
      HINDI_LANGUAGE);
    await users.logout();
  });

  it('should allow admin to add question reviewer', async function() {
    await adminPage.get();
    await adminPage.assignQuestionReviewer(questionReviewerUsername);
    await adminPage.expectUserToBeQuestionReviewer(questionReviewerUsername);
    await users.logout();

    await users.login(questionReviewerEmail);
    await communityDashboardPage.get();
    await communityDashboardPage.expectUserToBeQuestionReviewer();
    await users.logout();
  });


  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Translation contribution featured languages', () => {
  var communityDashboardPage = null;
  var communityDashboardTranslateTextTab = null;

  beforeAll(async function() {
    communityDashboardPage = (
      new CommunityDashboardPage.CommunityDashboardPage());
    communityDashboardTranslateTextTab = (
      communityDashboardPage.getTranslateTextTab());
    await users.createAndLoginAdminUser(
      'config@communityDashboard.com', 'communityDashboard');
    const adminPage = new AdminPage.AdminPage();
    await adminPage.editConfigProperty(
      'Featured Translation Languages',
      'List',
      async function(elem) {
        const featured = await elem.addItem('Dictionary');
        await (await featured.editEntry(0, 'Unicode')).setValue('fr');
        await (await featured.editEntry(1, 'Unicode'))
          .setValue('Partnership with ABC');
      });
    await users.logout();
  });

  beforeEach(async function() {
    await communityDashboardPage.get();
    await communityDashboardPage.navigateToTranslateTextTab();
  });

  it('should show correct featured languages', async function() {
    await communityDashboardTranslateTextTab
      .expectFeaturedLanguagesToBe(['French']);
  });

  it('should show correct explanation', async function() {
    await communityDashboardTranslateTextTab
      .mouseoverFeaturedLanguageTooltip(0);
    await communityDashboardTranslateTextTab
      .expectFeaturedLanguageExplanationToBe('Partnership with ABC');
  });
});
