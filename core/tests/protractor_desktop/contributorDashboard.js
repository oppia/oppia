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
 * @fileoverview End-to-end tests for the contributor dashboard page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var ContributorDashboardPage = require(
  '../protractor_utils/ContributorDashboardPage.js');
var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');
var SkillEditorPage = require(
  '../protractor_utils/SkillEditorPage.js');
var TopicsAndSkillsDashboardPage = require(
  '../protractor_utils/TopicsAndSkillsDashboardPage.js');

describe('Contributor dashboard page', function() {
  const TOPIC_NAMES = [
    'Topic 0 for contribution', 'Topic 1 for contribution'];
  const SKILL_DESCRIPTIONS = [
    'Skill 0 for suggestion', 'Skill 1 for suggestion'];
  const REVIEW_MATERIALS = [
    'Review Material 0',
    'Review Material 1'];
  const ADMIN_EMAIL = 'management@contributor.com';
  const USER_EMAILS = ['user0@contributor.com', 'user1@contributor.com'];
  const HINDI_LANGUAGE = 'Hindi';
  let contributorDashboardPage = null;
  let contributorDashboardTranslateTextTab = null;
  let topicsAndSkillsDashboardPage = null;
  let skillEditorPage = null;
  let explorationEditorPage = null;
  let explorationEditorMainTab = null;
  let adminPage = null;

  beforeAll(async function() {
    contributorDashboardPage = (
      new ContributorDashboardPage.ContributorDashboardPage());
    contributorDashboardTranslateTextTab = (
      contributorDashboardPage.getTranslateTextTab());
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
    await adminPage.editConfigProperty(
      'Whether the contributor can suggest questions for skill opportunities.',
      'Boolean', async function(elem) {
        await elem.setValue(true);
      });
    await adminPage.assignQuestionContributor('user0');
    await adminPage.assignQuestionContributor('user1');

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAMES[0], 'community-topic-one', 'Topic description 1', false);
    await workflow.createSkillAndAssignTopic(
      SKILL_DESCRIPTIONS[0], REVIEW_MATERIALS[0], TOPIC_NAMES[0]);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      SKILL_DESCRIPTIONS[1], REVIEW_MATERIALS[1]);

    // Allow user1 to review question suggestions.
    await adminPage.get();
    await adminPage.assignQuestionReviewer('user1');
    await users.logout();
  });

  it('should allow user to switch to translate text tab', async function() {
    await contributorDashboardPage.get();
    await contributorDashboardPage.navigateToTranslateTextTab();
    await contributorDashboardTranslateTextTab.changeLanguage(HINDI_LANGUAGE);
    await contributorDashboardTranslateTextTab.expectSelectedLanguageToBe(
      HINDI_LANGUAGE);
  });

  it('should allow reviewer to accept question suggestions', async function() {
    // Baseline verification.
    await users.login(USER_EMAILS[0]);
    await contributorDashboardPage.get();

    await contributorDashboardPage.navigateToSubmitQuestionTab();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectOpportunityWithPropertiesToExist(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(0.00%)');

    // Submit suggestion as user0.
    await contributorDashboardPage.clickOpportunityActionButton(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0]);
    await skillEditorPage.confirmSkillDifficulty();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', ['correct']);
    await (await explorationEditorMainTab.getResponseEditor(0)).markAsCorrect();
    await (
      await explorationEditorMainTab.getResponseEditor('default')
    ).setFeedback(await forms.toRichText('Try again'));
    await explorationEditorMainTab.addHint('Hint 1');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    await skillEditorPage.saveQuestion();
    await users.logout();

    // Review and accept the suggestion as user1.
    await users.login(USER_EMAILS[1]);
    await contributorDashboardPage.get();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.clickOpportunityActionButton(
      'Question 1', SKILL_DESCRIPTIONS[0]);
    await (
      contributorDashboardPage.waitForQuestionSuggestionReviewModalToAppear());
    await contributorDashboardPage.clickAcceptQuestionSuggestionButton();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectEmptyOpportunityAvailabilityMessage();

    // Validate progress percentage was updated in the opportunity.
    await contributorDashboardPage.get();
    await contributorDashboardPage.navigateToSubmitQuestionTab();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    // After acceptance, progress percentage should be 1/50 = 2%.
    await contributorDashboardPage.expectOpportunityWithPropertiesToExist(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(2.00%)');
    await users.logout();

    // Validate the contribution status changed.
    await users.login(USER_EMAILS[0]);
    await contributorDashboardPage.get();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectNumberOfOpportunitiesToBe(1);
    await contributorDashboardPage.expectOpportunityWithPropertiesToExist(
      'Question 1', SKILL_DESCRIPTIONS[0], 'Accepted', null);
    await users.logout();
  });

  it('should allow reviewer to reject question suggestions', async function() {
    // Baseline verification.
    await users.login(USER_EMAILS[0]);
    await contributorDashboardPage.get();
    await contributorDashboardPage.navigateToSubmitQuestionTab();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectOpportunityWithPropertiesToExist(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(2.00%)');

    // Submit suggestion as user0.
    await contributorDashboardPage.clickOpportunityActionButton(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0]);
    await skillEditorPage.confirmSkillDifficulty();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', ['correct']);
    await (await explorationEditorMainTab.getResponseEditor(0)).markAsCorrect();
    await (
      await explorationEditorMainTab.getResponseEditor('default')
    ).setFeedback(await forms.toRichText('Try again'));
    await explorationEditorMainTab.addHint('Hint 1');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    await skillEditorPage.saveQuestion();
    await users.logout();

    // Review and reject the suggestion as user1.
    await users.login(USER_EMAILS[1]);
    await contributorDashboardPage.get();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.clickOpportunityActionButton(
      'Question 1', SKILL_DESCRIPTIONS[0]);
    await (
      contributorDashboardPage.waitForQuestionSuggestionReviewModalToAppear());
    await contributorDashboardPage.setQuestionSuggestionReviewMessage(
      'review message');
    await contributorDashboardPage.clickRejectQuestionSuggestionButton();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectEmptyOpportunityAvailabilityMessage();

    // Validate progress percentage remains the same in the opportunity.
    await contributorDashboardPage.get();
    await contributorDashboardPage.navigateToSubmitQuestionTab();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectOpportunityWithPropertiesToExist(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(2.00%)');
    await users.logout();

    // Validate the contribution status changed.
    await users.login(USER_EMAILS[0]);
    await contributorDashboardPage.get();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectNumberOfOpportunitiesToBe(2);
    await contributorDashboardPage.expectOpportunityWithPropertiesToExist(
      'Question 1', SKILL_DESCRIPTIONS[0], 'Revisions Requested', null);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Admin page contribution rights form', function() {
  var HINDI_LANGUAGE = 'Hindi';
  var adminPage = null;
  var contributorDashboardPage = null;
  var translationReviewerUsername = 'translator';
  var translationReviewerEmail = 'translator@contributor.com';
  var voiceoverReviewerUsername = 'voiceartist';
  var voiceoverReviewerEmail = 'voiceartist@contributor.com';
  var questionReviewerUsername = 'questionreviewer';
  var questionReviewerEmail = 'questionreviewer@contributor.com';

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    contributorDashboardPage = (
      new ContributorDashboardPage.ContributorDashboardPage());
    await users.createUser(
      translationReviewerEmail, translationReviewerUsername);
    await users.createUser(voiceoverReviewerEmail, voiceoverReviewerUsername);
    await users.createUser(questionReviewerEmail, questionReviewerUsername);
    await users.createAndLoginAdminUser(
      'primaryAdmin@adminTab.com', 'primary');
    await adminPage.editConfigProperty(
      'Whether the contributor can suggest questions for skill opportunities.',
      'Boolean', async function(elem) {
        await elem.setValue(true);
      });
    await users.logout();
  });

  it('should allow admin to add translation reviewer', async function() {
    await users.createAndLoginAdminUser(
      'adminToAssignTranslationReviewer@adminTab.com',
      'assignTranslationReviewer');
    await adminPage.assignTranslationReviewer(
      translationReviewerUsername, HINDI_LANGUAGE);
    await adminPage.expectUserToBeTranslationReviewer(
      translationReviewerUsername, HINDI_LANGUAGE);
    await users.logout();

    await users.login(translationReviewerEmail);
    await contributorDashboardPage.get();
    await contributorDashboardPage.expectUserToBeTranslationReviewer(
      HINDI_LANGUAGE);
    await users.logout();
  });

  it('should allow admin to add voiceover reviewer', async function() {
    await users.createAndLoginAdminUser(
      'adminToAssignVoiceoverReviewer@adminTab.com', 'assignVoiceoverReviewer');
    await adminPage.assignVoiceoverReviewer(
      voiceoverReviewerUsername, HINDI_LANGUAGE);
    await adminPage.expectUserToBeVoiceoverReviewer(
      voiceoverReviewerUsername, HINDI_LANGUAGE);
    await users.logout();

    await users.login(voiceoverReviewerEmail);
    await contributorDashboardPage.get();
    await contributorDashboardPage.expectUserToBeVoiceoverReviewer(
      HINDI_LANGUAGE);
    await users.logout();
  });

  it('should allow admin to add question reviewer', async function() {
    await users.createAndLoginAdminUser(
      'adminToAssignQuestionReviewer@adminTab.com', 'assignQuestionReviewer');
    await adminPage.assignQuestionReviewer(questionReviewerUsername);
    await adminPage.expectUserToBeQuestionReviewer(questionReviewerUsername);
    await users.logout();

    await users.login(questionReviewerEmail);
    await contributorDashboardPage.get();
    await contributorDashboardPage.expectUserToBeQuestionReviewer();
    await users.logout();
  });

  it('should allow admin to add question contributor', async function() {
    await users.createAndLoginAdminUser(
      'adminToAddQuestionContributor@adminTab.com', 'addQuestionContributor');
    await adminPage.assignQuestionContributor(questionReviewerUsername);
    await adminPage.expectUserToBeQuestionContributor(questionReviewerUsername);

    // Confirm rights persist on page reload.
    await browser.refresh();
    await adminPage.expectUserToBeQuestionContributor(questionReviewerUsername);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Translation contribution featured languages', () => {
  var contributorDashboardPage = null;
  var contributorDashboardTranslateTextTab = null;

  beforeAll(async function() {
    contributorDashboardPage = (
      new ContributorDashboardPage.ContributorDashboardPage());
    contributorDashboardTranslateTextTab = (
      contributorDashboardPage.getTranslateTextTab());
    await users.createAndLoginAdminUser(
      'config@contributorDashboard.com', 'contributorDashboard');
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
    await contributorDashboardPage.get();
    await contributorDashboardPage.navigateToTranslateTextTab();
  });

  it('should show correct featured languages', async function() {
    await contributorDashboardTranslateTextTab
      .expectFeaturedLanguagesToBe(['French']);
  });

  it('should show correct explanation', async function() {
    await contributorDashboardTranslateTextTab
      .mouseoverFeaturedLanguageTooltip(0);
    await contributorDashboardTranslateTextTab
      .expectFeaturedLanguageExplanationToBe('Partnership with ABC');
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
