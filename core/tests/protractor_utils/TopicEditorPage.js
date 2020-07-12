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
 * @fileoverview Page object for the topics editor page, for use
 * in Protractor tests.
 */

var dragAndDropScript = require('html-dnd').code;
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');
var workflow = require('../protractor_utils/workflow.js');
var path = require('path');

var TopicEditorPage = function() {
  var EDITOR_URL_PREFIX = '/topic_editor/';
  var createStoryButton = element(
    by.css('.protractor-test-create-story-button'));
  var newStoryTitleField = element(
    by.css('.protractor-test-new-story-title-field'));
  var confirmStoryCreationButton = element(
    by.css('.protractor-test-confirm-story-creation-button'));
  var storyListItems = element.all(
    by.css('.protractor-test-story-list-item'));
  var storyListTable = element(by.css('.protractor-test-story-list-table'));

  var topicNameField = element(
    by.css('.protractor-test-topic-name-field'));
  var topicNameHeading = element(
    by.css('.protractor-test-topic-name-heading'));
  var topicDescriptionField = element(
    by.css('.protractor-test-topic-description-field'));
  var topicDescriptionHeading = element(
    by.css('.protractor-test-topic-description-heading'));
  var saveTopicButton = element(
    by.css('.protractor-test-save-topic-button'));
  var publishTopicButton = element(
    by.css('.protractor-test-publish-topic-button'));
  var commitMessageField = element(
    by.css('.protractor-test-commit-message-input'));
  var closeSaveModalButton = element(
    by.css('.protractor-test-close-save-modal-button'));
  var subtopicsTabButton = element(
    by.css('.protractor-test-subtopics-tab-button'));
  var addSubtopicButton = element(
    by.css('.protractor-test-add-subtopic-button'));
  var newSubtopicTitlefield = element(
    by.css('.protractor-test-new-subtopic-title-field'));
  var confirmSubtopicCreationButton = element(by.css(
    '.protractor-test-confirm-subtopic-creation-button'));
  var subtopics = element.all(by.css('.protractor-test-subtopic'));
  var subtopicColumns = element.all(
    by.css('.protractor-test-subtopic-column'));
  var deleteSubtopicButtons = element.all(
    by.css('.protractor-test-delete-subtopic-button'));
  var skillCards = element.all(
    by.css('.protractor-test-skill-card'));
  var uncategorizedSkills = element.all(
    by.css('.protractor-test-uncategorized-skill-card'));
  var skillSelectorModal = element(
    by.css('.protractor-test-skill-select-modal'));
  var uncategorizedSkillItems = element.all(
    by.css('.protractor-test-skill-item'));
  var uncategorizedSkillsContainer = element(
    by.css('.protractor-test-uncategorized-skills-container'));
  var editSubtopicButtons = element.all(
    by.css('.protractor-test-edit-subtopic-button'));
  var subtopicTitleField = element(
    by.css('.protractor-test-subtopic-title-field'));
  var subtopicTitles = element.all(by.css('.protractor-test-subtopic-title'));
  var questionsTabButton = element(
    by.css('.protractor-test-questions-tab-button'));
  var createQuestionButton = element(
    by.css('.protractor-test-create-question-button'));
  var skillItems = element.all(by.css('.protractor-test-skill-item'));
  var confirmSkillButton = element(
    by.css('.protractor-test-confirm-skill-button'));
  var confirmSkillDifficultyButton = element(
    by.css('.protractor-test-confirm-skill-difficulty-button'));
  var saveQuestionButton = element(
    by.css('.protractor-test-save-question-button'));
  var questionItems = element.all(
    by.css('.protractor-test-question-list-item'));
  var questionItem = element(by.css('.protractor-test-question-list-item'));
  var selectSkillDropdown = element(
    by.css('.protractor-test-select-skill-dropdown'));
  var subtopicThumbnailImageElement = element(
    by.css('.subtopic-thumbnail .protractor-test-custom-photo'));
  var subtopicThumbnailButton = element(
    by.css('.subtopic-thumbnail .protractor-test-photo-button'));
  var topicThumbnailImageElement = element(
    by.css('.thumbnail-editor .protractor-test-custom-photo'));
  var topicThumbnailButton = element(
    by.css('.thumbnail-editor .protractor-test-photo-button'));
  var thumbnailContainer = element(
    by.css('.protractor-test-thumbnail-container'));
  var dragAndDrop = async function(fromElement, toElement) {
    await browser.executeScript(dragAndDropScript, fromElement, toElement);
  };

  this.get = async function(topicId) {
    await browser.get(EDITOR_URL_PREFIX + topicId);
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
    await publishTopicButton.click();
    await waitFor.invisibilityOf(
      publishTopicButton, 'Topic is taking too long to publish.');
  };

  this.expectNumberOfQuestionsForSkillWithDescriptionToBe = async function(
      count, skillDescription) {
    await waitFor.elementToBeClickable(
      selectSkillDropdown, 'Skill select dropdown takes too long to appear.');
    await selectSkillDropdown.click();
    await element(by.css('option[label="' + skillDescription + '"]')).click();
    await waitFor.visibilityOf(
      questionItems.first(), 'Question takes too long to appear');
    expect(await questionItems.count()).toEqual(count);
  };

  this.saveQuestion = async function() {
    await saveQuestionButton.click();
    await waitFor.invisibilityOf(
      saveQuestionButton, 'Question modal takes too long to disappear');
  };

  this.createQuestionForSkillWithIndex = async function(index) {
    await waitFor.elementToBeClickable(
      createQuestionButton,
      'Create Question button takes too long to be clickable');
    await createQuestionButton.click();
    await waitFor.visibilityOf(
      skillSelectorModal,
      'Select skill modal takes too long to appear');
    var skillItem = await skillItems.get(index);
    await skillItem.click();
    await waitFor.elementToBeClickable(
      confirmSkillButton,
      'Confirm Skill button takes too long to be clickable');
    await confirmSkillButton.click();
    await confirmSkillDifficultyButton.click();
    await waitFor.invisibilityOf(
      skillSelectorModal,
      'Select skill modal takes too long to disappear');
  };

  this.moveToQuestionsTab = async function() {
    await waitFor.elementToBeClickable(
      questionsTabButton,
      'Questions tab button takes too long to be clickable');
    await questionsTabButton.click();
  };

  this.expectSubtopicPageContentsToMatch = async function(contents) {
    var subtopicContentText = element(
      by.css('.protractor-test-subtopic-html-content'));
    var text = await subtopicContentText.getText();
    expect(text).toMatch(contents);
  };

  this.expectTitleOfSubtopicWithIndexToMatch = async function(title, index) {
    expect(await subtopics.get(index).getText()).toEqual(title);
  };

  this.changeSubtopicTitle = async function(title) {
    await subtopicTitleField.clear();
    await subtopicTitleField.sendKeys(title);
  };

  this.changeSubtopicPageContents = async function(content) {
    var subtopicPageContentButton = element(by.css(
      '.protractor-test-edit-html-content'));
    await waitFor.elementToBeClickable(subtopicPageContentButton,
      'Edit subtopic htm content button taking too long to be clickable');
    await subtopicPageContentButton.click();
    var pageEditor = element(by.css(
      '.protractor-test-edit-subtopic-page-contents'));
    await waitFor.visibilityOf(pageEditor,
      'Subtopic html editor takes too long to appear');
    var pageEditorInput = pageEditor.element(by.css('.oppia-rte'));
    await pageEditorInput.click();
    await pageEditorInput.clear();
    await pageEditorInput.sendKeys(content);
    var saveSubtopicPageContentButton = element(by.css(
      '.protractor-test-save-subtopic-content-button'));
    await waitFor.elementToBeClickable(saveSubtopicPageContentButton,
      'Save Subtopic Content button taking too long to be clickable');
    await saveSubtopicPageContentButton.click();
  };

  this.expectNumberOfUncategorizedSkillsToBe = async function(count) {
    expect(await uncategorizedSkillItems.count()).toEqual(count);
  };

  this.deleteSubtopicWithIndex = async function(index) {
    await (await deleteSubtopicButtons.get(index)).click();
  };

  this.expectNumberOfSubtopicsToBe = async function(count) {
    expect(await subtopics.count()).toEqual(count);
  };

  this.addSubtopic = async function(title, imgPath, htmlContent) {
    await addSubtopicButton.click();
    await newSubtopicTitlefield.sendKeys(title);

    await workflow.submitImage(
      topicThumbnailButton, thumbnailContainer, imgPath, false);
    var subtopicPageContentButton = element(by.css(
      '.protractor-test-show-schema-editor'));
    await waitFor.elementToBeClickable(subtopicPageContentButton,
      'Edit subtopic htm content button taking too long to be clickable');
    await subtopicPageContentButton.click();
    var pageEditor = element(by.css(
      '.protractor-test-create-subtopic-page-content'));
    await waitFor.visibilityOf(pageEditor,
      'Subtopic html editor takes too long to appear');
    var pageEditorInput = pageEditor.element(by.css('.oppia-rte'));
    await pageEditorInput.click();
    await pageEditorInput.sendKeys(htmlContent);

    await waitFor.elementToBeClickable(
      confirmSubtopicCreationButton,
      'Confirm subtopic creation button takes too long to be clickable');
    await confirmSubtopicCreationButton.click();
    await waitFor.invisibilityOf(
      element(by.css('.protractor-test-new-subtopic-editor')),
      'Create subtopic modal taking too long to disappear.');
  };

  this.dragSkillToSubtopic = async function(skillDescription, subtopicIndex) {
    await waitFor.visibilityOf(await uncategorizedSkills.first(),
      'Uncategorized skills taking too long to appear.');
    const target = (subtopicColumns.get(subtopicIndex));
    var uncategorizedSkillIndex = -1;
    for (var i = 0;i < await uncategorizedSkills.count();i++) {
      if (skillDescription === await uncategorizedSkills.get(i).getText()) {
        uncategorizedSkillIndex = i;
        break;
      }
    }
    expect(uncategorizedSkillIndex).not.toEqual(-1);
    var toMove = await uncategorizedSkills.get(uncategorizedSkillIndex);
    await dragAndDrop(toMove, target);
  };

  this.navigateToReassignModal = async function() {
    var reassignSkillButton = element(
      by.css('.protractor-test-reassign-skill-button'));
    await waitFor.elementToBeClickable(reassignSkillButton,
      'Reassign skill button taking too long to be clickable');
    await reassignSkillButton.click();
  };

  this.expectSubtopicWithIndexToHaveSkills = async function(
      subtopicIndex, skillNames) {
    const assignedSkillDescriptions = (
      subtopicColumns.get(subtopicIndex).all(
        by.css('.protractor-test-subtopic-skill-description')));
    const assignedSkillsLength = await assignedSkillDescriptions.count();

    expect(skillNames.length).toEqual(assignedSkillsLength);

    for (let i = 0;i < assignedSkillsLength;i++) {
      const skillDescription = await assignedSkillDescriptions.get(i).getText();
      expect(skillDescription).toEqual(skillNames[i]);
    }
  };

  this.dragSkillFromSubtopicToSubtopic = async function(
      fromSubtopicIndex, toSubtopicIndex, skillDescription) {
    const fromSubtopicColumn = subtopicColumns.get(fromSubtopicIndex);
    const assignedSkills = fromSubtopicColumn.all(
      by.css('.protractor-test-subtopic-skill-description'));
    const assignedSkillsLength = await assignedSkills.count();
    var toMoveSkillIndex = -1;
    for (var i = 0;i < assignedSkillsLength;i++) {
      if (skillDescription === await assignedSkills.get(i).getText()) {
        toMoveSkillIndex = i;
        break;
      }
    }
    expect(toMoveSkillIndex).not.toEqual(-1);
    const assignedSkillToMove = assignedSkills.get(toMoveSkillIndex);
    const toSubtopicColumn = subtopicColumns.get(toSubtopicIndex);
    await dragAndDrop(assignedSkillToMove, toSubtopicColumn);
  };

  this.expectUncategorizedSkillsToBe = async function(skillDescriptions) {
    var uncategorizedSkills = (
      element.all(by.css('.protractor-test-uncategorized-skill-card')));

    await waitFor.visibilityOf(await uncategorizedSkills.first(),
      'Uncategorized skills taking too long to appear.');

    for (var i = 0;i < await uncategorizedSkills.count();i++) {
      expect(skillDescriptions[i]).toEqual(
        await uncategorizedSkills.get(i).getText());
    }
  };

  this.dragSkillFromSubtopicToUncategorized = async function(
      subtopicIndex, skillDescription) {
    const fromSubtopicColumn = subtopicColumns.get(subtopicIndex);
    const assignedSkills = fromSubtopicColumn.all(
      by.css('.protractor-test-subtopic-skill-description'));
    const assignedSkillsLength = await assignedSkills.count();
    var toMoveSkillIndex = -1;
    for (var i = 0;i < assignedSkillsLength;i++) {
      if (skillDescription === await assignedSkills.get(i).getText()) {
        toMoveSkillIndex = i;
        break;
      }
    }
    expect(toMoveSkillIndex).not.toEqual(-1);
    const assignedSkillToMove = assignedSkills.get(toMoveSkillIndex);
    await dragAndDrop(assignedSkillToMove, uncategorizedSkillsContainer);
  };

  this.navigateToTopicEditorTab = async function() {
    var topicEditorTab = element(by.css('.protractor-test-edit-topic-tab'));
    await waitFor.elementToBeClickable(topicEditorTab,
      'Topic editor tab taking too long to be clickable');
    await topicEditorTab.click();
  };

  this.navigateToSubtopicWithIndex = async function(subtopicIndex) {
    var subtopic = await subtopics.get(subtopicIndex);
    await subtopic.click();
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfStoriesToBe = async function(count) {
    expect(await storyListItems.count()).toEqual(count);
  };

  this.expectStoryTitleToBe = async function(title, index) {
    expect(
      await storyListItems.get(index).all(
        by.css('.protractor-test-story-title')).first().getText()
    ).toEqual(title);
  };

  this.expectStoryPublicationStatusToBe = async function(status, index) {
    expect(
      await storyListItems.get(index).all(
        by.css('.protractor-test-story-publication-status')).first().getText()
    ).toEqual(status);
  };

  this.navigateToStoryWithIndex = async function(index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyItem = await storyListItems.get(index);
    await storyItem.click();
    await waitFor.pageToFullyLoad();
    await waitFor.invisibilityOf(
      storyListTable, 'Story list table too long to disappear.');
  };

  this.createStory = async function(storyTitle) {
    await waitFor.elementToBeClickable(
      createStoryButton,
      'Create Story button takes too long to be clickable');
    await createStoryButton.click();

    await newStoryTitleField.sendKeys(storyTitle);
    await waitFor.elementToBeClickable(
      confirmStoryCreationButton,
      'Confirm Create Story button takes too long to be clickable');
    await confirmStoryCreationButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.changeTopicName = async function(newName) {
    await topicNameField.clear();
    await topicNameField.sendKeys(newName);
    await topicNameHeading.click();
  };

  this.expectTopicNameToBe = async function(name) {
    expect(await topicNameField.getAttribute('value')).toEqual(name);
  };

  this.changeTopicDescription = async function(newDescription) {
    await topicDescriptionField.clear();
    await topicDescriptionField.sendKeys(newDescription);
    await topicDescriptionHeading.click();
  };

  this.expectTopicDescriptionToBe = async function(description) {
    expect(await topicDescriptionField.getAttribute('value')).toEqual(
      description);
  };

  this.saveTopic = async function(commitMessage) {
    await waitFor.elementToBeClickable(
      saveTopicButton,
      'Save topic button takes too long to be clickable');
    await saveTopicButton.click();
    await commitMessageField.sendKeys(commitMessage);

    await waitFor.elementToBeClickable(
      closeSaveModalButton,
      'Close save modal button takes too long to be clickable');
    await closeSaveModalButton.click();
    await waitFor.pageToFullyLoad();
  };
};

exports.TopicEditorPage = TopicEditorPage;
