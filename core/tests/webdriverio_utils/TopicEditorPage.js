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

var action = require('../webdriverio_utils/action.js');
var general = require('../webdriverio_utils/general.js');
var waitFor = require('./waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var TopicEditorPage = function() {
  var EDITOR_URL_PREFIX = '/topic_editor/';
  var createStoryButton = $('.e2e-test-create-story-button');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var confirmStoryCreationButton = $('.e2e-test-confirm-story-creation-button');
  var newStoryTitleField = $('.e2e-test-new-story-title-field');
  var storyListTable = $('.e2e-test-story-list-table');
  var newStoryDescriptionField = $('.e2e-test-new-story-description-field');
  var newStoryUrlFragmentField = $('.e2e-test-new-story-url-fragment-field');
  var storyThumbnailButton = $(
    '.e2e-test-thumbnail-editor .e2e-test-photo-button');
  var storyPublicationStatusLocator = '.e2e-test-story-publication-status';

  this.get = async function(topicId) {
    await browser.url(EDITOR_URL_PREFIX + topicId);
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfStoriesToBe = async function(count) {
    if (count) {
      await waitFor.visibilityOf(
        storyListTable, 'Story list table takes too long to appear.');
    }
    expect(await storyListItems.length).toEqual(count);
  };

  this.expectStoryPublicationStatusToBe = async function(status, index) {
    await waitFor.visibilityOf(
      storyListTable, 'Story list table takes too long to appear.');
    var storyListItems = await $$('.e2e-test-story-list-item');
    var text = await action.getText(
      'Story List Text',
      await storyListItems[index].$$(storyPublicationStatusLocator)[0]);
    expect(text).toEqual(status);
  };

  this.createStory = async function(
      storyTitle, storyUrlFragment, storyDescription, imgPath) {
    await general.scrollToTop();
    await action.click('Create Story Button', createStoryButton);

    await action.keys(
      'Create new story title', newStoryTitleField, storyTitle);
    await action.keys(
      'Create new story description', newStoryDescriptionField,
      storyDescription);
    await action.keys(
      'Create new story url fragment', newStoryUrlFragmentField,
      storyUrlFragment);

    await workflow.submitImage(
      storyThumbnailButton, thumbnailContainer, imgPath, false);

    await action.click(
      'Confirm Create Story Button', confirmStoryCreationButton);
    await waitFor.pageToFullyLoad();
  };
};

exports.TopicEditorPage = TopicEditorPage;
