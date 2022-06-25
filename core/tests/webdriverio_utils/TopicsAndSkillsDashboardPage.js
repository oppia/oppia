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
 * @fileoverview Page object for the topics and skills dashboard page, for use
 * in WebdriverIO tests.
 */

var action = require('../webdriverio_utils/action.js');
var waitFor = require('./waitFor.js');
var workflow = require('./workflow.js');
var general = require('../webdriverio_utils/general.js');

var TopicsAndSkillsDashboardPage = function() {
  var topicsTable = $('.e2e-test-topics-table');
  var createTopicButton = $('.e2e-test-create-topic-button');
  var topicNameField = $('.e2e-test-new-topic-name-field');
  var topicNameFieldElement = $('.e2e-test-topic-name-field');
  var topicUrlFragmentField = $('.e2e-test-new-topic-url-fragment-field');
  var topicDescriptionField = $('.e2e-test-new-topic-description-field');
  var topicPageTitleFragmentField = $('.e2e-test-new-page-title-fragm-field');
  var topicThumbnailButton = $('.e2e-test-photo-button');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var confirmTopicCreationButton = $(
    '.e2e-test-confirm-topic-creation-button');

  this.get = async function() {
    await waitFor.clientSideRedirection(async() => {
      await browser.url('/');
    }, (url) => {
      return /learner-dashboard/.test(url);
    }, async() => {
      await waitFor.pageToFullyLoad();
    });
    await general.navigateToTopicsAndSkillsDashboardPage();
    expect(await browser.getUrl()).toEqual(
      'http://localhost:9001/topics-and-skills-dashboard');
  };

  this.createTopic = async function(
      topicName, topicUrlFragment, description, shouldCloseTopicEditor) {
    var initialHandles = [];
    var handles = await browser.getWindowHandles();
    initialHandles = handles;
    var parentHandle = await browser.getWindowHandle();
    await action.click('Create Topic button', createTopicButton);
    await waitFor.visibilityOf(
      topicNameField,
      'Create Topic modal takes too long to appear.');
    await action.keys('Topic name field', topicNameField, topicName);
    await action.keys(
      'Topic URL fragment field', topicUrlFragmentField, topicUrlFragment);
    await action.keys(
      'Topic description field', topicDescriptionField, description);
    await action.keys(
      'Topic page title fragment field',
      topicPageTitleFragmentField, description);
    await workflow.submitImage(
      topicThumbnailButton, thumbnailContainer,
      ('../data/test_svg.svg'), false);

    await action.click(
      'Confirm Topic creation button', confirmTopicCreationButton);

    await waitFor.newTabToBeCreated(
      'Creating topic takes too long', '/topic_editor/');
    handles = await browser.getWindowHandles();

    var newHandle = null;
    for (var i = 0; i < handles.length; i++) {
      if (initialHandles.indexOf(handles[i]) === -1) {
        newHandle = handles[i];
        break;
      }
    }
    await browser.switchToWindow(newHandle);
    await waitFor.visibilityOf(
      topicNameFieldElement, 'Topic Editor is taking too long to appear.');
    if (shouldCloseTopicEditor) {
      await browser.closewindow();
      await browser.switchToWindow(parentHandle);
      await waitFor.invisibilityOf(
        confirmTopicCreationButton,
        'Create Topic modal takes too long to disappear.');
    }
    return await waitFor.pageToFullyLoad();
  };


  this.expectNumberOfTopicsToBe = async function(number) {
    var topicsListItems = await $$('.e2e-test-topics-list-item');
    let topicsTableIsPresent = await topicsTable.isExisting();
    if (topicsTableIsPresent) {
      expect(await topicsListItems.length).toBe(number);
    }
  };
};

exports.TopicsAndSkillsDashboardPage = TopicsAndSkillsDashboardPage;
