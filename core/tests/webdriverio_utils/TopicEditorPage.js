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
  var commitMessageField = $('.e2e-test-commit-message-input');
  var confirmStoryCreationButton = $('.e2e-test-confirm-story-creation-button');
  var confirmSubtopicCreationButton = $(
    '.e2e-test-confirm-subtopic-creation-button');
  var createStoryButton = $('.e2e-test-create-story-button');
  var newStoryDescriptionField = $('.e2e-test-new-story-description-field');
  var newStoryTitleField = $('.e2e-test-new-story-title-field');
  var newStoryUrlFragmentField = $('.e2e-test-new-story-url-fragment-field');
  var newSubtopicEditorElement = $('.e2e-test-new-subtopic-editor');
  var newSubtopicTitlefield = $('.e2e-test-new-subtopic-title-field');
  var newSubtopicUrlFragmentField = $(
    '.e2e-test-new-subtopic-url-fragment-field');
  var practiceTabCheckbox = $('.e2e-test-toggle-practice-tab');
  var publishTopicButton = $('.e2e-test-publish-topic-button');
  var reassignSkillButton = $('.e2e-test-reassign-skill-button');
  var saveRearrangedSkillsButton = $('.e2e-test-save-rearrange-skills');
  var saveTopicButton = $('.e2e-test-save-topic-button');
  var showSchemaEditorElement = $('.e2e-test-show-schema-editor');
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
  var subtopicSkillDescriptionLocator = '.e2e-test-subtopic-skill-description';
  var subtopicThumbnailButton = $(
    '.e2e-test-subtopic-thumbnail .e2e-test-photo-button');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var topicEditorTab = $('.e2e-test-edit-topic-tab');
  var topicMetaTagContentField = $('.e2e-test-topic-meta-tag-content-field');
  var topicMetaTagContentLabel = $('.e2e-test-topic-meta-tag-content-label');
  var topicPageTitleFragmentField = $(
    '.e2e-test-topic-page-title-fragment-field');
  var topicPageTitleFragmentLabel = $(
    '.e2e-test-topic-page-title-fragment-label');
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
    await browser.url(EDITOR_URL_PREFIX + topicId);
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfStoriesToBe = async function(count) {
    var storyListItems = await storyListItemsSelector();
    if (count) {
      await waitFor.visibilityOf(
        storyListTable, 'Story list table takes too long to appear.');
    }
    expect(storyListItems.length).toEqual(count);
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

  this.publishTopic = async function() {
    await action.click('Publish Topic Button', publishTopicButton);
    await waitFor.invisibilityOf(
      publishTopicButton, 'Topic is taking too long to publish.');
  };

  this.expectStoryPublicationStatusToBe = async function(status, index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyListItems = await storyListItemsSelector();
    var text = await action.getText(
      'Story List Text',
      await storyListItems[index].$$('.e2e-test-story-publication-status')[0]);
    expect(text).toEqual(status);
  };

  this.createStory = async function(
      storyTitle, storyUrlFragment, storyDescription, imgPath) {
    await general.scrollToTop();
    await action.click('Create Story Button', createStoryButton);

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

  this.navigateToTopicEditorTab = async function() {
    await action.click('Topic Editor Tab', topicEditorTab);
  };

  this.navigateToReassignModal = async function() {
    await action.click('Reassign Skill Button', reassignSkillButton);
  };

  this.dragSkillToSubtopic = async function(skillDescription, subtopicIndex) {
    var uncategorizedSkills = await uncategorizedSkillsSelector();
    await waitFor.visibilityOf(
      uncategorizedSkills[0],
      'Uncategorized skills taking too long to appear.');
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

  this.updateMetaTagContent = async function(newMetaTagContent) {
    await action.setValue(
      'Update Meta Tag Content', topicMetaTagContentField, newMetaTagContent);
    await action.click('Meta Tag Content label', topicMetaTagContentLabel);
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

  this.expectUncategorizedSkillsToBe = async function(skillDescriptions) {
    var uncategorizedSkills = await uncategorizedSkillsSelector();
    await waitFor.visibilityOf(
      uncategorizedSkills[0],
      'Uncategorized skills taking too long to appear.');

    for (var i = 0; i < uncategorizedSkills.length; i++) {
      var uncategorizedSkill = uncategorizedSkills[i];
      var text = await action.getText(
        'Uncategorized Skill Text', uncategorizedSkill);
      expect(skillDescriptions[i]).toEqual(text);
    }
  };
};

exports.TopicEditorPage = TopicEditorPage;
