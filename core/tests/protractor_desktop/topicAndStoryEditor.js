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
 * @fileoverview End-to-end tests for the topic editor page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');
var StoryEditorPage = require('../protractor_utils/StoryEditorPage.js');
var SkillEditorPage = require('../protractor_utils/SkillEditorPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');

describe('Topic editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var topicId = null;
  var skillEditorPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;

  beforeAll(async function() {
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    await users.createAndLoginAdminUser(
      'creator@topicEditor.com', 'creatorTopicEditor');
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic('Topic 1',
      'Description', false);
    var url = await browser.getCurrentUrl();
    topicId = url.split('/')[4];
    await general.closeCurrentTabAndSwitchTo(handle);
  });

  beforeEach(async function() {
    await users.login('creator@topicEditor.com');
    await topicEditorPage.get(topicId);
  });

  it('should add and delete subtopics correctly', async function() {
    await topicEditorPage.moveToSubtopicsTab();
    await topicEditorPage.addSubtopic('Subtopic 1');
    await topicEditorPage.expectNumberOfSubtopicsToBe(1);
    await topicEditorPage.saveTopic('Added subtopic.');

    await topicEditorPage.get(topicId);
    await topicEditorPage.moveToSubtopicsTab();
    await topicEditorPage.expectNumberOfSubtopicsToBe(1);
    await topicEditorPage.deleteSubtopicWithIndex(0);
    await topicEditorPage.expectNumberOfSubtopicsToBe(0);
  });

  it('should create a question for a skill in the topic', async function() {
    var skillId = null;
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        'Skill 1', 'Concept card explanation', false);
    var url = await browser.getCurrentUrl();
    skillId = url.split('/')[4];
    await general.closeCurrentTabAndSwitchTo(handle);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillWithIndexToTopic(0, 0);

    await topicEditorPage.get(topicId);
    await topicEditorPage.moveToQuestionsTab();
    await topicEditorPage.createQuestionForSkillWithIndex(0);
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
    await explorationEditorMainTab.setInteraction(
      'TextInput', 'Placeholder', 5);
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', 'correct');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.markAsCorrect();
    await explorationEditorMainTab.addHint('Hint 1');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'correct',
      explanation: 'It is correct'
    });
    await topicEditorPage.saveQuestion();

    await topicEditorPage.get(topicId);
    await topicEditorPage.moveToQuestionsTab();
    await topicEditorPage.expectNumberOfQuestionsForSkillWithDescriptionToBe(
      1, 'Skill 1');

    await skillEditorPage.get(skillId);
    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.expectNumberOfQuestionsToBe(1);
  });

  it('should add a canonical story to topic correctly', async function() {
    await topicEditorPage.expectNumberOfStoriesToBe(0);
    await topicEditorPage.createStory('Story Title');
    await storyEditorPage.returnToTopic();

    await topicEditorPage.expectNumberOfStoriesToBe(1);
  });

  it('should edit story title, description and notes correctly',
    async function() {
      await topicEditorPage.navigateToStoryWithIndex(0);
      await storyEditorPage.changeStoryNotes(
        await forms.toRichText('Story notes'));
      await storyEditorPage.changeStoryTitle('Story Title Edited');
      await storyEditorPage.changeStoryDescription('Story Description');
      await storyEditorPage.saveStory(
        'Changed story title, description and notes');

      await storyEditorPage.returnToTopic();
      await topicEditorPage.expectStoryTitleToBe('Story Title Edited', 0);
      await topicEditorPage.navigateToStoryWithIndex(0);

      await storyEditorPage.expectTitleToBe('Story Title Edited');
      await storyEditorPage.expectDescriptionToBe('Story Description');
      await storyEditorPage.expectNotesToBe(
        await forms.toRichText('Story notes'));
    });

  it('should add and remove nodes (chapters) from a story', async function() {
    await topicEditorPage.navigateToStoryWithIndex(0);
    await storyEditorPage.expectNumberOfChaptersToBe(0);
    await storyEditorPage.createInitialChapter('Chapter 1');
    await storyEditorPage.expectNumberOfChaptersToBe(1);

    await storyEditorPage.createNewDestinationChapter('Chapter 2');
    await storyEditorPage.expectNumberOfChaptersToBe(2);
    await storyEditorPage.deleteChapterWithIndex(1);
    await storyEditorPage.expectNumberOfChaptersToBe(1);
  });

  it('should assign a skill to, between, and from subtopics', async function() {
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Skill 2', 'Concept card explanation', true);
    var TOPIC_NAME = 'TASE2';
    var TOPIC_DESCRIPTION = 'TASE2 description';
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(TOPIC_NAME,
      TOPIC_DESCRIPTION, false);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillWithIndexToTopicByTopicName(
      0, TOPIC_NAME);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);
    await topicEditorPage.moveToSubtopicsTab();
    await topicEditorPage.addSubtopic('Subtopic 1');
    await topicEditorPage.addSubtopic('Subtopic 2');
    await topicEditorPage.saveTopic('Added subtopics.');

    await topicEditorPage.expectSubtopicToHaveSkills(0, []);
    await topicEditorPage.expectSubtopicToHaveSkills(1, []);

    await topicEditorPage.dragSkillToSubtopic(0, 0);
    await topicEditorPage.expectSubtopicToHaveSkills(0, ['Skill 2']);
    await topicEditorPage.expectSubtopicToHaveSkills(1, []);

    await topicEditorPage.dragSkillBetweenSubtopics(0, 0, 1);
    await topicEditorPage.expectSubtopicToHaveSkills(0, []);
    await topicEditorPage.expectSubtopicToHaveSkills(1, ['Skill 2']);

    await topicEditorPage.dragSkillFromSubtopicToUncategorized(1, 0);
    await topicEditorPage.expectSubtopicToHaveSkills(0, []);
    await topicEditorPage.expectSubtopicToHaveSkills(1, []);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});

describe('Chapter editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var storyId = null;
  var explorationEditorPage = null;
  var dummyExplorationIds = [];
  var dummyExplorationInfo = [
    'Dummy exploration', 'Algorithm', 'Learn more about oppia', 'English'];
  var dummySkills = [];
  var allowedErrors = [];
  var topicName = 'Topic 0';
  var userEmail = 'creator@chapterTest.com';

  var createDummyExplorations = async function(numExplorations) {
    var ids = [];
    for (var i = 0; i < numExplorations; i++) {
      var info = dummyExplorationInfo.slice();
      info[0] += i.toString();
      await workflow.createAndPublishExploration.apply(workflow, info);
      var url = await browser.getCurrentUrl();
      var id = url.split('/')[4].replace('#', '');
      ids.push(id);
    }
    return ids;
  };

  var createDummySkills = async function(numSkills) {
    var skills = [];
    for (var i = 0; i < numSkills; i++) {
      var skillName = 'skillFromChapterEditor' + i.toString();
      var material = 'reviewMaterial' + i.toString();
      await workflow.createSkillAndAssignTopic(skillName, material, topicName);
      skills.push(skillName);
    }
    return skills;
  };

  beforeAll(async function() {
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    await users.createAndLoginAdminUser(
      userEmail, 'creatorChapterTest');
    var handle = await browser.getWindowHandle();
    dummyExplorationIds = await createDummyExplorations(3);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(topicName,
      'Description', false);
    await topicEditorPage.createStory('Story 0');
    var url = await browser.getCurrentUrl();
    storyId = url.split('/')[4];
    await general.closeCurrentTabAndSwitchTo(handle);
    dummySkills = await createDummySkills(2);
  });

  beforeEach(async function() {
    await users.login(userEmail);
    await storyEditorPage.get(storyId);
  });

  it('should create a basic chapter.', async function() {
    await storyEditorPage.createInitialChapter('Chapter 1');
    await storyEditorPage.changeNodeDescription('Chapter description 1');
    await storyEditorPage.setChapterExplorationId(dummyExplorationIds[0]);
    await storyEditorPage.changeNodeOutline(
      await forms.toRichText('First outline'));
    await storyEditorPage.saveStory('First save');
    await users.logout();
    await users.login(userEmail);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(topicName);
    await topicEditorPage.navigateToStoryWithIndex(0);
    await storyEditorPage.expectNodeDescription('Chapter description 1');
  });

  it(
    'should check presence of skillreview RTE element in exploration ' +
    'linked to story', async function() {
      await browser.get('/create/' + dummyExplorationIds[0]);
      await waitFor.pageToFullyLoad();
      await explorationEditorMainTab.setContent(
        async function(richTextEditor) {
          await richTextEditor.addRteComponent(
            'Skillreview', 'Description', 'skillFromChapterEditor0');
        });
      await explorationEditorPage.navigateToPreviewTab();
      await explorationPlayerPage.expectContentToMatch(
        async function(richTextChecker) {
          await richTextChecker.readRteComponent(
            'Skillreview', 'Description',
            await forms.toRichText('reviewMaterial0'));
        });
    });

  it('should add one more chapter to the story', async function() {
    await storyEditorPage.createNewDestinationChapter('Chapter 2');
    await storyEditorPage.navigateToChapterByIndex(1);
    await storyEditorPage.changeNodeDescription('Chapter description 2');
    await storyEditorPage.changeNodeOutline(
      await forms.toRichText('Second outline'));
    await storyEditorPage.setChapterExplorationId(dummyExplorationIds[1]);
    await storyEditorPage.saveStory('Second save');
    await users.logout();
    await users.login(userEmail);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(topicName);
    await topicEditorPage.navigateToStoryWithIndex(0);
    await storyEditorPage.navigateToChapterByIndex(1);
    await storyEditorPage.expectNodeDescription('Chapter description 2');
  });

  it('should fail to add one more chapter with existing exploration',
    async function() {
      await storyEditorPage.navigateToChapterByIndex(1);
      await storyEditorPage.createNewDestinationChapter('Chapter 3');
      await storyEditorPage.navigateToChapterByIndex(2);
      await storyEditorPage.setChapterExplorationId(dummyExplorationIds[1]);
      await storyEditorPage.expectExplorationIdAlreadyExistWarningAndCloseIt();
      allowedErrors.push('The given exploration already exists in the story.');
    }
  );

  it('should add one more chapter and change the chapters sequences',
    async function() {
      await storyEditorPage.navigateToChapterByIndex(1);
      await storyEditorPage.createNewDestinationChapter('Chapter 3');
      await storyEditorPage.navigateToChapterByIndex(2);
      await storyEditorPage.setChapterExplorationId(dummyExplorationIds[2]);
      await storyEditorPage.selectInitialChapterByName('Chapter 2');

      // Now Chapter 2 is the initial chapter and its destination is
      // Chapter 3. Make Chapter 2's destination to be Chapter 1
      await storyEditorPage.navigateToChapterByIndex(0);
      await storyEditorPage.removeDestination();
      await storyEditorPage.selectDestinationChapterByName('Chapter 1');
      await storyEditorPage.expectDestinationToBe('Chapter 1');

      // Make chapter 1's destination to be Chapter 3
      await storyEditorPage.navigateToChapterByIndex(1);
      await storyEditorPage.selectDestinationChapterByName('Chapter 3');
      await storyEditorPage.expectDestinationToBe('Chapter 3');
    }
  );

  it('should add one prerequisite and acquired skill to chapter 1',
    async function() {
      await storyEditorPage.expectAcquiredSkillDescriptionCardCount(0);
      await storyEditorPage.expectPrerequisiteSkillDescriptionCardCount(0);
      await storyEditorPage.addAcquiredSkill(dummySkills[0]);
      await storyEditorPage.expectAcquiredSkillDescriptionCardCount(1);
      await storyEditorPage.addPrerequisiteSkill(dummySkills[1]);
      await storyEditorPage.expectPrerequisiteSkillDescriptionCardCount(1);
      await storyEditorPage.saveStory('Save');
    });

  it('should fail to add one prerequisite skill which is already added as' +
    ' acquired skill', async function() {
    await storyEditorPage.addAcquiredSkill(dummySkills[1]);
    await storyEditorPage.expectSaveStoryDisabled();
    var warningRegex = new RegExp(
      'The skill with id [a-zA-Z0-9]+ is common to both the acquired and ' +
      'prerequisite skill id ' +
      'list in .*');
    await storyEditorPage.expectWarningInIndicator(warningRegex);
  });

  it('should delete prerequisite skill and acquired skill', async function() {
    await storyEditorPage.deleteAcquiredSkillByIndex(0);
    await storyEditorPage.expectAcquiredSkillDescriptionCardCount(0);
    await storyEditorPage.deletePrerequisiteSkillByIndex(0);
    await storyEditorPage.expectPrerequisiteSkillDescriptionCardCount(0);
  });

  it('should select the "Chapter 2" as initial chapter and get unreachable' +
    ' error', async function() {
    await storyEditorPage.selectInitialChapterByName('Chapter 2');
    await storyEditorPage.expectDisplayUnreachableChapterWarning();
  });

  it('should delete one chapter and save', async function() {
    await storyEditorPage.expectNumberOfChaptersToBe(2);
    await storyEditorPage.deleteChapterWithIndex(1);
    await storyEditorPage.expectNumberOfChaptersToBe(1);
    await storyEditorPage.saveStory('Last');
  });

  afterEach(async function() {
    await general.checkForConsoleErrors(allowedErrors);
    while (allowedErrors.length !== 0) {
      allowedErrors.pop();
    }
  });

  afterAll(async function() {
    await users.logout();
  });
});
