// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * in Protractor tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var StoryEditorPage = function() {
  var EDITOR_URL_PREFIX = '/story_editor/';
  var storyTitleField = element(by.css('.protractor-test-story-title-field'));
  var storyDescriptionField = element(
    by.css('.protractor-test-story-description-field'));
  var storyNotes = element(by.css('.protractor-test-story-notes'));
  var notesEditor = element(by.css('.protractor-test-story-notes-rte'));
  var openStoryNotesEditorButton = element(
    by.css('.protractor-test-open-story-notes-editor-button'));
  var saveStoryNotesEditorButton = element(
    by.css('.protractor-test-save-story-notes-button'));
  var returnToTopicButton = element(
    by.css('.protractor-test-return-to-topic-button'));
  var saveStoryButton = element(
    by.css('.protractor-test-save-story-button'));
  var commitMessageField = element(
    by.css('.protractor-test-commit-message-input'));
  var closeSaveModalButton = element(
    by.css('.protractor-test-close-save-modal-button'));
  var createInitialChapterButton = element(
    by.css('.protractor-test-create-chapter-button'));
  var newChapterTitleField = element(
    by.css('.protractor-test-new-chapter-title-field'));
  var confirmChapterCreationButton = element(
    by.css('.protractor-test-confirm-chapter-creation-button'));
  var addDestinationChapterButton = element(
    by.css('.protractor-test-add-destination-chapter-button'));
  var chapterTitles = element.all(by.css('.protractor-test-chapter-title'));
  var deleteChapterButtons = element.all(
    by.css('.protractor-test-delete-chapter-button'));
  var confirmDeleteChapterButton = element(
    by.css('.protractor-test-confirm-delete-chapter-button'));

  this.deleteChapterWithIndex = function(index) {
    deleteChapterButtons.then(function(elems) {
      elems[index].click();
    });
    confirmDeleteChapterButton.click();
  };

  this.createNewDestinationChapter = function(title) {
    browser.actions().mouseMove(addDestinationChapterButton).perform();
    addDestinationChapterButton.click();
    newChapterTitleField.sendKeys(title);
    confirmChapterCreationButton.click();
    general.scrollToTop();
  };

  this.expectNumberOfChaptersToBe = function(count) {
    chapterTitles.then(function(items) {
      expect(items.length).toEqual(count);
    });
  };

  this.createInitialChapter = function(title) {
    createInitialChapterButton.click();
    newChapterTitleField.sendKeys(title);
    confirmChapterCreationButton.click();
  };

  this.expectNotesToBe = function(richTextInstructions) {
    forms.expectRichText(storyNotes).toMatch(richTextInstructions);
  };

  this.expectTitleToBe = function(title) {
    expect(storyTitleField.getAttribute('value')).toEqual(title);
  };

  this.expectDescriptionToBe = function(description) {
    expect(storyDescriptionField.getAttribute('value')).toEqual(description);
  };

  this.changeStoryTitle = function(storyTitle) {
    storyTitleField.clear();
    storyTitleField.sendKeys(storyTitle);
  };

  this.returnToTopic = function() {
    returnToTopicButton.click();
    waitFor.pageToFullyLoad();
  };

  this.changeStoryDescription = function(storyDescription) {
    storyDescriptionField.clear();
    storyDescriptionField.sendKeys(storyDescription);
  };

  this.changeStoryNotes = function(richTextInstructions) {
    openStoryNotesEditorButton.click();
    var storyNotesEditor = forms.RichTextEditor(
      notesEditor);
    storyNotesEditor.clear();
    richTextInstructions(storyNotesEditor);
    saveStoryNotesEditorButton.click();
  };

  this.saveStory = function(commitMessage) {
    saveStoryButton.click();
    commitMessageField.sendKeys(commitMessage);

    waitFor.elementToBeClickable(
      closeSaveModalButton,
      'Close save modal button takes too long to be clickable');
    closeSaveModalButton.click();
    waitFor.pageToFullyLoad();
  };
};

exports.StoryEditorPage = StoryEditorPage;
