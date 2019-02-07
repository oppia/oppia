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

var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

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

  var topicNameField = element(
    by.css('.protractor-test-topic-name-field'));
  var topicDescriptionField = element(
    by.css('.protractor-test-topic-description-field'));
  var saveTopicButton = element(
    by.css('.protractor-test-save-topic-button'));
  var publishTopicButton = element(
    by.css('.protractor-test-publish-topic-button'));
  var commitMessageField = element(
    by.css('.protractor-test-commit-message-input'));
  var closeSaveModalButton = element(
    by.css('.protractor-test-close-save-modal-button'));

  this.get = function(topicId) {
    browser.get(EDITOR_URL_PREFIX + topicId);
    return waitFor.pageToFullyLoad();
  };

  this.expectNumberOfStoriesToBe = function(count) {
    storyListItems.then(function(elems) {
      expect(elems.length).toEqual(count);
    });
  };

  this.createStory = function(storyTitle) {
    waitFor.elementToBeClickable(
      createStoryButton,
      'Create Story button takes too long to be clickable');
    createStoryButton.click();

    newStoryTitleField.sendKeys(storyTitle);
    waitFor.elementToBeClickable(
      confirmStoryCreationButton,
      'Confirm Create Story button takes too long to be clickable');
    confirmStoryCreationButton.click();
    waitFor.pageToFullyLoad();
  };

  this.changeTopicName = function(newName) {
    topicNameField.clear();
    topicNameField.sendKeys(newName);
  };

  this.expectTopicNameToBe = function(name) {
    expect(topicNameField.getAttribute('value')).toEqual(name);
  };

  this.changeTopicDescription = function(newDescription) {
    topicDescriptionField.clear();
    topicDescriptionField.sendKeys(newDescription);
  };

  this.expectTopicDescriptionToBe = function(description) {
    expect(topicDescriptionField.getAttribute('value')).toEqual(description);
  };

  this.saveTopic = function(commitMessage) {
    saveTopicButton.click();
    commitMessageField.sendKeys(commitMessage);

    waitFor.elementToBeClickable(
      closeSaveModalButton,
      'Close save modal button takes too long to be clickable');
    closeSaveModalButton.click();
    waitFor.pageToFullyLoad();
  };
};

exports.TopicEditorPage = TopicEditorPage;
