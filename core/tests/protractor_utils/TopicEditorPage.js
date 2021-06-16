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
var action = require('../protractor_utils/action.js');
var forms = require('./forms.js');
var general = require('../protractor_utils/general.js');
var waitFor = require('./waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var TopicEditorPage = function() {
  var EDITOR_URL_PREFIX = '/topic_editor/';
  var createStoryButton = element(
    by.css('.protractor-test-create-story-button'));
  var newStoryTitleField = element(
    by.css('.protractor-test-new-story-title-field'));
  var newStoryUrlFragmentField = element(
    by.css('.protractor-test-new-story-url-fragment-field'));
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
  var addSubtopicButton = element(
    by.css('.protractor-test-add-subtopic-button'));
  var newSubtopicTitlefield = element(
    by.css('.protractor-test-new-subtopic-title-field'));
  var newSubtopicUrlFragmentField = element(
    by.css('.protractor-test-new-subtopic-url-fragment-field'));
  var confirmSubtopicCreationButton = element(by.css(
    '.protractor-test-confirm-subtopic-creation-button'));
  var subtopics = element.all(by.css('.protractor-test-subtopic'));
  var subtopicColumns = element.all(
    by.css('.protractor-test-subtopic-column'));
  var subtopicEditOptions = element.all(by.css(
    '.protractor-test-show-subtopic-options'));
  var deleteSubtopicButton = element(
    by.css('.protractor-test-delete-subtopic-button'));
  var reassignSkillButton = element(
    by.css('.protractor-test-reassign-skill-button'));
  var uncategorizedSkills = element.all(
    by.css('.protractor-test-uncategorized-skill-card'));
  var uncategorizedSkillItems = element.all(
    by.css('.protractor-test-skill-item'));
  var uncategorizedSkillsContainer = element(
    by.css('.protractor-test-uncategorized-skills-container'));
  var subtopicTitleField = element(
    by.css('.protractor-test-subtopic-title-field'));
  var questionsTabButton = element(
    by.css('.protractor-test-questions-tab-button'));
  var createQuestionButton = element(
    by.css('.protractor-test-create-question-button'));
  var saveQuestionButton = element(
    by.css('.protractor-test-save-question-button'));
  var questionItems = element.all(
    by.css('.protractor-test-question-list-item'));
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
  var newStoryDescriptionField = element(
    by.css('.protractor-test-new-story-description-field'));
  var storyThumbnailButton = element(
    by.css('.thumbnail-editor .protractor-test-photo-button'));
  var topicMetaTagContentField = element(
    by.css('.protractor-test-topic-meta-tag-content-field'));
  var topicMetaTagContentLabel = element(
    by.css('.protractor-test-topic-meta-tag-content-label'));
  var topicPageTitleFragmentField = element(
    by.css('.protractor-test-topic-page-title-fragment-field'));
  var topicPageTitleFragmentLabel = element(
    by.css('.protractor-test-topic-page-title-fragment-label'));
  var easyRubricDifficulty = element(
    by.css('.protractor-test-skill-difficulty-easy'));
  var storyTitleClassname = '.protractor-test-story-title';

  var dragAndDrop = async function(fromElement, toElement) {
    await browser.executeScript(dragAndDropScript, fromElement, toElement);
  };
  var saveRearrangedSkillsButton = element(
    by.css('.protractor-save-rearrange-skills'));
  var practiceTabCheckbox = element(
    by.css('.protractor-test-toggle-practice-tab'));

  this.togglePracticeTab = async function() {
    await action.click('Practice tab checkbox', practiceTabCheckbox);
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
    await general.scrollToTop();
    await saveQuestionButton.click();
    await waitFor.invisibilityOf(
      saveQuestionButton, 'Question modal takes too long to disappear');
  };

  this.createQuestionForSkillWithName = async function(skillDescription) {
    await action.click('Select skill dropdown', selectSkillDropdown);
    await waitFor.elementToBeClickable(
      selectSkillDropdown, 'Skill select dropdown takes too long to appear.');
    await selectSkillDropdown.click();
    await element(by.css('option[label="' + skillDescription + '"]')).click();

    await action.click('Create question button', createQuestionButton);
    await action.click('Easy difficulty for skill', easyRubricDifficulty);
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
    await general.scrollToTop();
    var subtopicPageContentButton = element(by.css(
      '.protractor-test-edit-html-content'));
    await waitFor.elementToBeClickable(
      subtopicPageContentButton,
      'Edit subtopic htm content button taking too long to be clickable');
    await subtopicPageContentButton.click();
    var pageEditor = element(by.css(
      '.protractor-test-edit-subtopic-page-contents'));
    await waitFor.visibilityOf(
      pageEditor, 'Subtopic html editor takes too long to appear');
    var pageEditorInput = pageEditor.element(by.css('.oppia-rte'));
    await pageEditorInput.click();
    await pageEditorInput.clear();
    await pageEditorInput.sendKeys(content);
    var saveSubtopicPageContentButton = element(by.css(
      '.protractor-test-save-subtopic-content-button'));
    await waitFor.elementToBeClickable(
      saveSubtopicPageContentButton,
      'Save Subtopic Content button taking too long to be clickable');
    await saveSubtopicPageContentButton.click();
  };

  this.expectNumberOfUncategorizedSkillsToBe = async function(count) {
    expect(await uncategorizedSkillItems.count()).toEqual(count);
  };

  this.deleteSubtopicWithIndex = async function(index) {
    await waitFor.visibilityOf(
      subtopicEditOptions.first(),
      'Subtopic Edit Options taking too long to appear');
    var subtopicEditOptionBox = subtopicEditOptions.get(index);
    await action.click('Subtopic Edit Option Box', subtopicEditOptionBox);
    await waitFor.elementToBeClickable(
      deleteSubtopicButton,
      'Delete subtopic button taking too long to be clickable');
    await deleteSubtopicButton.click();
  };

  this.expectNumberOfSubtopicsToBe = async function(count) {
    expect(await subtopics.count()).toEqual(count);
  };

  this.addSubtopic = async function(title, urlFragment, imgPath, htmlContent) {
    await action.click('Add subtopic button', addSubtopicButton);
    await action.sendKeys(
      'New subtopic title field', newSubtopicTitlefield, title);

    await action.sendKeys(
      'Create new url fragment', newSubtopicUrlFragmentField, urlFragment);

    var subtopicPageContentButton = element(by.css(
      '.protractor-test-show-schema-editor'));
    await action.click(
      'Edit subtopic htm content button', subtopicPageContentButton);
    var subtopicDescriptionEditor = element(by.css(
      '.protractor-test-subtopic-description-editor'));
    var richTextEditor = await forms.RichTextEditor(subtopicDescriptionEditor);
    await richTextEditor.appendPlainText(htmlContent);
    await workflow.submitImage(
      topicThumbnailButton, thumbnailContainer, imgPath, false);

    await action.click(
      'Confirm subtopic creation button', confirmSubtopicCreationButton);
    await waitFor.invisibilityOf(
      element(by.css('.protractor-test-new-subtopic-editor')),
      'Create subtopic modal taking too long to disappear.');
  };

  this.addConceptCardToSubtopicExplanation = async function(skillName) {
    var pageEditorInput = element(by.css('.protractor-test-edit-html-content'));
    await action.click('RTE input', pageEditorInput);
    var conceptCardButton = element(
      by.css('.protractor-test-ck-editor')).element(
      by.cssContainingText('.cke_button', 'Insert Concept Card Link'));
    await action.click('Concept card button', conceptCardButton);
    var skillForConceptCard = element(
      by.cssContainingText(
        '.protractor-test-rte-skill-selector-item', skillName));
    await action.click('Skill for concept card', skillForConceptCard);
    var closeRTEButton = element(
      by.css('.protractor-test-close-rich-text-component-editor'));
    await action.click('Close RTE button', closeRTEButton);
  };

  this.saveSubtopicExplanation = async function() {
    var saveSubtopicExplanationButton = element(by.css(
      '.protractor-test-save-subtopic-content-button'));
    await waitFor.elementToBeClickable(
      saveSubtopicExplanationButton,
      'Save Subtopic Explanation button taking too long to be clickable');
    await action.click(
      'Save subtopic explanation', saveSubtopicExplanationButton);
  };

  this.dragSkillToSubtopic = async function(skillDescription, subtopicIndex) {
    await waitFor.visibilityOf(
      uncategorizedSkills.first(),
      'Uncategorized skills taking too long to appear.');
    const target = subtopicColumns.get(subtopicIndex);
    var uncategorizedSkillIndex = -1;
    for (var i = 0; i < await uncategorizedSkills.count(); i++) {
      if (skillDescription === await uncategorizedSkills.get(i).getText()) {
        uncategorizedSkillIndex = i;
        break;
      }
    }
    expect(uncategorizedSkillIndex).not.toEqual(-1);
    var toMove = await uncategorizedSkills.get(uncategorizedSkillIndex);
    await dragAndDrop(toMove, target);
  };

  this.saveRearrangedSkills = async function() {
    await action.click(
      'Save rearranged skills modal', saveRearrangedSkillsButton);
  };

  this.navigateToReassignModal = async function() {
    await waitFor.elementToBeClickable(
      reassignSkillButton,
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

    for (var i = 0; i < assignedSkillsLength; i++) {
      const skillDescription = await assignedSkillDescriptions.get(i).getText();
      expect(skillDescription).toEqual(skillNames[i]);
    }
  };

  this.dragSkillFromSubtopicToSubtopic = async function(
      fromSubtopicIndex, toSubtopicIndex, skillDescription) {
    const assignedSkillToMove = await this.getTargetMoveSkill(
      fromSubtopicIndex, skillDescription);
    const toSubtopicColumn = subtopicColumns.get(toSubtopicIndex);
    await dragAndDrop(assignedSkillToMove, toSubtopicColumn);
  };

  this.expectUncategorizedSkillsToBe = async function(skillDescriptions) {
    await waitFor.visibilityOf(
      uncategorizedSkills.first(),
      'Uncategorized skills taking too long to appear.');

    for (var i = 0; i < await uncategorizedSkills.count(); i++) {
      expect(skillDescriptions[i]).toEqual(
        await uncategorizedSkills.get(i).getText());
    }
  };

  this.getTargetMoveSkill = async function(
      subtopicIndex, skillDescription) {
    const fromSubtopicColumn = subtopicColumns.get(subtopicIndex);
    const assignedSkills = fromSubtopicColumn.all(
      by.css('.protractor-test-subtopic-skill-description'));
    const assignedSkillsLength = await assignedSkills.count();
    var toMoveSkillIndex = -1;
    for (var i = 0; i < assignedSkillsLength; i++) {
      if (skillDescription === await assignedSkills.get(i).getText()) {
        toMoveSkillIndex = i;
        break;
      }
    }
    expect(toMoveSkillIndex).not.toEqual(-1);

    return assignedSkills.get(toMoveSkillIndex);
  };

  this.dragSkillFromSubtopicToUncategorized = async function(
      subtopicIndex, skillDescription) {
    const assignedSkillToMove = await this.getTargetMoveSkill(
      subtopicIndex, skillDescription);
    await dragAndDrop(assignedSkillToMove, uncategorizedSkillsContainer);
  };

  this.navigateToTopicEditorTab = async function() {
    var topicEditorTab = element(by.css('.protractor-test-edit-topic-tab'));
    await waitFor.elementToBeClickable(
      topicEditorTab, 'Topic editor tab taking too long to be clickable');
    await topicEditorTab.click();
  };

  this.navigateToSubtopicWithIndex = async function(subtopicIndex) {
    var subtopic = await subtopics.get(subtopicIndex);
    await subtopic.click();
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfStoriesToBe = async function(count) {
    if (count) {
      await waitFor.visibilityOf(
        storyListTable, 'Story list table takes too long to appear.');
    }
    expect(await storyListItems.count()).toEqual(count);
  };

  this.expectStoryTitleToBe = async function(title, index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    expect(
      await storyListItems.get(index).all(
        by.css('.protractor-test-story-title')).first().getText()
    ).toEqual(title);
  };

  this.expectStoryPublicationStatusToBe = async function(status, index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
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

  this.navigateToStoryWithTitle = async function(storyName) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyItem = element(
      by.cssContainingText(storyTitleClassname, storyName));
    await action.click('Story Item', storyItem);
    await waitFor.pageToFullyLoad();
    await waitFor.invisibilityOf(
      storyListTable, 'Story list table too long to disappear.');
  };

  this.createStory = async function(
      storyTitle, storyUrlFragment, storyDescription, imgPath) {
    await general.scrollToTop();
    await waitFor.elementToBeClickable(
      createStoryButton,
      'Create Story button takes too long to be clickable');
    await createStoryButton.click();

    await action.sendKeys(
      'Create new story title', newStoryTitleField, storyTitle);
    await action.sendKeys(
      'Create new story description', newStoryDescriptionField,
      storyDescription);
    await action.sendKeys(
      'Create new story url fragment', newStoryUrlFragmentField,
      storyUrlFragment);

    await workflow.submitImage(
      storyThumbnailButton, thumbnailContainer, imgPath, false);

    await waitFor.elementToBeClickable(
      confirmStoryCreationButton,
      'Confirm Create Story button takes too long to be clickable');
    await confirmStoryCreationButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.updatePageTitleFragment = async function(newPageTitleFragment) {
    await action.sendKeys(
      'Update Page Title Fragment',
      topicPageTitleFragmentField, newPageTitleFragment);
    await action.click(
      'Page Title Fragment label', topicPageTitleFragmentLabel);
  };

  this.updateMetaTagContent = async function(newMetaTagContent) {
    await action.sendKeys(
      'Update Meta Tag Content', topicMetaTagContentField, newMetaTagContent);
    await action.click('Meta Tag Content label', topicMetaTagContentLabel);
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
    await general.scrollToTop();
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
    await waitFor.visibilityOf(
      commitMessageField, 'Commit Message field taking too long to appear.');
    await commitMessageField.sendKeys(commitMessage);

    await action.click('Close save modal button', closeSaveModalButton);
    await waitFor.visibilityOfSuccessToast(
      'Success toast for saving topic takes too long to appear.');
  };
};

exports.TopicEditorPage = TopicEditorPage;
