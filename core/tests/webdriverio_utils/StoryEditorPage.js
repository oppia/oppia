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
 * @fileoverview Page object for the story editor page, for use
 * in WebdriverIO tests.
 */

var action = require('../webdriverio_utils/action.js');
var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var StoryEditorPage = function() {
  var EDITOR_URL_PREFIX = '/story_editor/';
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var returnToTopicButton = $('.e2e-test-return-to-topic-button');
  var saveStoryButton = $('.e2e-test-save-story-button');
  var commitMessageField = $('.e2e-test-commit-message-input');
  var closeSaveModalButton = $('.e2e-test-close-save-modal-button');
  var createChapterButton = $('.e2e-test-add-chapter-button');
  var newChapterTitleField = $('.e2e-test-new-chapter-title-field');
  var newChapterExplorationField = $('.e2e-test-chapter-exploration-input');
  var confirmChapterCreationButton = $(
    '.e2e-test-confirm-chapter-creation-button');
  var publishStoryButton = $('.e2e-test-publish-story-button');
  var unpublishStoryButton = $('.e2e-test-unpublish-story-button');
  var backToStoryEditorButton = $('.e2e-test-back-to-story-editor-button');
  var storyMetaTagContentField = $('.e2e-test-story-meta-tag-content-field');
  var storyMetaTagContentLabel = $('.e2e-test-story-meta-tag-content-label');

  /*
   * CHAPTER
   */
  var chapterTitlesSelector = function() {
    return $$('.e2e-test-chapter-title');
  };
  var nodeDescriptionInputField = $('.e2e-test-add-chapter-description');
  var nodeOutlineEditor = $('.e2e-test-add-chapter-outline');
  var nodeOutlineFinalizeCheckbox = $('.e2e-test-finalize-outline');
  var nodeOutlineSaveButton = $('.e2e-test-node-outline-save-button');
  var createChapterThumbnailButton = $(
    '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button');

  this.get = async function(storyId) {
    await browser.url(EDITOR_URL_PREFIX + storyId);
    await waitFor.pageToFullyLoad();
  };

  this.returnToTopic = async function() {
    await general.scrollToTop();
    await action.click('Return to topic button', returnToTopicButton);
    await waitFor.pageToFullyLoad();
  };

  this.updateMetaTagContent = async function(newMetaTagContent) {
    await action.setValue(
      'Update Meta Tag Content', storyMetaTagContentField, newMetaTagContent);
    await action.click('Meta Tag Content label', storyMetaTagContentLabel);
  };

  this.saveStory = async function(commitMessage) {
    await action.click('Save Story Button', saveStoryButton);
    await waitFor.visibilityOf(
      commitMessageField, 'Commit message modal takes too long to appear.');
    await commitMessageField.setValue(commitMessage);

    await action.click('Close Save Modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Commit message modal takes too long to disappear.');
    await waitFor.pageToFullyLoad();
    // Wait for the "Save Draft" button to be reset.
    await waitFor.visibilityOf(
      saveStoryButton, 'Save Story Button taking too long to appear.');
    await waitFor.textToBePresentInElement(
      saveStoryButton, 'Save Draft', 'Story could not be saved.');
  };

  this.publishStory = async function() {
    await action.click('Publish Story Button', publishStoryButton);
  };

  this.unpublishStory = async function() {
    await action.click('Unpublish Story Button', unpublishStoryButton);
    await action.click('Close Save Modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Unpublish message modal takes too long to disappear.');
  };

  this.createNewChapter = async function(title, explorationId, imgPath) {
    await general.scrollToTop();
    await action.click(
      'Create chapter button takes too long to be clickable.',
      createChapterButton);
    await action.setValue(
      'New chapter title field', newChapterTitleField, title);
    await action.setValue(
      'New chapter exploration ID', newChapterExplorationField, explorationId);
    await workflow.submitImage(
      createChapterThumbnailButton, thumbnailContainer, imgPath, false);
    await action.click(
      'Confirm chapter creation button', confirmChapterCreationButton);
    await general.scrollToTop();
  };

  this.navigateToChapterWithName = async function(chapterName) {
    var chapterTitle = $(`.e2e-test-chapter-title=${chapterName}`);
    await waitFor.visibilityOf(
      chapterTitle, 'Chapter name is taking too long to appear');
    var chapterTitles = await chapterTitlesSelector();
    var chapterIndex = -1;
    var chapterText = '';
    for (var i = 0; i < chapterTitles.length; i++) {
      chapterText = await action.getText(
        'Chapter Title Element', chapterTitles[i]);
      if (chapterText === chapterName) {
        chapterIndex = i;
        break;
      }
    }
    expect(chapterIndex).not.toEqual(-1);

    await action.click('Chapter list item', chapterTitles[i]);
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      nodeOutlineEditor, 'Chapter editor is taking too long to appear.');
    await general.scrollToTop();
  };

  this.navigateToStoryEditorTab = async function() {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      backToStoryEditorButton, 'Back to story button is not visible');
    await general.scrollToTop();
    await action.click('Back to story editor tab', backToStoryEditorButton);
  };

  this.expectNumberOfChaptersToBe = async function(count) {
    var chapterTitles = await chapterTitlesSelector();
    expect(await chapterTitles.length).toEqual(count);
  };


  this.changeNodeDescription = async function(nodeDescription) {
    // Function scrollToTop is added to prevent nodeDescriptionInputField from
    // being hidden by the navbar.
    await general.scrollToTop();
    await waitFor.visibilityOf(
      nodeDescriptionInputField,
      'NodeDescriptionInputField takes too long to be visible');
    await nodeDescriptionInputField.clearValue();
    await nodeDescriptionInputField.setValue(nodeDescription);
  };

  this.changeNodeOutline = async function(richTextInstructions) {
    await waitFor.visibilityOf(
      nodeOutlineEditor, 'Node outline editor taking too long to appear.');
    var editor = await forms.RichTextEditor(
      nodeOutlineEditor);
    await editor.clear();
    await richTextInstructions(editor);
    await action.click('Chapter node editor', nodeOutlineEditor);
    await action.click('Node outline save button', nodeOutlineSaveButton);
    await action.click('Finalize outline', nodeOutlineFinalizeCheckbox);
  };
};

exports.StoryEditorPage = StoryEditorPage;
