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
  var createSkillButton = $('.e2e-test-create-skill-button');
  var createSkillButtonSecondary = $('.e2e-test-create-skill-button-circle');
  var skillsTabButton = $('.e2e-test-skills-tab');
  var editTopicButton = $('.e2e-test-edit-topic-button');
  var skillNameField = $('.e2e-test-new-skill-description-field');
  var retLocator = '.e2e-test-rte';
  var noSkillsPresentMessage = $('.e2e-test-no-skills-present-message');
  var openConceptCardExplanationButton = $('.e2e-test-open-concept-card');
  var confirmSkillCreationButton = $('.e2e-test-confirm-skill-creation-button');
  var skillDescriptionField = $('.e2e-test-skill-description-field');
  var editor = $('.e2e-test-concept-card-text');
  var skillsListItems = $$('.e2e-test-skills-list-item');
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
  var skillsTable = $('.e2e-test-skills-table');
  var confirmMoveButton = $('.e2e-test-confirm-move-button');
  var topicFilterKeywordField = $(
    '.e2e-test-select-keyword-dropdown');
  var keywordFieldInput = '.e2e-test-multi-selection-input';

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

  // Only use this if the skills count is not zero. This is supposed to be used
  // for actions being performed on the skills like deleting, assigning etc.
  this.waitForSkillsToLoad = async function() {
    await waitFor.visibilityOf(
      skillsTable, 'Skills table taking too long to appear.');
    await waitFor.invisibilityOf(
      noSkillsPresentMessage, 'Skills list taking too long to appear.');
  };

  // Only use this if the topics count is not zero. This is supposed to be used
  // for actions being performed on the topics like editing, deleting etc.
  this.waitForTopicsToLoad = async function() {
    await waitFor.visibilityOf(
      topicsTable, 'Topics table taking too long to appear');
    var topicsListItems = await $$('.e2e-test-topics-list-item');
    await waitFor.visibilityOf(
      topicsListItems[0], 'Topics list taking too long to appear');
  };

  this.assignSkillToTopic = async function(skillName, topicName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillName);
    var assignSkillToTopicButtons = await $$(
      '.e2e-test-assign-skill-to-topic-button');
    await waitFor.visibilityOf(
      assignSkillToTopicButtons[0],
      'Assign skill to topic buttons taking too long to appear');
    expect(assignSkillToTopicButtons.length).toEqual(1);
    await action.click(
      'Assign skill to topic button', assignSkillToTopicButtons[0]);

    var topic = $(`.e2e-test-topic-name-in-topic-select-modal=${topicName}`);
    await action.click('Topic list item', topic);
    await action.click('Confirm move button', confirmMoveButton);
    await waitFor.invisibilityOf(
      confirmMoveButton,
      'Topic assignment modal taking too long to disappear');
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

  this.navigateToTopicWithIndex = async function(index) {
    await this.waitForTopicsToLoad();
    var topicEditOptions = await $$('.e2e-test-topic-edit-box');
    await action.click(
      'Topic edit option', topicEditOptions[index]);
    await action.click(
      'Edit topic button', editTopicButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToSkillsTab = async function() {
    await action.click('Skills tab button', skillsTabButton);
  };

  this.filterTopicsByKeyword = async function(keyword) {
    await waitFor.visibilityOf(
      topicFilterKeywordField,
      'Topic Dashboard keyword filter parent taking too long to appear.');
    var filterKeywordInput = topicFilterKeywordField.$(
      keywordFieldInput);

    await action.keys(
      'Topic Dashboard keyword filter: ' + keyword,
      filterKeywordInput, keyword + '\n');
  };

  this.expectNumberOfTopicsToBe = async function(number) {
    var topicsListItems = await $$('.e2e-test-topics-list-item');
    let topicsTableIsPresent = await topicsTable.isExisting();
    if (topicsTableIsPresent) {
      expect(topicsListItems.length).toBe(number);
    }
  };

  this.createSkillWithDescriptionAndExplanation = async function(
      description, reviewMaterial, shouldCloseSkillEditor) {
    var initialHandles = [];
    var handles = await browser.getWindowHandles();
    initialHandles = handles;
    var parentHandle = await browser.getWindowHandle();
    try {
      await action.click('Create Skill button', createSkillButton);
    } catch (e) {
      await this.navigateToSkillsTab();
      await action.click('Create Skill button', createSkillButtonSecondary);
    }

    await action.keys('Skill Name Field', skillNameField, description);
    await action.click(
      'Open Concept Card button', openConceptCardExplanationButton);

    await waitFor.visibilityOf(
      editor, 'Explanation Editor takes too long to appear');
    var skillReviewMaterialInput = editor.$(retLocator);
    await action.keys(
      'Skill Review Material Field', skillReviewMaterialInput,
      reviewMaterial, true);

    await action.click('Create Skill button', confirmSkillCreationButton);

    await waitFor.newTabToBeCreated(
      'Creating skill takes too long', '/skill_editor/');
    handles = await browser.getWindowHandles();
    var newHandle = null;
    for (var i = 0; i < handles.length; i++) {
      if (initialHandles.indexOf(handles[i]) === -1) {
        newHandle = handles[i];
        break;
      }
    }
    await browser.switchToWindow(newHandle);
    if (shouldCloseSkillEditor) {
      await browser.closeWindow();
      await browser.switchToWindow(parentHandle);
      await waitFor.invisibilityOf(
        confirmSkillCreationButton,
        'Create skill modal takes too long to be disappear.');
    } else {
      await waitFor.visibilityOf(
        skillDescriptionField, 'Skill Editor is taking too long to appear.');
    }
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfSkillsToBe = async function(number) {
    if (!number) {
      await waitFor.visibilityOf(
        noSkillsPresentMessage,
        'No skills present message taking to long to appear.');
      expect(await noSkillsPresentMessage.isDisplayed()).toBe(true);
      return;
    }
    expect(await skillsListItems.length).toEqual(number);
  };

  this.searchSkillByName = async function(name) {
    return await this.filterTopicsByKeyword(name);
  };
};

exports.TopicsAndSkillsDashboardPage = TopicsAndSkillsDashboardPage;
