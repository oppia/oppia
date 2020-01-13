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

describe('Topic editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var topicId = null;
  var skillEditorPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;

  beforeAll(function() {
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    users.createAndLoginAdminUser(
      'creator@topicEditor.com', 'creatorTopicEditor');
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic('Topic 1', 'abbrev');
    browser.getCurrentUrl().then(function(url) {
      topicId = url.split('/')[4];
    }, function() {
      // Note to developers:
      // Promise is returned by getCurrentUrl which is handled here.
      // No further action is needed.
    });
  });

  beforeEach(function() {
    users.login('creator@topicEditor.com');
    topicEditorPage.get(topicId);
  });

  it('should add and delete subtopics correctly', function() {
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.addSubtopic('Subtopic 1');
    topicEditorPage.expectNumberOfSubtopicsToBe(1);
    topicEditorPage.saveTopic('Added subtopic.');

    topicEditorPage.get(topicId);
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.expectNumberOfSubtopicsToBe(1);
    topicEditorPage.deleteSubtopicWithIndex(0);
    topicEditorPage.expectNumberOfSubtopicsToBe(0);
  });

  it('should edit subtopic page contents correctly', function() {
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.editSubtopicWithIndex(0);
    topicEditorPage.changeSubtopicTitle('Modified Title');
    topicEditorPage.changeSubtopicPageContents(
      forms.toRichText('Subtopic Contents'));
    topicEditorPage.saveSubtopic();
    topicEditorPage.saveTopic('Edited subtopic.');

    topicEditorPage.get(topicId);
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.expectTitleOfSubtopicWithIndexToMatch('Modified Title', 0);
    topicEditorPage.editSubtopicWithIndex(0);
    topicEditorPage.expectSubtopicPageContentsToMatch('Subtopic Contents');
  });

  it('should create a question for a skill in the topic', function() {
    var skillId = null;
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Skill 1', 'Concept card explanation');
    browser.getCurrentUrl().then(function(url) {
      skillId = url.split('/')[4];
      topicsAndSkillsDashboardPage.get();
      topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
      topicsAndSkillsDashboardPage.assignSkillWithIndexToTopic(0, 0);

      topicEditorPage.get(topicId);
      topicEditorPage.moveToQuestionsTab();
      topicEditorPage.createQuestionForSkillWithIndex(0);
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
      topicEditorPage.saveQuestion();

      topicEditorPage.get(topicId);
      topicEditorPage.moveToQuestionsTab();
      topicEditorPage.expectNumberOfQuestionsForSkillWithDescriptionToBe(
        1, 'Skill 1');

      skillEditorPage.get(skillId);
      skillEditorPage.moveToQuestionsTab();
      skillEditorPage.expectNumberOfQuestionsToBe(1);
    }, function() {
      // Note to developers:
      // Promise is returned by getCurrentUrl which is handled here.
      // No further action is needed.
    });
  });

  it('should add a canonical story to topic correctly', function() {
    topicEditorPage.expectNumberOfStoriesToBe(0);
    topicEditorPage.createStory('Story Title');
    storyEditorPage.returnToTopic();

    topicEditorPage.expectNumberOfStoriesToBe(1);
  });

  it('should edit story title, description and notes correctly', function() {
    topicEditorPage.navigateToStoryWithIndex(0);
    storyEditorPage.changeStoryNotes(forms.toRichText('Story notes'));
    storyEditorPage.changeStoryTitle('Story Title Edited');
    storyEditorPage.changeStoryDescription('Story Description');
    storyEditorPage.saveStory('Changed story title, description and notes');

    storyEditorPage.returnToTopic();
    topicEditorPage.expectStoryTitleToBe('Story Title Edited', 0);
    topicEditorPage.navigateToStoryWithIndex(0);

    storyEditorPage.expectTitleToBe('Story Title Edited');
    storyEditorPage.expectDescriptionToBe('Story Description');
    storyEditorPage.expectNotesToBe(forms.toRichText('Story notes'));
  });

  it('should add and remove nodes (chapters) from a story', function() {
    topicEditorPage.navigateToStoryWithIndex(0);
    storyEditorPage.expectNumberOfChaptersToBe(0);
    storyEditorPage.createInitialChapter('Chapter 1');
    storyEditorPage.expectNumberOfChaptersToBe(1);

    storyEditorPage.createNewDestinationChapter('Chapter 2');
    storyEditorPage.expectNumberOfChaptersToBe(2);
    storyEditorPage.deleteChapterWithIndex(1);
    storyEditorPage.expectNumberOfChaptersToBe(1);
  });

  it('should publish and unpublish a story correctly', function() {
    topicEditorPage.expectStoryPublicationStatusToBe('No', 0);
    topicEditorPage.navigateToStoryWithIndex(0);
    storyEditorPage.publishStory();
    storyEditorPage.returnToTopic();

    topicEditorPage.expectStoryPublicationStatusToBe('Yes', 0);
    topicEditorPage.navigateToStoryWithIndex(0);
    storyEditorPage.unpublishStory();
    storyEditorPage.returnToTopic();

    topicEditorPage.expectStoryPublicationStatusToBe('No', 0);
  });

  it('should assign a skill to, between, and from subtopics', function() {
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Skill 2', 'Concept card explanation');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
    topicsAndSkillsDashboardPage.assignSkillWithIndexToTopic(0, 0);

    topicEditorPage.get(topicId);
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.addSubtopic('Subtopic 1');
    topicEditorPage.addSubtopic('Subtopic 2');
    topicEditorPage.saveTopic('Added subtopics.');

    topicEditorPage.expectSubtopicToHaveSkills(0, []);
    topicEditorPage.expectSubtopicToHaveSkills(1, []);

    topicEditorPage.dragSkillToSubtopic(1, 0);
    topicEditorPage.expectSubtopicToHaveSkills(0, ['Skill 2']);
    topicEditorPage.expectSubtopicToHaveSkills(1, []);

    topicEditorPage.dragSkillBetweenSubtopics(0, 0, 1);
    topicEditorPage.expectSubtopicToHaveSkills(0, []);
    topicEditorPage.expectSubtopicToHaveSkills(1, ['Skill 2']);

    topicEditorPage.dragSkillFromSubtopicToUncategorized(1, 0);
    topicEditorPage.expectSubtopicToHaveSkills(0, []);
    topicEditorPage.expectSubtopicToHaveSkills(1, []);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
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

  var createDummyExplorations = function(numExplorations) {
    var ids = [];
    for (var i = 0; i < numExplorations; i++) {
      var info = dummyExplorationInfo.slice();
      info[0] += i.toString();
      workflow.createAndPublishExploration.apply(workflow, info);
      browser.getCurrentUrl().then(function(url) {
        var id = url.split('/')[4].replace('#', '');
        ids.push(id);
      });
    }
    return ids;
  };

  var createDummySkills = function(numSkills) {
    var skills = [];
    for (var i = 0; i < numSkills; i++) {
      var skillName = 'skillFromChapterEditor' + i.toString();
      var material = 'material' + i.toString();
      workflow.createSkillAndAssignTopic(skillName, material, topicName);
      skills.push(skillName);
    }
    return skills;
  };

  beforeAll(function() {
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    users.createAndLoginAdminUser(
      userEmail, 'creatorChapterTest');
    dummyExplorationIds = createDummyExplorations(3);
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic(topicName, 'abbrev');
    topicEditorPage.createStory('Story 0');
    browser.getCurrentUrl().then(function(url) {
      storyId = url.split('/')[4];
      dummySkills = createDummySkills(2);
    });
  });

  beforeEach(function() {
    users.login(userEmail);
    storyEditorPage.get(storyId);
  });

  it('should create a basic chapter.', function() {
    storyEditorPage.createInitialChapter('Chapter 1');
    storyEditorPage.setChapterExplorationId(dummyExplorationIds[0]);
    storyEditorPage.changeNodeOutline(forms.toRichText('First outline'));
    storyEditorPage.saveStory('First save');
  });

  it('should add one more chapter to the story', function() {
    storyEditorPage.createNewDestinationChapter('Chapter 2');
    storyEditorPage.navigateToChapterByIndex(1);
    storyEditorPage.changeNodeOutline(forms.toRichText('Second outline'));
    storyEditorPage.setChapterExplorationId(dummyExplorationIds[1]);
    storyEditorPage.saveStory('Second save');
  });

  it('should fail to add one more chapter with existing exploration',
    function() {
      storyEditorPage.navigateToChapterByIndex(1);
      storyEditorPage.createNewDestinationChapter('Chapter 3');
      storyEditorPage.navigateToChapterByIndex(2);
      storyEditorPage.setChapterExplorationId(dummyExplorationIds[1]);
      storyEditorPage.expectExplorationIdAlreadyExistWarningAndCloseIt();
      allowedErrors.push('The given exploration already exists in the story.');
    }
  );

  it('should add one more chapter and change the chapters sequences',
    function() {
      storyEditorPage.navigateToChapterByIndex(1);
      storyEditorPage.createNewDestinationChapter('Chapter 3');
      storyEditorPage.navigateToChapterByIndex(2);
      storyEditorPage.setChapterExplorationId(dummyExplorationIds[2]);
      storyEditorPage.selectInitialChapterByName('Chapter 2');

      // Now Chapter 2 is the initial chapter and its destination is
      // Chapter 3. Make Chapter 2's destination to be Chapter 1
      storyEditorPage.navigateToChapterByIndex(0);
      storyEditorPage.removeDestination();
      storyEditorPage.selectDestinationChapterByName('Chapter 1');
      storyEditorPage.expectDestinationToBe('Chapter 1');

      // Make chapter 1's destination to be Chapter 3
      storyEditorPage.navigateToChapterByIndex(1);
      storyEditorPage.selectDestinationChapterByName('Chapter 3');
      storyEditorPage.expectDestinationToBe('Chapter 3');
    }
  );

  it('should add one prerequisite and acquired skill to chapter 1', function() {
    storyEditorPage.expectAcquiredSkillDescriptionCardCount(0);
    storyEditorPage.expectPrerequisiteSkillDescriptionCardCount(0);
    storyEditorPage.addAcquiredSkill(dummySkills[0]);
    storyEditorPage.expectAcquiredSkillDescriptionCardCount(1);
    storyEditorPage.addPrerequisiteSkill(dummySkills[1]);
    storyEditorPage.expectPrerequisiteSkillDescriptionCardCount(1);
    storyEditorPage.saveStory('Save');
  });

  it('should fail to add one prerequisite skill which is already added as' +
    ' acquired skill', function() {
    storyEditorPage.addAcquiredSkill(dummySkills[1]);
    storyEditorPage.expectSaveStoryDisabled();
    var warningRegex = new RegExp(
      'The skill with id [a-zA-Z0-9]+ is common to both the acquired and ' +
      'prerequisite skill id ' +
      'list in .*');
    storyEditorPage.expectWarningInIndicator(warningRegex);
  });

  it('should delete prerequisite skill and acquired skill', function() {
    storyEditorPage.deleteAcquiredSkillByIndex(0);
    storyEditorPage.expectAcquiredSkillDescriptionCardCount(0);
    storyEditorPage.deletePrerequisiteSkillByIndex(0);
    storyEditorPage.expectPrerequisiteSkillDescriptionCardCount(0);
  });

  it('should select the "Chapter 2" as initial chapter and get unreachable' +
    ' error', function() {
    storyEditorPage.selectInitialChapterByName('Chapter 2');
    storyEditorPage.expectDisplayUnreachableChapterWarning();
  });

  it('should delete one chapter and save', function() {
    storyEditorPage.expectNumberOfChaptersToBe(2);
    storyEditorPage.deleteChapterWithIndex(1);
    storyEditorPage.expectNumberOfChaptersToBe(1);
    storyEditorPage.saveStory('Last');
  });

  afterEach(function() {
    general.checkForConsoleErrors(allowedErrors);
    while (allowedErrors.length !== 0) {
      allowedErrors.pop();
    }
  });

  afterAll(function() {
    users.logout();
  });
});
