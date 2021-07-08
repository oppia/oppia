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
var ContributorDashboardAdminPage = require(
  '../protractor_utils/ContributorDashboardAdminPage.js');
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
  const QUESTION_ADMIN_EMAIL = 'user@contributor.com';
  const QUESTION_ADMIN_USERNAME = 'user4321';
  const HINDI_LANGUAGE = 'Hindi';
  let contributorDashboardPage = null;
  let contributorDashboardTranslateTextTab = null;
  let topicsAndSkillsDashboardPage = null;
  let skillEditorPage = null;
  let explorationEditorPage = null;
  let explorationEditorMainTab = null;
  let adminPage = null;
  let contributorDashboardAdminPage = null;

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
    contributorDashboardAdminPage = (
      new ContributorDashboardAdminPage.ContributorDashboardAdminPage());

    await users.createUser(USER_EMAILS[0], 'user0');
    await users.createUser(USER_EMAILS[1], 'user1');
    await users.createUser(QUESTION_ADMIN_EMAIL, QUESTION_ADMIN_USERNAME);

    await users.createAndLoginAdminUser(ADMIN_EMAIL, 'management');
    await adminPage.editConfigProperty(
      'Whether the contributor can suggest questions for skill opportunities.',
      'Boolean', async function(elem) {
        await elem.setValue(true);
      });


    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAMES[0], 'community-topic-one', 'Topic description 1', false);
    const URL = await browser.getCurrentUrl();
    // Example URL: http://localhost:8181/topic_editor/jT9z3iLnFjsQ#/
    const TOPIC_ID_URL_PART = URL.split('/')[4];
    // We have to remove the ending "#".
    const TOPIC_ID = TOPIC_ID_URL_PART.substring(
      0, TOPIC_ID_URL_PART.length - 1);
    await workflow.createSkillAndAssignTopic(
      SKILL_DESCRIPTIONS[0], REVIEW_MATERIALS[0], TOPIC_NAMES[0]);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      SKILL_DESCRIPTIONS[1], REVIEW_MATERIALS[1]);

    await adminPage.get();
    await adminPage.updateRole(QUESTION_ADMIN_USERNAME, 'question admin');
    // Add topic to classroom to make it available for question contributions.
    await adminPage.editConfigProperty(
      'The details for each classroom page.',
      'List',
      async function(elem) {
        elem = await elem.editItem(0, 'Dictionary');
        elem = await elem.editEntry(4, 'List');
        elem = await elem.addItem('Unicode');
        await elem.setValue(TOPIC_ID);
      });
    await users.logout();

    await users.login(QUESTION_ADMIN_EMAIL);
    await contributorDashboardAdminPage.get();
    await contributorDashboardAdminPage.assignQuestionContributor('user0');
    await contributorDashboardAdminPage.assignQuestionContributor('user1');
    await contributorDashboardAdminPage.assignQuestionReviewer('user1');
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

describe('Contributor dashboard admin page contribution rights form', () => {
  const HINDI_LANGUAGE = 'Hindi';
  const QUESTION_ADMIN_EMAIL = 'userX@contributor.com';
  const QUESTION_ADMIN_USERNAME = 'user1234';
  const TRANSLATION_ADMIN_EMAIL = 'userY@contributor.com';
  const TRANSLATION_ADMIN_USERNAME = 'user12345';

  var adminPage = null;
  var contributorDashboardPage = null;
  var contributorDashboardAdminPage = null;
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
    contributorDashboardAdminPage = (
      new ContributorDashboardAdminPage.ContributorDashboardAdminPage());
    await users.createUser(
      translationReviewerEmail, translationReviewerUsername);
    await users.createUser(voiceoverReviewerEmail, voiceoverReviewerUsername);
    await users.createUser(questionReviewerEmail, questionReviewerUsername);
    await users.createUser(QUESTION_ADMIN_EMAIL, QUESTION_ADMIN_USERNAME);
    await users.createUser(TRANSLATION_ADMIN_EMAIL, TRANSLATION_ADMIN_USERNAME);

    await users.createAndLoginAdminUser(
      'primaryAdmin@adminTab.com', 'primary');

    await adminPage.updateRole(QUESTION_ADMIN_USERNAME, 'question admin');
    await adminPage.updateRole(TRANSLATION_ADMIN_USERNAME, 'translation admin');
    await adminPage.editConfigProperty(
      'Whether the contributor can suggest questions for skill opportunities.',
      'Boolean', async function(elem) {
        await elem.setValue(true);
      });
    await users.logout();
  });

  it('should allow translation admin to add translation reviewer',
    async function() {
      await users.login(TRANSLATION_ADMIN_EMAIL);
      await contributorDashboardAdminPage.get();
      await contributorDashboardAdminPage.assignTranslationReviewer(
        translationReviewerUsername, HINDI_LANGUAGE);
      await contributorDashboardAdminPage.expectUserToBeTranslationReviewer(
        translationReviewerUsername, HINDI_LANGUAGE);
      await users.logout();

      await users.login(translationReviewerEmail);
      await contributorDashboardPage.get();
      await contributorDashboardPage.expectUserToBeTranslationReviewer(
        HINDI_LANGUAGE);
      await users.logout();
    });

  it('should allow admin to add question reviewer', async function() {
    await users.login(QUESTION_ADMIN_EMAIL);
    await contributorDashboardAdminPage.get();
    await contributorDashboardAdminPage.assignQuestionReviewer(
      questionReviewerUsername);
    await contributorDashboardAdminPage.expectUserToBeQuestionReviewer(
      questionReviewerUsername);
    await users.logout();

    await users.login(questionReviewerEmail);
    await contributorDashboardPage.get();
    await contributorDashboardPage.expectUserToBeQuestionReviewer();
    await users.logout();
  });

  it('should allow admin to add question contributor', async function() {
    await users.login(QUESTION_ADMIN_EMAIL);
    await contributorDashboardAdminPage.get();
    await contributorDashboardAdminPage.assignQuestionContributor(
      questionReviewerUsername);
    await contributorDashboardAdminPage.expectUserToBeQuestionContributor(
      questionReviewerUsername);

    // Confirm rights persist on page reload.
    await browser.refresh();
    await contributorDashboardAdminPage.expectUserToBeQuestionContributor(
      questionReviewerUsername);
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
    var adminPage = new AdminPage.AdminPage();
    await adminPage.editConfigProperty(
      'Featured Translation Languages',
      'List',
      async function(elem) {
        var featured = await elem.addItem('Dictionary');
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
