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
 * @fileoverview Page object for the topics editor page, for use
 * in WebdriverIO tests.
 */

var dragAndDropScript = require('html-dnd').code;
var action = require('../webdriverio_utils/action.js');
var general = require('../webdriverio_utils/general.js');
var waitFor = require('./waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');
var forms = require('../webdriverio_utils/forms.js');

var TopicEditorPage = function() {
  var EDITOR_URL_PREFIX = '/topic_editor/';
  var addSubtopicButton = $('.e2e-test-add-subtopic-button');
  var closeSaveModalButton = $('.e2e-test-close-save-modal-button');
  var closeRTEButton = $('.e2e-test-close-rich-text-component-editor');
  var commitMessageField = $('.e2e-test-commit-message-input');
  var confirmStoryCreationButton = $('.e2e-test-confirm-story-creation-button');
  var confirmSubtopicCreationButton = $(
    '.e2e-test-confirm-subtopic-creation-button');
  var createQuestionButton = $('.e2e-test-create-question-button');
  var createStoryButton = $('.e2e-test-create-story-button');
  var deleteSubtopicButton = $('.e2e-test-delete-subtopic-button');
  var easyRubricDifficulty = $('.e2e-test-skill-difficulty-easy');
  var newStoryDescriptionField = $('.e2e-test-new-story-description-field');
  var newStoryTitleField = $('.e2e-test-new-story-title-field');
  var newStoryUrlFragmentField = $('.e2e-test-new-story-url-fragment-field');
  var newSubtopicEditorElement = $('.e2e-test-new-subtopic-editor');
  var pageEditor = $('.e2e-test-edit-subtopic-page-contents');
  var questionItem = $('.e2e-test-question-list-item');
  var questionItemsSelector = function() {
    return $$('.e2e-test-question-list-item');
  };
  var questionsTabButton = $('.e2e-test-questions-tab-button');
  var saveQuestionButton = $('.e2e-test-save-question-button');
  var subtopicColumnsSelector = function() {
    return $$('.e2e-test-subtopic-column');
  };
  var subtopicContentText = $('.e2e-test-subtopic-html-content');
  var topicDescriptionField = $('.e2e-test-topic-description-field');
  var topicDescriptionHeading = $('.e2e-test-topic-description-heading');
  var topicEditorTab = $('.e2e-test-edit-topic-tab');
  var topicNameField = $('.e2e-test-topic-name-field');
  var topicNameHeading = $('.e2e-test-topic-name-heading');
  var topicThumbnailImageElement = $(
    '.e2e-test-thumbnail-editor .e2e-test-custom-photo');
  var topicMetaTagContentField = $('.e2e-test-topic-meta-tag-content-field');
  var topicMetaTagContentLabel = $('.e2e-test-topic-meta-tag-content-label');
  var topicThumbnailButton = $(
    '.e2e-test-thumbnail-editor .e2e-test-photo-button');
  var publishTopicButton = $('.e2e-test-publish-topic-button');
  var selectSkillDropdown = $('.e2e-test-select-skill-dropdown');
  var subtopicEditOption = $('.e2e-test-show-subtopic-options');
  var subtopicPageContentButton = $('.e2e-test-edit-html-content');
  var saveSubtopicPageContentButton = $(
    '.e2e-test-save-subtopic-content-button');
  var subtopicSkillDescriptionLocator = '.e2e-test-subtopic-skill-description';
  var confirmSubtopicCreationButton = $(
    '.e2e-test-confirm-subtopic-creation-button');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var storyThumbnailButton = $(
    '.e2e-test-thumbnail-editor .e2e-test-photo-button');
  var addSubtopicButton = $('.e2e-test-add-subtopic-button');
  var newSubtopicTitlefield = $('.e2e-test-new-subtopic-title-field');
  var newSubtopicUrlFragmentField = $(
    '.e2e-test-new-subtopic-url-fragment-field');
  var practiceTabCheckbox = $('.e2e-test-toggle-practice-tab');
  var publishTopicButton = $('.e2e-test-publish-topic-button');
  var reassignSkillButton = $('.e2e-test-reassign-skill-button');
  var saveRearrangedSkillsButton = $('.e2e-test-save-rearrange-skills');
  var saveTopicButton = $('.e2e-test-save-topic-button');
  var showSchemaEditorElement = $('.e2e-test-show-schema-editor');
  var addNewDiagnosticTestSkillButton = $(
    '.e2e-test-add-diagnostic-test-skill');
  var diagnosticTestSkillSelector = $(
    '.e2e-test-diagnostic-test-skill-selector');
  var removeDiagnosticTestButtonElement = $(
    '.e2e-test-remove-skill-from-diagnostic-test');
  var storyListItemsSelector = function() {
    return $$('.e2e-test-story-list-item');
  };
  var storyListTable = $('.e2e-test-story-list-table');
  var storyThumbnailButton = $(
    '.e2e-test-thumbnail-editor .e2e-test-photo-button');
  var subtopicColumnsSelector = function() {
    return $$('.e2e-test-subtopic-column');
  };
  var subtopicDescriptionEditor = $('.e2e-test-subtopic-description-editor');
  var subtopicsSelector = function() {
    return $$('.e2e-test-subtopic');
  };
  var subtopicTitleField = $('.e2e-test-subtopic-title-field');
  var subtopicThumbnailImageElement = $(
    '.e2e-test-subtopic-thumbnail .e2e-test-custom-photo');
  var subtopicThumbnailButton = $(
    '.e2e-test-subtopic-thumbnail .e2e-test-photo-button');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var topicMetaTagContentField = $('.e2e-test-topic-meta-tag-content-field');
  var topicMetaTagContentLabel = $('.e2e-test-topic-meta-tag-content-label');
  var topicPageTitleFragmentField = $(
    '.e2e-test-topic-page-title-fragment-field');
  var topicPageTitleFragmentLabel = $(
    '.e2e-test-topic-page-title-fragment-label');
  var uncategorizedSkillsContainer = $(
    '.e2e-test-uncategorized-skills-container');
  var uncategorizedSkillsContainersSelector = function() {
    return $$('.e2e-test-uncategorized-skills-container');
  };
  var uncategorizedSkillCard = $('.e2e-test-uncategorized-skill-card');
  var uncategorizedSkillsSelector = function() {
    return $$('.e2e-test-uncategorized-skill-card');
  };

  var dragAndDrop = async function(fromElement, toElement) {
    await browser.execute(dragAndDropScript, fromElement, toElement);
  };

  this.togglePracticeTab = async function() {
    await action.click('Practice tab checkbox', practiceTabCheckbox);
  };

  this.get = async function(topicId) {
    await browser.url(EDITOR_URL_PREFIX + topicId + '/');
    await waitFor.pageToFullyLoad();
  };

  this.getTopicThumbnailSource = async function() {
    return await workflow.getImageSource(topicThumbnailImageElement);
  };

  this.getSubtopicThumbnailSource = async function() {
    return await workflow.getImageSource(subtopicThumbnailImageElement);
  };

  this.submitTopicThumbnail = async function(imgPath, resetExistingImage) {
    return await workflow.submitImage(
      topicThumbnailButton, thumbnailContainer, imgPath,
      resetExistingImage);
  };

  this.submitSubtopicThumbnail = async function(imgPath, resetExistingImage) {
    return await workflow.submitImage(
      subtopicThumbnailButton, thumbnailContainer, imgPath, resetExistingImage);
  };

  this.publishTopic = async function() {
    await action.click('Publish Topic Button', publishTopicButton);
    await waitFor.invisibilityOf(
      publishTopicButton, 'Topic is taking too long to publish.');
  };

  this.expectNumberOfQuestionsForSkillWithDescriptionToBe = async function(
      count, skillDescription) {
    await action.click('Select Skill Dropdown', selectSkillDropdown);
    var dropdownOption = await $(`.mat-option-text=${skillDescription}`);
    await action.click(skillDescription, dropdownOption);
    await waitFor.visibilityOf(
      questionItem, 'Question takes too long to appear');
    var questionItems = await questionItemsSelector();
    expect(questionItems.length).toEqual(count);
  };

  this.saveQuestion = async function() {
    await general.scrollToTop();
    await action.click('Save Question Button', saveQuestionButton);
    await waitFor.invisibilityOf(
      saveQuestionButton, 'Question modal takes too long to disappear');
  };

  this.createQuestionForSkillWithName = async function(skillDescription) {
    await action.click('Select Skill Dropdown', selectSkillDropdown);
    var dropdownOption = await $(`.mat-option-text=${skillDescription}`);
    await action.click(skillDescription, dropdownOption);
    await action.click('Create question button', createQuestionButton);
    await action.click('Easy difficulty for skill', easyRubricDifficulty);
  };

  this.moveToQuestionsTab = async function() {
    await action.click('Questions Tab Button', questionsTabButton);
  };

  this.expectSubtopicPageContentsToMatch = async function(contents) {
    var text = await action.getText(
      'Subtopic Content Text', subtopicContentText);
    expect(text).toMatch(contents);
  };

  this.expectTitleOfSubtopicWithIndexToMatch = async function(title, index) {
    var subtopic = await subtopicsSelector()[index];
    var text = await action.getText('Subtopic Text', subtopic);
    expect(text).toEqual(title);
  };

  this.changeSubtopicTitle = async function(title) {
    await action.clear('Subtopic Title field', subtopicTitleField);
    await action.setValue('Subtopic Title field', subtopicTitleField, title);
  };

  this.changeSubtopicPageContents = async function(content) {
    await general.scrollToTop();
    await action.click(
      'Subtopic Page Content Button', subtopicPageContentButton);
    await waitFor.visibilityOf(
      pageEditor, 'Subtopic html editor takes too long to appear');
    var pageEditorInput = pageEditor.$('.e2e-test-rte');
    await action.click('Page Editor Input', pageEditorInput);
    await action.clear('Page Editor Input', pageEditorInput);
    await action.setValue('Page Editor Input', pageEditorInput, content);
    await action.click(
      'Save Subtopic Page Content Button', saveSubtopicPageContentButton);
  };

  this.expectNumberOfUncategorizedSkillsToBe = async function(count) {
    var uncategorizedSkillItems = await $$('.e2e-test-skill-item');
    expect(uncategorizedSkillItems.length).toEqual(count);
  };

  this.deleteSubtopicWithIndex = async function(index) {
    var subtopicEditOptions = await $$('.e2e-test-show-subtopic-options');
    await waitFor.visibilityOf(
      subtopicEditOption,
      'Subtopic Edit Options taking too long to appear');
    var subtopicEditOptionBox = subtopicEditOptions[index];
    await action.click('Subtopic Edit Option Box', subtopicEditOptionBox);
    await action.click('Delete Subtopic Button', deleteSubtopicButton);
  };

  this.expectNumberOfSubtopicsToBe = async function(count) {
    var subtopics = await subtopicsSelector();
    expect(subtopics.length).toEqual(count);
  };

  this.addSubtopic = async function(title, urlFragment, imgPath, htmlContent) {
    await action.click('Add subtopic button', addSubtopicButton);
    await action.setValue(
      'New subtopic title field', newSubtopicTitlefield, title);

    await action.setValue(
      'Create new url fragment', newSubtopicUrlFragmentField, urlFragment);

    await action.click(
      'Show schema editor button', showSchemaEditorElement);
    var richTextEditor = await forms.RichTextEditor(subtopicDescriptionEditor);
    await richTextEditor.appendPlainText(htmlContent);
    await workflow.submitImage(
      subtopicThumbnailButton, thumbnailContainer, imgPath, false);

    await action.click(
      'Confirm subtopic creation button', confirmSubtopicCreationButton);
    await waitFor.invisibilityOf(
      newSubtopicEditorElement,
      'Create subtopic modal taking too long to disappear.');
  };

  this.addConceptCardToSubtopicExplanation = async function(skillName) {
    await action.click('RTE input', subtopicPageContentButton);
    // The cke buttons classes are dynamically alloted so we cannot
    // add class name starting with 'e2e' to them.
    // eslint-disable-next-line oppia/e2e-practices
    var conceptCardButton = $('.cke_button*=Insert Concept Card Link');
    await action.click('Concept card button', conceptCardButton);
    var skillForConceptCard = $(
      `.e2e-test-rte-skill-selector-item=${skillName}`);
    await action.click('Skill for concept card', skillForConceptCard);
    await action.click('Close RTE button', closeRTEButton);
  };

  this.saveSubtopicExplanation = async function() {
    await waitFor.elementToBeClickable(
      saveSubtopicPageContentButton,
      'Save Subtopic content button taking too long to be clickable');
    await action.click(
      'Save subtopic content button', saveSubtopicPageContentButton);
  };

  this.dragSkillToSubtopic = async function(skillDescription, subtopicIndex) {
    await waitFor.visibilityOf(
      uncategorizedSkillCard,
      'Uncategorized skills taking too long to appear.');
    var uncategorizedSkills = await uncategorizedSkillsSelector();
    var subtopicColumns = await subtopicColumnsSelector();
    var target = subtopicColumns[subtopicIndex];
    var uncategorizedSkillIndex = -1;
    for (var i = 0; i < uncategorizedSkills.length; i++) {
      var uncategorizedSkill = uncategorizedSkills[i];
      var text = await action.getText(
        'Ungategorized Skill Text', uncategorizedSkill);
      if (skillDescription === text) {
        uncategorizedSkillIndex = i;
        break;
      }
    }
    expect(uncategorizedSkillIndex).not.toEqual(-1);
    var toMove = uncategorizedSkills[uncategorizedSkillIndex];
    await dragAndDrop(toMove, target);
  };

  this.saveRearrangedSkills = async function() {
    await action.click(
      'Save rearranged skills modal', saveRearrangedSkillsButton);
  };

  this.navigateToReassignModal = async function() {
    await action.click('Reassign Skill Button', reassignSkillButton);
  };

  this.expectSubtopicWithIndexToHaveSkills = async function(
      subtopicIndex, skillNames) {
    var subtopicColumns = await subtopicColumnsSelector();
    var assignedSkillDescriptions = await (
      subtopicColumns[subtopicIndex].$$(
        subtopicSkillDescriptionLocator));
    var assignedSkillsLength = assignedSkillDescriptions.length;

    expect(skillNames.length).toEqual(assignedSkillsLength);

    for (var i = 0; i < assignedSkillsLength; i++) {
      var skillDescription = assignedSkillDescriptions[i];
      var text = await action.getText(
        'Skill Description Text', skillDescription);
      expect(text).toEqual(skillNames[i]);
    }
  };

  this.dragSkillFromSubtopicToSubtopic = async function(
      fromSubtopicIndex, toSubtopicIndex, skillDescription) {
    var assignedSkillToMove = await this.getTargetMoveSkill(
      fromSubtopicIndex, skillDescription);
    var toSubtopicColumn = await subtopicColumnsSelector()[toSubtopicIndex];
    await dragAndDrop(assignedSkillToMove, toSubtopicColumn);
  };

  this.expectUncategorizedSkillsToBe = async function(skillDescriptions) {
    await waitFor.visibilityOf(
      uncategorizedSkillCard,
      'Uncategorized skills taking too long to appear.');
    var uncategorizedSkills = await uncategorizedSkillsSelector();

    for (var i = 0; i < uncategorizedSkills.length; i++) {
      var uncategorizedSkill = uncategorizedSkills[i];
      var text = await action.getText(
        'Uncategorized Skill Text', uncategorizedSkill);
      expect(skillDescriptions[i]).toEqual(text);
    }
  };

  this.addDiagnosticTestSkill = async function(skillId) {
    await action.click(
      'Add new diagnostic test', addNewDiagnosticTestSkillButton);
    await action.select(
      'New skill selector', diagnosticTestSkillSelector, skillId);
    await waitFor.visibilityOf(
      removeDiagnosticTestButtonElement,
      'Diagnostic test skill removal button takes too long to appear.');
  };

  this.getTargetMoveSkill = async function(
      subtopicIndex, skillDescription) {
    var fromSubtopicColumn = await subtopicColumnsSelector()[subtopicIndex];
    var assignedSkills = await fromSubtopicColumn.$$(
      subtopicSkillDescriptionLocator);
    var assignedSkillsLength = assignedSkills.length;
    var toMoveSkillIndex = -1;
    for (var i = 0; i < assignedSkillsLength; i++) {
      var assignedSkill = assignedSkills[i];
      var text = await action.getText('Assigned Skill Text', assignedSkill);
      if (skillDescription === text) {
        toMoveSkillIndex = i;
        break;
      }
    }
    expect(toMoveSkillIndex).not.toEqual(-1);

    return assignedSkills[toMoveSkillIndex];
  };

  this.dragSkillFromSubtopicToUncategorized = async function(
      subtopicIndex, skillDescription) {
    var assignedSkillToMove = await this.getTargetMoveSkill(
      subtopicIndex, skillDescription);
    await waitFor.visibilityOf(
      uncategorizedSkillsContainer,
      'Skills Container takes too long to appear');
    var uncategorizedSkillsContainers = (
      await uncategorizedSkillsContainersSelector()[0]);
    await dragAndDrop(assignedSkillToMove, uncategorizedSkillsContainers);
  };

  this.navigateToTopicEditorTab = async function() {
    await action.click('Topic Editor Tab', topicEditorTab);
  };

  this.navigateToSubtopicWithIndex = async function(subtopicIndex) {
    var subtopic = await subtopicsSelector()[subtopicIndex];
    await action.click('Subtopic', subtopic);
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfStoriesToBe = async function(count) {
    if (count) {
      await waitFor.visibilityOf(
        storyListTable, 'Story list table takes too long to appear.');
    }
    var storyListItems = await storyListItemsSelector();
    expect(storyListItems.length).toEqual(count);
  };

  this.expectStoryTitleToBe = async function(title, index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyListItems = await storyListItemsSelector();
    var storyListText = (
      await storyListItems[index].$$('.e2e-test-story-title')[0]);
    var text = await action.getText(
      'Story List Text',
      storyListText);
    expect(text).toEqual(title);
  };

  this.expectStoryPublicationStatusToBe = async function(status, index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyListItems = await storyListItemsSelector();
    var storyListText = await storyListItems[index].$$(
      '.e2e-test-story-publication-status');
    var text = await action.getText(
      'Story List Text', storyListText[0]);
    expect(text).toEqual(status);
  };

  this.navigateToStoryWithIndex = async function(index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyListItems = await storyListItemsSelector();
    var storyItem = storyListItems[index];
    await action.click('Story Item', storyItem);
    await waitFor.pageToFullyLoad();
    await waitFor.invisibilityOf(
      storyListTable, 'Story list table too long to disappear.');
  };

  this.navigateToStoryWithTitle = async function(storyName) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyItem = $(`.e2e-test-story-title=${storyName}`);
    await action.click('Story Item', storyItem);
    await waitFor.pageToFullyLoad();
    await waitFor.invisibilityOf(
      storyListTable, 'Story list table too long to disappear.');
  };

  this.createStory = async function(
      storyTitle, storyUrlFragment, storyDescription, imgPath) {
    let width = (await browser.getWindowSize()).width;
    if (width < 831) {
      var storiesDropdown = $('.e2e-test-story-dropdown');
      await action.click('Story dropdown', storiesDropdown);
      await action.click('Create Story Button', createStoryButton);
    } else {
      await general.scrollToTop();
      await action.click('Create Story Button', createStoryButton);
    }

    await action.setValue(
      'Create new story title', newStoryTitleField, storyTitle);
    await action.setValue(
      'Create new story description', newStoryDescriptionField,
      storyDescription);
    await action.setValue(
      'Create new story url fragment', newStoryUrlFragmentField,
      storyUrlFragment);

    await workflow.submitImage(
      storyThumbnailButton, thumbnailContainer, imgPath, false);

    await action.click(
      'Confirm Create Story Button', confirmStoryCreationButton);
    await waitFor.pageToFullyLoad();
  };

  this.updatePageTitleFragment = async function(newPageTitleFragment) {
    await action.setValue(
      'Update Page Title Fragment',
      topicPageTitleFragmentField, newPageTitleFragment);
    await action.click(
      'Page Title Fragment label', topicPageTitleFragmentLabel);
  };

  this.updateMetaTagContent = async function(newMetaTagContent) {
    await action.setValue(
      'Update Meta Tag Content', topicMetaTagContentField, newMetaTagContent);
    await action.click('Meta Tag Content label', topicMetaTagContentLabel);
  };

  this.changeTopicName = async function(newName) {
    await action.clear('Topic Name Field', topicNameField);
    await action.setValue('Topic Name Field', topicNameField, newName);
    await action.click('Topic Name Heading', topicNameHeading);
  };

  this.expectTopicNameToBe = async function(name) {
    await waitFor.visibilityOf(
      topicNameField,
      'topicNameField takes too long to be visible'
    );
    let desc = await browser.execute(() => {
      return document.getElementsByClassName(
        'e2e-test-topic-name-field')[0].value;
    });
    await expect(desc).toMatch(name);
  };

  this.changeTopicDescription = async function(newDescription) {
    await general.scrollToTop();
    await action.clear('Topic Description Field', topicDescriptionField);
    await action.setValue(
      'Topic Description Field', topicDescriptionField, newDescription);
    await action.click('Topic Description Heading', topicDescriptionHeading);
  };

  this.expectTopicDescriptionToBe = async function(description) {
    await waitFor.visibilityOf(
      topicDescriptionField,
      'topicDescriptionField takes too long to be visible'
    );
    let desc = await browser.execute(() => {
      return document.getElementsByClassName(
        'e2e-test-topic-description-field')[0].value;
    });
    await expect(desc).toMatch(description);
  };

  this.saveTopic = async function(commitMessage) {
    await action.click('Save Topic Button', saveTopicButton);
    await waitFor.visibilityOf(
      commitMessageField, 'Commit Message field taking too long to appear.');
    await action.setValue(
      'commit message field', commitMessageField, commitMessage);

    await action.click('Close save modal button', closeSaveModalButton);
    await waitFor.visibilityOfSuccessToast(
      'Success toast for saving topic takes too long to appear.');
  };
};

exports.TopicEditorPage = TopicEditorPage;
