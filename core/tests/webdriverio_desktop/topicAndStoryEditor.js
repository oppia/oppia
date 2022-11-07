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
 * @fileoverview End-to-end tests for the topic editor page.
 */

var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var Constants = require('../webdriverio_utils/WebdriverioConstants.js');
var TopicsAndSkillsDashboardPage =
  require('../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');
var StoryEditorPage = require('../webdriverio_utils/StoryEditorPage.js');
var SkillEditorPage = require('../webdriverio_utils/SkillEditorPage.js');
var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');

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
    await users.createAndLoginCurriculumAdminUser(
      'creator@topicEditor.com', 'creatorTopicEditor');
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      'Topic 1', 'unique-topic', 'Description', false);
    var url = await browser.getUrl();
    topicId = url.split('/')[4];
    await general.closeCurrentTabAndSwitchTo(handle);
    await users.logout();
  });

  beforeEach(async function() {
    await users.login('creator@topicEditor.com');
    await topicEditorPage.get(topicId);
  });

  it('should add and delete subtopics correctly', async function() {
    await topicEditorPage.addSubtopic(
      'Subtopic 1', 'subtopic-one', '../data/test2_svg.svg',
      'Subtopic content');
    await topicEditorPage.saveTopic('Added subtopic.');
    await users.logout();

    await users.login('creator@topicEditor.com');
    await topicEditorPage.get(topicId);
    await topicEditorPage.expectNumberOfSubtopicsToBe(1);
    await topicEditorPage.deleteSubtopicWithIndex(0);
    await topicEditorPage.saveTopic('Deleted subtopic.');
    await topicEditorPage.expectNumberOfSubtopicsToBe(0);
  });

  it('should create a question for a skill in the topic', async function() {
    var skillId = null;
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage
      .createSkillWithDescriptionAndExplanation(
        'Skill 1', 'Concept card explanation', false);
    var url = await browser.getUrl();
    skillId = url.split('/')[4];
    await general.closeCurrentTabAndSwitchTo(handle);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.filterSkillsByStatus(
      Constants.SKILL_STATUS_UNASSIGNED);
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Skill 1', 'Topic 1');

    await skillEditorPage.get(skillId);
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    await skillEditorPage.saveOrPublishSkill('Edited rubrics');

    await topicEditorPage.get(topicId);
    await topicEditorPage.moveToQuestionsTab();
    await topicEditorPage.createQuestionForSkillWithName('Skill 1');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'), true);
    await explorationEditorMainTab.setInteraction(
      'TextInput', 'Placeholder', 5);
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Correct Answer'), null, false,
      'FuzzyEquals', ['correct']);
    var responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.markAsCorrect();
    await (
      await explorationEditorMainTab.getResponseEditor('default')
    ).setFeedback(await forms.toRichText('Try again'));
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
    await topicEditorPage.createStory(
      'Story Title', 'topicandstoryeditorone', 'Story description',
      Constants.TEST_SVG_PATH);
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

  it('should assign a skill to, and from subtopics',
    async function() {
      await topicsAndSkillsDashboardPage.get();
      await (
        topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
          'Skill 2', 'Concept card explanation', false));
      await skillEditorPage.addRubricExplanationForDifficulty(
        'Easy', 'Second explanation for easy difficulty.');
      await skillEditorPage.saveOrPublishSkill('Edited rubrics');
      // A minimum of three questions are required for skill to get assigned in
      // a topic’s diagnostic test.
      await workflow.createQuestion();
      await workflow.createQuestion();
      await workflow.createQuestion();

      await topicsAndSkillsDashboardPage.get();
      await (
        topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
          'Skill 3', 'Concept card explanation', true));

      var TOPIC_NAME = 'TASE2';
      var TOPIC_URL_FRAGMENT_NAME = 'tase-two';
      var TOPIC_DESCRIPTION = 'TASE2 description';
      await topicsAndSkillsDashboardPage.get();
      await topicsAndSkillsDashboardPage.createTopic(
        TOPIC_NAME, TOPIC_URL_FRAGMENT_NAME, TOPIC_DESCRIPTION, false);
      await topicsAndSkillsDashboardPage.get();
      await topicsAndSkillsDashboardPage.navigateToSkillsTab();
      await topicsAndSkillsDashboardPage.filterSkillsByStatus(
        Constants.SKILL_STATUS_UNASSIGNED);
      await topicsAndSkillsDashboardPage.assignSkillToTopic(
        'Skill 3', TOPIC_NAME);

      await topicsAndSkillsDashboardPage.get();
      await topicsAndSkillsDashboardPage.navigateToSkillsTab();
      await topicsAndSkillsDashboardPage.filterSkillsByStatus(
        Constants.SKILL_STATUS_UNASSIGNED);
      await topicsAndSkillsDashboardPage.assignSkillToTopic(
        'Skill 2', TOPIC_NAME);

      await topicsAndSkillsDashboardPage.get();
      await topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);

      await topicEditorPage.addDiagnosticTestSkill('Skill 2');

      await topicEditorPage.addSubtopic(
        'Subtopic 1', 'subtopic-two', '../data/test2_svg.svg',
        'Subtopic1 Content');
      await topicEditorPage.saveTopic('Added subtopic.');

      await topicEditorPage.navigateToTopicEditorTab();
      await topicEditorPage.addSubtopic(
        'Subtopic 2', 'subtopic-three', '../data/test2_svg.svg',
        'Subtopic2 Content');
      await topicEditorPage.saveTopic('Added subtopics.');

      await topicEditorPage.navigateToTopicEditorTab();
      await topicEditorPage.navigateToReassignModal();
      await topicEditorPage.expectUncategorizedSkillsToBe(
        ['Skill 3', 'Skill 2']);
      await topicEditorPage.expectSubtopicWithIndexToHaveSkills(0, []);
      await topicEditorPage.expectSubtopicWithIndexToHaveSkills(1, []);

      await topicEditorPage.dragSkillToSubtopic('Skill 2', 0);
      await topicEditorPage.expectSubtopicWithIndexToHaveSkills(0, ['Skill 2']);
      await topicEditorPage.dragSkillToSubtopic('Skill 3', 1);
      await topicEditorPage.expectSubtopicWithIndexToHaveSkills(1, ['Skill 3']);
      await topicEditorPage.dragSkillFromSubtopicToSubtopic(1, 0, 'Skill 3');
      await topicEditorPage.expectSubtopicWithIndexToHaveSkills(
        0, ['Skill 2', 'Skill 3']);
      await topicEditorPage.dragSkillFromSubtopicToUncategorized(0, 'Skill 2');
      await topicEditorPage.expectUncategorizedSkillsToBe(
        ['Skill 2']);
      await topicEditorPage.saveRearrangedSkills();
      await topicEditorPage.saveTopic('Rearranged skills');
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
  var storyName = 'Story 0';
  var explorationEditorPage = null;
  var dummyExplorationIds = [];
  var dummyExplorationInfo = [
    'Dummy exploration', 'Algorithms', 'Learn more about oppia', 'English'];
  var dummySkills = [];
  var allowedErrors = [];
  var topicName = 'Topic 0';
  var topicUrlFragment = 'topic-zero';
  var userEmail = 'creator@chapterTest.com';

  var createDummyExplorations = async function(numExplorations) {
    var ids = [];
    for (var i = 0; i < numExplorations; i++) {
      var info = dummyExplorationInfo.slice();
      info[0] += i.toString();
      if (i === 0) {
        info.push(true);
        await workflow.createAndPublishExploration.apply(workflow, info);
      } else {
        info.push(false);
        await workflow.createAndPublishExploration.apply(workflow, info);
      }
      var url = await browser.getUrl();
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
    await users.createAndLoginCurriculumAdminUser(
      userEmail, 'creatorChapterTest');
    var handle = await browser.getWindowHandle();
    dummyExplorationIds = await createDummyExplorations(3);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      topicName, topicUrlFragment, 'Description', false);
    await topicEditorPage.createStory(
      storyName, 'topicandstoryeditortwo', 'Story description',
      Constants.TEST_SVG_PATH);
    await general.closeCurrentTabAndSwitchTo(handle);
    dummySkills = await createDummySkills(2);
    await users.logout();
  });

  beforeEach(async function() {
    await users.login(userEmail);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(topicName);
    await topicEditorPage.navigateToStoryWithTitle(storyName);
  });

  it('should create a basic chapter.', async function() {
    await storyEditorPage.createNewChapter(
      'Chapter 1', dummyExplorationIds[0], Constants.TEST_SVG_PATH);
    await storyEditorPage.navigateToChapterWithName('Chapter 1');
    await storyEditorPage.changeNodeDescription('Chapter description 1');
    await storyEditorPage.changeNodeOutline(
      await forms.toRichText('First outline'));
    await storyEditorPage.saveStory('First save');
    await users.logout();
    await users.login(userEmail);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(topicName);
    await topicEditorPage.navigateToStoryWithIndex(0);
    await storyEditorPage.navigateToChapterWithName('Chapter 1');
    await storyEditorPage.expectNodeDescription('Chapter description 1');
  });

  it(
    'should check presence of skillreview RTE element in exploration ' +
    'linked to story', async function() {
      await browser.url('/create/' + dummyExplorationIds[0]);
      await waitFor.pageToFullyLoad();
      await explorationEditorMainTab.setContent(
        async function(richTextEditor) {
          await richTextEditor.addRteComponent(
            'Skillreview', 'Description', 'skillFromChapterEditor0');
        }, true);
      await explorationEditorPage.navigateToPreviewTab();
      await explorationPlayerPage.expectContentToMatch(
        async function(richTextChecker) {
          await richTextChecker.readRteComponent(
            'Skillreview', 'Description',
            await forms.toRichText('reviewMaterial0'));
        });
    });

  it('should add one more chapter to the story', async function() {
    await storyEditorPage.createNewChapter(
      'Chapter 2', dummyExplorationIds[1], Constants.TEST_SVG_PATH);
    await storyEditorPage.navigateToChapterWithName('Chapter 2');
    await storyEditorPage.changeNodeDescription('Chapter description 2');
    await storyEditorPage.changeNodeOutline(
      await forms.toRichText('Second outline'));
    await storyEditorPage.saveStory('Second save');
    await users.logout();
    await users.login(userEmail);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(topicName);
    await topicEditorPage.navigateToStoryWithIndex(0);
    await storyEditorPage.navigateToChapterWithName('Chapter 2');
    await storyEditorPage.expectNodeDescription('Chapter description 2');
  });

  it('should fail to add one more chapter with existing exploration',
    async function() {
      await storyEditorPage.createNewChapter(
        'Chapter 3', dummyExplorationIds[1], Constants.TEST_SVG_PATH);
      await storyEditorPage.expectExplorationIdAlreadyExistWarning();
      await storyEditorPage.cancelChapterCreation();
      await storyEditorPage.discardStoryChanges();
    }
  );

  it('should add one more chapter and change the chapters sequences',
    async function() {
      await storyEditorPage.createNewChapter(
        'Chapter 3', dummyExplorationIds[2], Constants.TEST_SVG_PATH);
      await storyEditorPage.navigateToChapterWithName('Chapter 3');
      await storyEditorPage.navigateToStoryEditorTab();
      await storyEditorPage.expectChaptersListToBe(
        ['Chapter 1', 'Chapter 2', 'Chapter 3']);

      await storyEditorPage.dragChapterToAnotherChapter(
        'Chapter 3', 'Chapter 1');
      await storyEditorPage.expectChaptersListToBe(
        ['Chapter 3', 'Chapter 1', 'Chapter 2']);

      await storyEditorPage.dragChapterToAnotherChapter(
        'Chapter 2', 'Chapter 1');
      await storyEditorPage.saveStory('Saving chapters');
      await storyEditorPage.expectChaptersListToBe(
        ['Chapter 3', 'Chapter 2', 'Chapter 1']);
    }
  );

  it('should add one prerequisite and acquired skill to chapter 1',
    async function() {
      await storyEditorPage.navigateToChapterWithName('Chapter 1');
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
    await storyEditorPage.navigateToChapterWithName('Chapter 1');
    await storyEditorPage.addAcquiredSkill(dummySkills[1]);
    await storyEditorPage.expectSaveStoryDisabled();
    var warningRegex = new RegExp(
      'The skill with id [a-zA-Z0-9]+ is common to both the acquired and ' +
      'prerequisite skill id ' +
      'list in .*');
    await storyEditorPage.expectWarningInIndicator(warningRegex);
    await storyEditorPage.discardStoryChanges();
  });

  it('should delete prerequisite skill and acquired skill', async function() {
    await storyEditorPage.navigateToChapterWithName('Chapter 1');
    await storyEditorPage.deleteAcquiredSkillByIndex(0);
    await storyEditorPage.expectAcquiredSkillDescriptionCardCount(0);
    await storyEditorPage.deletePrerequisiteSkillByIndex(0);
    await storyEditorPage.saveStory('Deleted skill');
    await storyEditorPage.expectPrerequisiteSkillDescriptionCardCount(0);
  });

  it('should delete one chapter and save', async function() {
    await storyEditorPage.expectNumberOfChaptersToBe(3);
    await storyEditorPage.deleteChapterWithIndex(1);
    await storyEditorPage.expectNumberOfChaptersToBe(2);
    await storyEditorPage.saveStory('Last');
  });

  afterEach(async function() {
    await general.checkForConsoleErrors(allowedErrors);
    await users.logout();
    while (allowedErrors.length !== 0) {
      allowedErrors.pop();
    }
  });
});
