// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the contributor admin dashboard page.
 */

let action = require('../webdriverio_utils/action.js');
let users = require('../webdriverio_utils/users.js');
let general = require('../webdriverio_utils/general.js');
let waitFor = require('../webdriverio_utils/waitFor.js');

let ReleaseCoordinatorPage = require(
  '../webdriverio_utils/ReleaseCoordinatorPage.js');
let AdminPage = require('../webdriverio_utils/AdminPage.js');
let forms = require('../webdriverio_utils/forms.js');
let ContributorDashboardPage = require(
  '../webdriverio_utils/ContributorDashboardPage.js');
let ContributorDashboardAdminPage = require(
  '../webdriverio_utils/ContributorDashboardAdminPage.js');
let TopicsAndSkillsDashboardPage = require(
  '../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
let SkillEditorPage = require(
  '../webdriverio_utils/SkillEditorPage.js');
let ExplorationEditorPage = require(
  '../webdriverio_utils/ExplorationEditorPage.js');
let StoryEditorPage = require('../webdriverio_utils/StoryEditorPage.js');
let workflow = require('../webdriverio_utils/workflow.js');
let TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');
let CreatorDashboardPage = require(
  '../webdriverio_utils/CreatorDashboardPage.js'
);
let Constants = require('../webdriverio_utils/WebdriverioConstants.js');

describe('Contributor Admin Dashboard', function() {
  const TOPIC_NAMES = [
    'Topic 0 for contribution', 'Topic 1 for contribution'];
  const SKILL_DESCRIPTIONS = [
    'Skill 0 for suggestion', 'Skill 1 for suggestion'];
  const REVIEW_MATERIALS = [
    'Review Material 0',
    'Review Material 1'];
  const QUESTION_ADMIN_USERNAME = 'user4321';
  const TRANSLATION_COORDINATOR_EMAIL = 'translation@coordinator.com';
  const QUESTION_COORDINATOR_EMAIL = 'question@coordinator.com';
  const ADMIN_EMAIL = 'curricullum@admin.com';
  const USER_EMAILS = ['user0@contributor.com', 'user1@contributor.com'];
  const QUESTION_ADMIN_EMAIL = 'user@contributor.com';

  let releaseCoordinatorPage = null;
  let adminPage = null;
  let contributorDashboardAdminPage = null;
  let contributorDashboardPage = null;
  let topicsAndSkillsDashboardPage = null;
  let skillEditorPage = null;
  let explorationEditorPage = null;
  let explorationEditorMainTab = null;
  let creatorDashboardPage = null;
  let topicEditorPage = null;
  let storyEditorPage = null;
  let contributorDashboardTranslateTextTab = null;

  beforeAll(async function() {
    contributorDashboardPage = (
      new ContributorDashboardPage.ContributorDashboardPage());
    contributorDashboardTranslateTextTab = (
      contributorDashboardPage.getTranslateTextTab());
    adminPage = new AdminPage.AdminPage();
    releaseCoordinatorPage = (
      new ReleaseCoordinatorPage.ReleaseCoordinatorPage());
    contributorDashboardAdminPage = (
      new ContributorDashboardAdminPage.ContributorDashboardAdminPage());
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();

    await users.createUser(TRANSLATION_COORDINATOR_EMAIL, 'translation');
    await users.createUser(QUESTION_COORDINATOR_EMAIL, 'question');
    await users.createUser(QUESTION_ADMIN_EMAIL, QUESTION_ADMIN_USERNAME);
    await users.createUser(USER_EMAILS[0], 'user0');
    await users.createUser(USER_EMAILS[1], 'user1');

    await users.createAndLoginCurriculumAdminUser(ADMIN_EMAIL, 'management');
    await adminPage.get();
    await adminPage.addRole('management', 'release coordinator');
    await adminPage.addRole('question', 'question coordinator');
    await adminPage.makeUserTranslationCoordinator('translation', 'English');
    await adminPage.addLanguageToCoordinator('translation', 'shqip (Albanian)');
    await adminPage.addLanguageToCoordinator('translation', 'العربية (Arabic)');
    await adminPage.addRole('question', 'translation admin');
    await users.logout();

    await users.login(QUESTION_COORDINATOR_EMAIL);
    await contributorDashboardAdminPage.get();
    await contributorDashboardAdminPage.assignQuestionContributor('user0');
    await contributorDashboardAdminPage.assignQuestionContributor('user1');
    await contributorDashboardAdminPage.assignQuestionReviewer('user1');
    await contributorDashboardAdminPage.assignTranslationReviewer(
      'user1', 'shqip (Albanian)');
    await contributorDashboardAdminPage.assignTranslationReviewer(
      'user1', 'English');
    await users.logout();

    // Populating Dashboard.
    await users.createUser('dummy@example.com', 'dummy');

    await users.login(ADMIN_EMAIL);
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
        await action.setValue(
          'Topic Id', elem, TOPIC_ID, clickInputElement = false);
      });

    // Creating an exploration with an image.
    await creatorDashboardPage.get();
    await workflow.createExploration(true);
    await explorationEditorMainTab.setContent(async function(richTextEditor) {
      await richTextEditor.addRteComponent(
        'Image',
        'create',
        ['rectangle', 'bezier', 'piechart', 'svgupload'],
        'An svg diagram.');
    }, true);
    await explorationEditorMainTab.setInteraction('EndExploration');
    let explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    await explorationEditorPage.navigateToSettingsTab();
    let basicSettings = $('.e2e-test-settings-container');
    await action.click('Basic Settings', basicSettings);
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

    let opportunityActionButtonCss = $(
      '.e2e-test-opportunity-list-item-button');
    await contributorDashboardPage.get();
    await waitFor.pageToFullyLoad();
    await contributorDashboardPage.navigateToTranslateTextTab();
    await contributorDashboardTranslateTextTab.changeLanguage(
      'shqip (Albanian)');
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await action.click('Opportunity button', opportunityActionButtonCss);
    let image = $('.e2e-test-image');
    await waitFor.visibilityOf(
      image,
      'Test image taking too long to appear.');
    let images = await $$('.e2e-test-image');
    expect(images.length).toEqual(1);
    await contributorDashboardAdminPage.copyElementWithClassName(
      'image', images[0]);

    // Accept suggestion as user1.
    await users.login(USER_EMAILS[1]);
    await contributorDashboardPage.get();
    await contributorDashboardPage.selectTranslationReviewButton();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.selectReviewLanguage('shqip (Albanian)');

    await contributorDashboardPage.clickOpportunityActionButton(
      'Chapter 1', 'Topic 0 for contribution - Story Title');

    await contributorDashboardPage.clickOpportunityActionButton(
      '[Image]', 'Topic 0 for contribution / Story Title / Chapter 1');

    await contributorDashboardAdminPage.acceptTranslation();
    await users.logout();

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

    await contributorDashboardPage.clickOpportunityActionButton(
      'Question 1', SKILL_DESCRIPTIONS[0]);
    await (
      contributorDashboardPage.waitForQuestionSuggestionReviewModalToAppear());
    await contributorDashboardPage.clickAcceptQuestionSuggestionButton();
    await contributorDashboardPage.waitForOpportunitiesToLoad();
    await contributorDashboardPage.expectEmptyOpportunityAvailabilityMessage();
    await users.logout();

    await users.login(ADMIN_EMAIL);

    // The below lines enable the cd_admin_dashboard_new_ui flag in dev mode.
    // They should be removed after the cd_admin_dashboard_new_ui flag is
    // deprecated.
    await releaseCoordinatorPage.getFeaturesTab();
    let CdAdminDashboardNewUiFlag = (
      await releaseCoordinatorPage.getCdAdminDashboardNewUiFeatureElement());
    await releaseCoordinatorPage.enableFeature(
      CdAdminDashboardNewUiFlag);

    await users.logout();
  });

  it('should allow question coordinator to view dashboard', async function() {
    await users.login(QUESTION_COORDINATOR_EMAIL);
    await contributorDashboardAdminPage.get();

    await contributorDashboardAdminPage.navigateToQuestionSubmitterTab();
    await contributorDashboardAdminPage.waitForLoadingMessageToDisappear();
    await contributorDashboardAdminPage.expectStatsElementCountToBe(1);
    await contributorDashboardAdminPage.expectStatsRowsAreExpanded();

    await contributorDashboardAdminPage.navigateToQuestionReviewerTab();
    await contributorDashboardAdminPage.waitForLoadingMessageToDisappear();
    await contributorDashboardAdminPage.expectStatsElementCountToBe(1);
    await contributorDashboardAdminPage.expectStatsRowsAreExpanded();

    await users.logout();
  });

  it('should allow translation coordinator to view dashboard',
    async function() {
      await users.login(TRANSLATION_COORDINATOR_EMAIL);
      await contributorDashboardAdminPage.get();

      await contributorDashboardAdminPage.navigateToTranslationSubmitterTab();
      await contributorDashboardAdminPage.waitForLoadingMessageToDisappear();
      await contributorDashboardAdminPage.expectNoStatsElement();

      await contributorDashboardAdminPage.switchLanguage('Albanian (shqip)');
      await contributorDashboardAdminPage.waitForLoadingMessageToDisappear();
      await contributorDashboardAdminPage.expectStatsElementCountToBe(1);
      await contributorDashboardAdminPage.expectStatsRowsAreExpanded();

      await contributorDashboardAdminPage.navigateToTranslationReviewerTab();
      await contributorDashboardAdminPage.waitForLoadingMessageToDisappear();
      await contributorDashboardAdminPage.expectStatsElementCountToBe(1);
      await contributorDashboardAdminPage.expectStatsRowsAreExpanded();

      await contributorDashboardAdminPage.switchLanguage('English');
      await contributorDashboardAdminPage.waitForLoadingMessageToDisappear();
      await contributorDashboardAdminPage.expectNoStatsElement();
      await users.logout();
    });
});
