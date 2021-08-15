// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the learner dashboard page.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LearnerDashboardPage =
  require('../protractor_utils/LearnerDashboardPage.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');
var StoryEditorPage = require('../protractor_utils/StoryEditorPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var SubscriptionDashboardPage =
  require('../protractor_utils/SubscriptionDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');

describe('Learner dashboard functionality', function() {
  var explorationPlayerPage = null;
  var topicsAndSkillsDashboardPage = null;
  var adminPage = null;
  var libraryPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var learnerDashboardPage = null;
  var subscriptionDashboardPage = null;

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  });

  it('should display learners subscriptions', async function() {
    await users.createUser(
      'learner1@learnerDashboard.com', 'learner1learnerDashboard');
    var creator1Id = 'creatorName';
    await users.createUser(creator1Id + '@learnerDashboard.com', creator1Id);
    var creator2Id = 'collectionAdm';
    await users.createUser(
      creator2Id + '@learnerDashboard.com', creator2Id);
    await users.login(creator1Id + '@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      'Activations',
      'Chemistry',
      'Learn about different types of chemistry activations.',
      'English',
      true
    );
    await users.logout();

    await users.login('learner1@learnerDashboard.com');
    // Subscribe to both the creators.
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    await subscriptionDashboardPage.navigateToSubscriptionButton();
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(creator2Id);
    await subscriptionDashboardPage.navigateToSubscriptionButton();

    // Completing exploration 'Activations' to activate /learner_dashboard.
    await libraryPage.get();
    await libraryPage.findExploration('Activations');
    await libraryPage.playExploration('Activations');
    await explorationPlayerPage.expectExplorationNameToBe('Activations');
    await explorationPlayerPage.rateExploration(4);

    // Both creators should be present in the subscriptions section of the
    // dashboard.
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToCommunityLessonsSection();
    // The last user (creatorName) that learner subsribes to is placed first
    // in the list.
    await learnerDashboardPage.expectSubscriptionFirstNameToMatch('creator...');
    // The first user (collectionAdm) that learner subscribes to is placed
    // last in the list.
    await learnerDashboardPage.expectSubscriptionLastNameToMatch('collect...');
    await users.logout();
  });

  it('should display learner feedback threads', async function() {
    await users.createUser(
      'learner2@learnerDashboard.com', 'learner2learnerDashboard');
    await users.createUser(
      'feedbackAdm@learnerDashboard.com', 'feedbackAdmlearnerDashboard');
    await users.login('feedbackAdm@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      'BUS101',
      'Business',
      'Learn about different business regulations around the world.',
      'English',
      true
    );
    await users.logout();

    await users.login('learner2@learnerDashboard.com');
    var feedback = 'A good exploration. Would love to see a few more questions';
    await libraryPage.get();
    await libraryPage.findExploration('BUS101');
    await libraryPage.playExploration('BUS101');
    await explorationPlayerPage.submitFeedback(feedback);

    // Verify feedback thread is created.
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToFeedbackSection();
    await learnerDashboardPage.expectFeedbackExplorationTitleToMatch('BUS101');
    await learnerDashboardPage.navigateToFeedbackThread();
    await learnerDashboardPage.expectFeedbackMessageToMatch(feedback);
    await users.logout();
  });

  it('should add exploration to play later list', async function() {
    var EXPLORATION_FRACTION = 'fraction';
    var EXPLORATION_SINGING = 'singing';
    var CATEGORY_MATHEMATICS = 'Mathematics';
    var CATEGORY_MUSIC = 'Music';
    var LANGUAGE_ENGLISH = 'English';
    var EXPLORATION_OBJECTIVE = 'hold the light of two trees';
    var EXPLORATION_OBJECTIVE2 = 'show us the darkness';

    await users.createUser(
      'creator@learnerDashboard.com', 'creatorLearnerDashboard');
    await users.login('creator@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_FRACTION,
      CATEGORY_MATHEMATICS,
      EXPLORATION_OBJECTIVE,
      LANGUAGE_ENGLISH,
      true
    );
    await workflow.createAndPublishExploration(
      EXPLORATION_SINGING,
      CATEGORY_MUSIC,
      EXPLORATION_OBJECTIVE2,
      LANGUAGE_ENGLISH,
      false
    );
    await users.logout();

    await users.createUser(
      'learner@learnerDashboard.com', 'learnerLearnerDashboard');
    await users.login('learner@learnerDashboard.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_FRACTION);
    await libraryPage.addSelectedExplorationToPlaylist();
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToCommunityLessonsSection();
    await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_FRACTION);
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_SINGING);
    await libraryPage.addSelectedExplorationToPlaylist();
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToCommunityLessonsSection();
    await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_SINGING);
    await users.logout();
  });

  it('should display correct topics in edit goals and current goals' +
    ' section', async function() {
    var TOPIC_NAME = 'Learner Dashboard Topic 1';
    var TOPIC_URL_FRAGMENT_NAME = 'ld-topic-one';
    var TOPIC_DESCRIPTION = 'Topic description';
    await users.createAndLoginCurriculumAdminUser(
      'creator@learnerDashboard1.com', 'learnerDashboard1');
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAME, TOPIC_URL_FRAGMENT_NAME, TOPIC_DESCRIPTION, false);
    await topicEditorPage.expectNumberOfStoriesToBe(0);
    await topicEditorPage.createStory(
      'Story Title', 'story-one', 'Story description',
      '../data/test_svg.svg');
    await storyEditorPage.returnToTopic();

    await topicEditorPage.expectNumberOfStoriesToBe(1);
    await topicEditorPage.expectStoryPublicationStatusToBe('No', 0);
    await topicEditorPage.navigateToStoryWithIndex(0);
    await storyEditorPage.updateMetaTagContent('story meta tag');
    await storyEditorPage.saveStory('Added meta tag.');
    await storyEditorPage.publishStory();
    await storyEditorPage.returnToTopic();
    await topicEditorPage.expectStoryPublicationStatusToBe('Yes', 0);

    var url = await browser.getCurrentUrl();
    var topicId = url.split('/')[4].slice(0, -1);
    await general.closeCurrentTabAndSwitchTo(handle);
    await adminPage.editConfigProperty(
      'The details for each classroom page.',
      'List',
      async function(elem) {
        elem = await elem.editItem(0, 'Dictionary');
        elem = await elem.editEntry(4, 'List');
        elem = await elem.addItem('Unicode');
        await elem.setValue(topicId);
      });
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    (
      await
      topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
        'Learner Dashboard Skill 1', 'Concept card explanation', false));
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Learner Dashboard Skill 1', TOPIC_NAME);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);
    await topicEditorPage.addSubtopic(
      'Learner Dashboard Subtopic 1', 'ld-subtopic-one',
      '../data/test2_svg.svg', 'Subtopic content');
    await topicEditorPage.saveTopic('Added subtopic.');

    await topicEditorPage.navigateToTopicEditorTab();
    await topicEditorPage.navigateToReassignModal();

    await topicEditorPage.dragSkillToSubtopic('Learner Dashboard Skill 1', 0);
    await topicEditorPage.saveRearrangedSkills();
    await topicEditorPage.saveTopic('Added skill to subtopic.');

    await topicEditorPage.updateMetaTagContent('meta tag content');
    await topicEditorPage.updatePageTitleFragment('fragment');
    await topicEditorPage.saveTopic('Added meta tag and page title fragment.');

    await topicEditorPage.publishTopic();
    /**  There is one topic on the server named Learner Dashboard Topic 1
     * which is linked to a subtopic named Learner Dashboard Subtopic 1
     * and a story called Story Title. Learner Dashboard Subtopic 1 has one
     * skill in it named Learner Dashboard Skill 1.
     */
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToGoalsSection();
    await learnerDashboardPage.expectNameOfTopicInEditGoalsToMatch(
      TOPIC_NAME);
    await learnerDashboardPage.addTopicToLearnerGoals();
    await learnerDashboardPage.navigateToGoalsSection();
    await learnerDashboardPage.expectNameOfTopicInCurrentGoalsToMatch(
      `Learn ${TOPIC_NAME}`);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
