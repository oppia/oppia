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
    by.css('.e2e-test-create-story-button'));
  var newStoryTitleField = element(
    by.css('.e2e-test-new-story-title-field'));
  var newStoryUrlFragmentField = element(
    by.css('.e2e-test-new-story-url-fragment-field'));
  var confirmStoryCreationButton = element(
    by.css('.e2e-test-confirm-story-creation-button'));
  var storyListItems = element.all(
    by.css('.e2e-test-story-list-item'));
  var storyListTable = element(by.css('.e2e-test-story-list-table'));

  var topicNameField = element(
    by.css('.e2e-test-topic-name-field'));
  var topicNameHeading = element(
    by.css('.e2e-test-topic-name-heading'));
  var topicDescriptionField = element(
    by.css('.e2e-test-topic-description-field'));
  var topicDescriptionHeading = element(
    by.css('.e2e-test-topic-description-heading'));
  var saveTopicButton = element(
    by.css('.e2e-test-save-topic-button'));
  var publishTopicButton = element(
    by.css('.e2e-test-publish-topic-button'));
  var commitMessageField = element(
    by.css('.e2e-test-commit-message-input'));
  var closeSaveModalButton = element(
    by.css('.e2e-test-close-save-modal-button'));
  var addSubtopicButton = element(
    by.css('.e2e-test-add-subtopic-button'));
  var newSubtopicTitlefield = element(
    by.css('.e2e-test-new-subtopic-title-field'));
  var newSubtopicUrlFragmentField = element(
    by.css('.e2e-test-new-subtopic-url-fragment-field'));
  var confirmSubtopicCreationButton = element(by.css(
    '.e2e-test-confirm-subtopic-creation-button'));
  var subtopics = element.all(by.css('.e2e-test-subtopic'));
  var subtopicColumns = element.all(
    by.css('.e2e-test-subtopic-column'));
  var subtopicEditOptions = element.all(by.css(
    '.e2e-test-show-subtopic-options'));
  var deleteSubtopicButton = element(
    by.css('.e2e-test-delete-subtopic-button'));
  var reassignSkillButton = element(
    by.css('.e2e-test-reassign-skill-button'));
  var uncategorizedSkills = element.all(
    by.css('.e2e-test-uncategorized-skill-card'));
  var uncategorizedSkillItems = element.all(
    by.css('.e2e-test-skill-item'));
  var uncategorizedSkillsContainer = element(
    by.css('.e2e-test-uncategorized-skills-container'));
  var subtopicTitleField = element(
    by.css('.e2e-test-subtopic-title-field'));
  var questionsTabButton = element(
    by.css('.e2e-test-questions-tab-button'));
  var createQuestionButton = element(
    by.css('.e2e-test-create-question-button'));
  var saveQuestionButton = element(
    by.css('.e2e-test-save-question-button'));
  var questionItems = element.all(
    by.css('.e2e-test-question-list-item'));
  var selectSkillDropdown = element(
    by.css('.e2e-test-select-skill-dropdown'));
  var subtopicThumbnailImageElement = element(
    by.css(
      '.e2e-test-subtopic-thumbnail .e2e-test-custom-photo'));
  var subtopicThumbnailButton = element(
    by.css(
      '.e2e-test-subtopic-thumbnail .e2e-test-photo-button'));
  var topicThumbnailImageElement = element(
    by.css('.e2e-test-thumbnail-editor .e2e-test-custom-photo'));
  var topicThumbnailButton = element(
    by.css('.e2e-test-thumbnail-editor .e2e-test-photo-button'));
  var thumbnailContainer = element(
    by.css('.e2e-test-thumbnail-container'));
  var newStoryDescriptionField = element(
    by.css('.e2e-test-new-story-description-field'));
  var storyThumbnailButton = element(
    by.css('.e2e-test-thumbnail-editor .e2e-test-photo-button'));
  var topicMetaTagContentField = element(
    by.css('.e2e-test-topic-meta-tag-content-field'));
  var topicMetaTagContentLabel = element(
    by.css('.e2e-test-topic-meta-tag-content-label'));
  var topicPageTitleFragmentField = element(
    by.css('.e2e-test-topic-page-title-fragment-field'));
  var topicPageTitleFragmentLabel = element(
    by.css('.e2e-test-topic-page-title-fragment-label'));
  var easyRubricDifficulty = element(
    by.css('.e2e-test-skill-difficulty-easy'));
  var storyTitleClassname = '.e2e-test-story-title';
  var addNewDiagnosticTestSkillButton = element(
    by.css('.e2e-test-add-diagnostic-test-skill'));
  var diagnosticTestSkillSelector = element(
    by.css('.e2e-test-diagnostic-test-skill-selector'));
  var removeDiagnosticTestButtonElement = element(
    by.css('.e2e-test-remove-skill-from-diagnostic-test'));

  var dragAndDrop = async function(fromElement, toElement) {
    await browser.executeScript(dragAndDropScript, fromElement, toElement);
  };
  var saveRearrangedSkillsButton = element(
    by.css('.e2e-test-save-rearrange-skills'));
  var practiceTabCheckbox = element(
    by.css('.e2e-test-toggle-practice-tab'));
  var subtopicContentText = element(
    by.css('.e2e-test-subtopic-html-content'));
  var subtopicPageContentButton = element(
    by.css('.e2e-test-edit-html-content'));
  var pageEditor = element(
    by.css('.e2e-test-edit-subtopic-page-contents'));
  var pageEditorInput = pageEditor.element(by.css('.e2e-test-rte'));
  var saveSubtopicPageContentButton = element(
    by.css('.e2e-test-save-subtopic-content-button'));
  var showSchemaEditorElement = element(
    by.css('.e2e-test-show-schema-editor'));
  var subtopicDescriptionEditor = element(
    by.css('.e2e-test-subtopic-description-editor'));
  var newSubtopicEditorElement = element(
    by.css('.e2e-test-new-subtopic-editor'));
  var cKEditorElement = element(by.css('.e2e-test-ck-editor'));
  var closeRTEButton = element(
    by.css('.e2e-test-close-rich-text-component-editor'));
  var subtopicSkillDescriptionLocator = by.css(
    '.e2e-test-subtopic-skill-description');
  var topicEditorTab = element(by.css('.e2e-test-edit-topic-tab'));
  var storyTitleLocator = by.css('.e2e-test-story-title');
  var storyPublicationStatusLocator = by.css(
    '.e2e-test-story-publication-status');

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
    await action.click('Publish Topic Button', publishTopicButton);
    await waitFor.invisibilityOf(
      publishTopicButton, 'Topic is taking too long to publish.');
  };

  this.expectNumberOfQuestionsForSkillWithDescriptionToBe = async function(
      count, skillDescription) {
    await action.click('Select Skill Dropdown', selectSkillDropdown);
    var skillDescriptionButton = element(
      by.css('option[label="' + skillDescription + '"]'));
    await action.click('Skill Description Button', skillDescriptionButton);
    await waitFor.visibilityOf(
      questionItems.first(), 'Question takes too long to appear');
    expect(await questionItems.count()).toEqual(count);
  };

  this.saveQuestion = async function() {
    await general.scrollToTop();
    await action.click('Save Question Button', saveQuestionButton);
    await waitFor.invisibilityOf(
      saveQuestionButton, 'Question modal takes too long to disappear');
  };

  this.createQuestionForSkillWithName = async function(skillDescription) {
    await action.click('Select skill dropdown', selectSkillDropdown);
    var skillDescriptionButton = element(
      by.css('option[label="' + skillDescription + '"]'));
    await action.click('Skill Description Button', skillDescriptionButton);
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
    var subtopic = subtopics.get(index);
    var text = await action.getText('Subtopic Text', subtopic);
    expect(text).toEqual(title);
  };

  this.changeSubtopicTitle = async function(title) {
    await waitFor.visibilityOf(
      subtopicTitleField, 'Subtopic title field if not visible');
    await subtopicTitleField.clear();
    await subtopicTitleField.sendKeys(title);
  };

  this.changeSubtopicPageContents = async function(content) {
    await general.scrollToTop();
    await action.click(
      'Subtopic Page Content Button', subtopicPageContentButton);
    await waitFor.visibilityOf(
      pageEditor, 'Subtopic html editor takes too long to appear');
    await action.click('Page Editor Input', pageEditorInput);
    await action.clear('Page Editor Input', pageEditorInput);
    await action.sendKeys('Page Editor Input', pageEditorInput, content);
    await action.click(
      'Save Subtopic Page Content Button', saveSubtopicPageContentButton);
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
    await action.click('Delete Subtopic Button', deleteSubtopicButton);
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
    var conceptCardButton = cKEditorElement.element(
      by.cssContainingText('.cke_button', 'Insert Concept Card Link'));
    await action.click('Concept card button', conceptCardButton);
    var skillForConceptCard = element(
      by.cssContainingText(
        '.e2e-test-rte-skill-selector-item', skillName));
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
      uncategorizedSkills.first(),
      'Uncategorized skills taking too long to appear.');
    var target = subtopicColumns.get(subtopicIndex);
    var uncategorizedSkillIndex = -1;
    for (var i = 0; i < await uncategorizedSkills.count(); i++) {
      var uncategorizedSkill = uncategorizedSkills.get(i);
      var text = await action.getText(
        'Ungategorized Skill Text', uncategorizedSkill);
      if (skillDescription === text) {
        uncategorizedSkillIndex = i;
        break;
      }
    }
    expect(uncategorizedSkillIndex).not.toEqual(-1);
    var toMove = uncategorizedSkills.get(uncategorizedSkillIndex);
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
    var assignedSkillDescriptions = (
      subtopicColumns.get(subtopicIndex).all(
        subtopicSkillDescriptionLocator));
    var assignedSkillsLength = await assignedSkillDescriptions.count();

    expect(skillNames.length).toEqual(assignedSkillsLength);

    for (var i = 0; i < assignedSkillsLength; i++) {
      var skillDescription = assignedSkillDescriptions.get(i);
      var text = await action.getText(
        'Skill Description Text', skillDescription);
      expect(text).toEqual(skillNames[i]);
    }
  };

  this.dragSkillFromSubtopicToSubtopic = async function(
      fromSubtopicIndex, toSubtopicIndex, skillDescription) {
    var assignedSkillToMove = await this.getTargetMoveSkill(
      fromSubtopicIndex, skillDescription);
    var toSubtopicColumn = subtopicColumns.get(toSubtopicIndex);
    await dragAndDrop(assignedSkillToMove, toSubtopicColumn);
  };

  this.expectUncategorizedSkillsToBe = async function(skillDescriptions) {
    await waitFor.visibilityOf(
      uncategorizedSkills.first(),
      'Uncategorized skills taking too long to appear.');

    for (var i = 0; i < await uncategorizedSkills.count(); i++) {
      var uncategorizedSkill = uncategorizedSkills.get(i);
      var text = await action.getText(
        'Uncategorized Skill Text', uncategorizedSkill);
      expect(skillDescriptions[i]).toEqual(text);
    }
  };

  this.getTargetMoveSkill = async function(
      subtopicIndex, skillDescription) {
    var fromSubtopicColumn = subtopicColumns.get(subtopicIndex);
    var assignedSkills = fromSubtopicColumn.all(
      subtopicSkillDescriptionLocator);
    var assignedSkillsLength = await assignedSkills.count();
    var toMoveSkillIndex = -1;
    for (var i = 0; i < assignedSkillsLength; i++) {
      var assignedSkill = assignedSkills.get(i);
      var text = await action.getText('Assigned Skill Text', assignedSkill);
      if (skillDescription === text) {
        toMoveSkillIndex = i;
        break;
      }
    }
    expect(toMoveSkillIndex).not.toEqual(-1);

    return assignedSkills.get(toMoveSkillIndex);
  };

  this.dragSkillFromSubtopicToUncategorized = async function(
      subtopicIndex, skillDescription) {
    var assignedSkillToMove = await this.getTargetMoveSkill(
      subtopicIndex, skillDescription);
    await dragAndDrop(assignedSkillToMove, uncategorizedSkillsContainer);
  };

  this.navigateToTopicEditorTab = async function() {
    await action.click('Topic Editor Tab', topicEditorTab);
  };

  this.navigateToSubtopicWithIndex = async function(subtopicIndex) {
    var subtopic = subtopics.get(subtopicIndex);
    await action.click('Subtopic', subtopic);
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
    var text = await action.getText(
      'Story List Text',
      storyListItems.get(index).all(storyTitleLocator).first());
    expect(text).toEqual(title);
  };

  this.expectStoryPublicationStatusToBe = async function(status, index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var text = await action.getText(
      'Story List Text',
      storyListItems.get(index).all(storyPublicationStatusLocator).first());
    expect(text).toEqual(status);
  };

  this.navigateToStoryWithIndex = async function(index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyItem = storyListItems.get(index);
    await action.click('Story Item', storyItem);
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
    await action.click('Create Story Button', createStoryButton);

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

    await action.click(
      'Confirm Create Story Button', confirmStoryCreationButton);
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
    await action.clear('Topic Name Field', topicNameField);
    await action.sendKeys('Topic Name Field', topicNameField, newName);
    await action.click('Topic Name Heading', topicNameHeading);
  };

  this.expectTopicNameToBe = async function(name) {
    await waitFor.visibilityOf(
      topicNameField,
      'topicNameField takes too long to be visible'
    );
    let desc = await browser.executeScript(() => {
      return document.getElementsByClassName(
        'e2e-test-topic-name-field')[0].value;
    });
    await expect(desc).toMatch(name);
  };

  this.changeTopicDescription = async function(newDescription) {
    await general.scrollToTop();
    await action.clear('Topic Description Field', topicDescriptionField);
    await action.sendKeys(
      'Topic Description Field', topicDescriptionField, newDescription);
    await action.sendKeys(
      'Topic Description Field', topicDescriptionField, newDescription);
    await action.click('Topic Description Heading', topicDescriptionHeading);
  };

  this.expectTopicDescriptionToBe = async function(description) {
    await waitFor.visibilityOf(
      topicDescriptionField,
      'topicDescriptionField takes too long to be visible'
    );
    let desc = await browser.executeScript(() => {
      return document.getElementsByClassName(
        'e2e-test-topic-description-field')[0].value;
    });
    await expect(desc).toMatch(description);
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

  this.saveTopic = async function(commitMessage) {
    await action.click('Save Topic Button', saveTopicButton);
    await waitFor.visibilityOf(
      commitMessageField, 'Commit Message field taking too long to appear.');
    await action.sendKeys(
      'commit message field', commitMessageField, commitMessage);

    await action.click('Close save modal button', closeSaveModalButton);
    await waitFor.visibilityOfSuccessToast(
      'Success toast for saving topic takes too long to appear.');
  };
};

exports.TopicEditorPage = TopicEditorPage;
