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
 * @fileoverview End-to-end tests for the contributor dashboard page.
 */

var action = require('../webdriverio_utils/action.js');
var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');
var waitFor = require('../webdriverio_utils/waitFor.js');

var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ContributorDashboardPage = require(
  '../webdriverio_utils/ContributorDashboardPage.js');
var ContributorDashboardAdminPage = require(
  '../webdriverio_utils/ContributorDashboardAdminPage.js');
var ExplorationEditorPage = require(
  '../webdriverio_utils/ExplorationEditorPage.js');
var SkillEditorPage = require(
  '../webdriverio_utils/SkillEditorPage.js');
var TopicsAndSkillsDashboardPage = require(
  '../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var StoryEditorPage = require('../webdriverio_utils/StoryEditorPage.js');
var Constants = require('../webdriverio_utils/WebdriverioConstants.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');
var ExplorationEditorPage = require(
  '../webdriverio_utils/ExplorationEditorPage.js'
);
var CreatorDashboardPage = require(
  '../webdriverio_utils/CreatorDashboardPage.js'
);

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
  const GERMAN_LANGUAGE = 'Deutsch (German)';
  let contributorDashboardPage = null;
  let contributorDashboardTranslateTextTab = null;
  let topicsAndSkillsDashboardPage = null;
  let skillEditorPage = null;
  let explorationEditorPage = null;
  let explorationEditorMainTab = null;
  let adminPage = null;
  let contributorDashboardAdminPage = null;
  let storyEditorPage = null;
  let topicEditorPage = null;
  let creatorDashboardPage = null;

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

    await users.createAndLoginCurriculumAdminUser(ADMIN_EMAIL, 'management');

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAMES[0], 'community-topic-one', 'Topic description 1', false);
    const URL = await browser.getUrl();
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
    await adminPage.addRole(QUESTION_ADMIN_USERNAME, 'question admin');
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
    await contributorDashboardTranslateTextTab.changeLanguage(GERMAN_LANGUAGE);
    await contributorDashboardTranslateTextTab.expectSelectedLanguageToBe(
      GERMAN_LANGUAGE);
  });

  it('should persist user\'s preferred translation language across sessions',
    async function() {
      await users.login(USER_EMAILS[0]);
      await contributorDashboardPage.get();
      await contributorDashboardPage.navigateToTranslateTextTab();
      await contributorDashboardTranslateTextTab.changeLanguage(
        GERMAN_LANGUAGE);
      await contributorDashboardTranslateTextTab.expectSelectedLanguageToBe(
        GERMAN_LANGUAGE);
      await users.logout();

      await users.login(USER_EMAILS[0]);
      await contributorDashboardPage.get();
      await contributorDashboardPage.navigateToTranslateTextTab();
      await contributorDashboardTranslateTextTab.expectSelectedLanguageToBe(
        GERMAN_LANGUAGE);
      await users.logout();
    });

  it('should allow the users to use the copy tool', async function() {
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    let explorationEditorPage = new ExplorationEditorPage.
      ExplorationEditorPage();

    await users.login(ADMIN_EMAIL);

    // Creating an exploration with an image.
    await creatorDashboardPage.get();
    await workflow.createExploration(true);
    let explorationEditorMainTab = explorationEditorPage.getMainTab();
    await explorationEditorMainTab.setContent(async function(richTextEditor) {
      await richTextEditor.addRteComponent(
        'Image',
        'create',
        ['rectangle', 'bezier', 'piechart', 'svgupload'],
        'An svg diagram.');
    }, true);
    await explorationEditorMainTab.setInteraction('EndExploration');
    var explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    await explorationEditorPage.navigateToSettingsTab();
    let width = (await browser.getWindowSize()).width;
    if (width < 769) {
      var basicSettings = $('.e2e-test-settings-container');
      await action.click('Basic Settings', basicSettings);
    }
    await explorationEditorSettingsTab.setTitle('exp1');
    await explorationEditorSettingsTab.setCategory('Algebra');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorSettingsTab.setObjective(
      'Dummy exploration for testing images'
    );
    await explorationEditorPage.saveChanges('Done!');
    await workflow.publishExploration();
    let dummyExplorationId = await general.getExplorationIdFromEditor();

    // Adding the exploration to a curated lesson.
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.waitForTopicsToLoad();
    await topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);
    await topicEditorPage.createStory(
      'Story Title', 'topicandstoryeditorone', 'Story description',
      Constants.TEST_SVG_PATH);
    await storyEditorPage.createNewChapter(
      'Chapter 1', dummyExplorationId, Constants.TEST_SVG_PATH);
    await storyEditorPage.updateMetaTagContent('story meta tag');
    await storyEditorPage.saveStory('Saving Story');
    await storyEditorPage.publishStory();

    // Testing the copy tool.
    let opportunityActionButtonCss = $(
      '.e2e-test-opportunity-list-item-button');
    let copyButton = $('.e2e-test-copy-button');
    let doneButton = $('.e2e-test-close-rich-text-component-editor');
    let cancelButton = $('.e2e-test-cancel-rich-text-editor');

    await contributorDashboardPage.get();
    await waitFor.pageToFullyLoad();
    await contributorDashboardPage.navigateToTranslateTextTab();
    await contributorDashboardTranslateTextTab.changeLanguage(
      GERMAN_LANGUAGE);
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await action.click('Opportunity button', opportunityActionButtonCss);
    let image = $('.e2e-test-image');
    await waitFor.visibilityOf(
      image,
      'Test image taking too long to appear.');
    let images = await $$('.e2e-test-image');
    expect(images.length).toEqual(1);

    // Copy tool should copy image on pressing 'Done'.
    await waitFor.visibilityOf(
      copyButton, 'Copy button taking too long to appear');
    await action.click('Copy button', copyButton);
    await action.click('Image', images[0]);
    await action.click('Done', doneButton);
    images = await $$('.e2e-test-image');
    expect(images.length).toEqual(2);

    // Copy tool should not copy image on pressing 'Cancel'.
    await waitFor.visibilityOf(
      copyButton, 'Copy button taking too long to appear');
    await action.click('Image', images[0]);
    await action.click('Cancel', cancelButton);
    expect(images.length).toEqual(2);
    await users.logout();
  });

  it('should allow reviewer to accept question suggestions', async function() {
    // Baseline verification.
    await users.login(USER_EMAILS[0]);
    await contributorDashboardPage.get();

    await contributorDashboardPage.navigateToSubmitQuestionTab();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectOpportunityWithPropertiesToExist(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(0%)');

    // Submit suggestion as user0.
    await contributorDashboardPage.clickOpportunityActionButton(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0]);
    await skillEditorPage.confirmSkillDifficulty();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'), true);
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

    let width = (await browser.getWindowSize()).width;
    if (width < 700) {
      let opportunityItemSelector = function() {
        return $$('.e2e-test-opportunity-list-item');
      };
      let opportunity = (await opportunityItemSelector())[0];
      await action.click('Opportunity Item', opportunity);
    } else {
      await contributorDashboardPage.clickOpportunityActionButton(
        'Question 1', SKILL_DESCRIPTIONS[0]);
    }
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
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(10%)');
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
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(10%)');

    // Submit suggestion as user0.
    await contributorDashboardPage.clickOpportunityActionButton(
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0]);
    await skillEditorPage.confirmSkillDifficulty();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'), true);
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

    let width = (await browser.getWindowSize()).width;
    if (width < 700) {
      let opportunityItemSelector = function() {
        return $$('.e2e-test-opportunity-list-item');
      };
      let opportunity = (await opportunityItemSelector())[0];
      await action.click('Opportunity Item', opportunity);
    } else {
      await contributorDashboardPage.clickOpportunityActionButton(
        'Question 1', SKILL_DESCRIPTIONS[0]);
    }
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
      SKILL_DESCRIPTIONS[0], TOPIC_NAMES[0], null, '(10%)');
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
  const GERMAN_LANGUAGE = 'Deutsch (German)';
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

    await users.createAndLoginSuperAdminUser(
      'primaryAdmin@adminTab.com', 'primary');

    await adminPage.addRole(QUESTION_ADMIN_USERNAME, 'question admin');
    await adminPage.addRole(TRANSLATION_ADMIN_USERNAME, 'translation admin');
    await users.logout();
  });

  it('should allow translation admin to add translation reviewer',
    async function() {
      await users.login(TRANSLATION_ADMIN_EMAIL);
      await contributorDashboardAdminPage.get();
      await contributorDashboardAdminPage.assignTranslationReviewer(
        translationReviewerUsername, GERMAN_LANGUAGE);
      await contributorDashboardAdminPage.expectUserToBeTranslationReviewer(
        translationReviewerUsername, GERMAN_LANGUAGE);
      await users.logout();

      await users.login(translationReviewerEmail);
      await contributorDashboardPage.get();
      await contributorDashboardPage.expectUserToBeTranslationReviewer(
        GERMAN_LANGUAGE);
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
    await users.createAndLoginSuperAdminUser(
      'config@contributorDashboard.com', 'contributorDashboard');
    var adminPage = new AdminPage.AdminPage();
    await adminPage.editConfigProperty(
      'Featured Translation Languages',
      'List',
      async function(elem) {
        var featured = await elem.addItem('Dictionary');
        await (await featured.editEntry(0, 'Unicode')).setValue('de');
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
      .expectFeaturedLanguagesToBe(['Deutsch (German)']);
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
