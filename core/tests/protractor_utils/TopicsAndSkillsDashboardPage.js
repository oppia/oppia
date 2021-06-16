// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * in Protractor tests.
 */

var action = require('../protractor_utils/action.js');
var waitFor = require('./waitFor.js');
var workflow = require('./workflow.js');
var general = require('../protractor_utils/general.js');

var TopicsAndSkillsDashboardPage = function() {
  var topicNames = element.all(by.css('.protractor-test-topic-name'));
  var skillDescriptions = element.all(
    by.css('.protractor-test-skill-description'));
  var createTopicButton = element(
    by.css('.protractor-test-create-topic-button'));
  var createSkillButton = element(
    by.css('.protractor-test-create-skill-button'));
  var createSkillButtonSecondary = element(
    by.css('.protractor-test-create-skill-button-circle'));
  var deleteSkillButton = element(
    by.css('.protractor-test-delete-skill-button'));
  var topicsTable = element(by.css('.protractor-test-topics-table'));
  var skillsTable = element(by.css('.protractor-test-skills-table'));
  var topicsListItems = element.all(
    by.css('.protractor-test-topics-list-item'));
  var topicNamesClass = '.protractor-test-topic-name-in-topic-select-modal';
  var skillsListItems = element.all(
    by.css('.protractor-test-skills-list-item'));
  var skillListItemsClass = '.protractor-test-skills-list-item';
  var topicNameField = element(by.css(
    '.protractor-test-new-topic-name-field'));
  var topicUrlFragmentField = element(by.css(
    '.protractor-test-new-topic-url-fragment-field'));
  var topicDescriptionField = element(by.css(
    '.protractor-test-new-topic-description-field'));
  var topicFilterKeywordField = element(by.css(
    '.protractor-test-select-keyword-dropdown'));
  var topicFilterClassroomField = element(by.css(
    '.protractor-test-select-classroom-dropdown'));
  var topicEditOptions = element.all(
    by.css('.protractor-test-topic-edit-box'));
  var skillEditOptions = element.all(
    by.css('.protractor-test-skill-edit-box'));
  var topicResetFilters = element(by.css(
    '.protractor-test-topic-filter-reset'));
  var deleteTopicButton = element(
    by.css('.protractor-test-delete-topic-button'));
  var editTopicButton = element(
    by.css('.protractor-test-edit-topic-button'));
  var unassignSkillButon = element(
    by.css('.protractor-test-unassign-skill-button'));
  var skillNameField = element(
    by.css('.protractor-test-new-skill-description-field')
  );
  var confirmTopicCreationButton = element(
    by.css('.protractor-test-confirm-topic-creation-button')
  );
  var confirmTopicDeletionButton = element(
    by.css('.protractor-test-confirm-topic-deletion-button')
  );
  var confirmSkillCreationButton = element(
    by.css('.protractor-test-confirm-skill-creation-button')
  );
  var confirmSkillDeletionButton = element(
    by.css('.protractor-test-confirm-skill-deletion-button')
  );
  var skillsTabButton = element(
    by.css('.protractor-test-skills-tab')
  );
  var assignSkillToTopicButtons = element.all(
    by.css('.protractor-test-assign-skill-to-topic-button'));
  var confirmMoveButton = element(
    by.css('.protractor-test-confirm-move-button'));
  var mergeSkillsButton = element(
    by.css('.protractor-test-merge-skills-button'));
  var confirmSkillsMergeButton = element(
    by.css('.protractor-test-confirm-skill-selection-button'));
  var openConceptCardExplanationButton = element(
    by.css('.protractor-test-open-concept-card'));
  var topicThumbnailButton = element(
    by.css('.protractor-test-photo-button'));
  var thumbnailContainer = element(
    by.css('.protractor-test-thumbnail-container'));
  var skillStatusFilterDropdown = element(
    by.css('.protractor-test-select-skill-status-dropdown'));
  var confirmUnassignSkillButton =
    element(by.css('.protractor-test-confirm-unassign-skill-button'));
  var noSkillsPresentMessage = element(
    by.css('.protractor-test-no-skills-present-message'));
  var assignedTopicNamesInput = element.all(
    by.css('.protractor-test-unassign-topic'));
  var assignedTopicNameInputClass = by.css('.protractor-test-unassign-topic');

  this.get = async function() {
    await browser.get('/');
    await waitFor.pageToFullyLoad();
    await general.navigateToTopicsAndSkillsDashboardPage();
    expect(await browser.getCurrentUrl()).toEqual(
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
    await waitFor.visibilityOf(
      topicsListItems.first(), 'Topics list taking too long to appear');
  };

  this.isTopicTablePresent = async function() {
    return await topicsTable.isPresent();
  };

  this.mergeSkills = async function(oldSkillName, newSkillName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(oldSkillName);
    expect(await skillEditOptions.count()).toEqual(1);
    await action.click(
      'Skill edit options', skillEditOptions.first());
    await action.click(
      'Merge skill button', mergeSkillsButton);

    var skill = element(
      by.cssContainingText(skillListItemsClass, newSkillName));
    await action.click('Skill radio button', skill);
    await action.click(
      'Confirm Skills Merge button', confirmSkillsMergeButton);
    await waitFor.invisibilityOf(
      confirmSkillsMergeButton,
      'Confirm Skill Modal takes too long to close.');
  };

  this.navigateToTopicWithIndex = async function(index) {
    await this.waitForTopicsToLoad();
    await action.click(
      'Topic edit option', topicEditOptions.get(index));
    await action.click(
      'Edit topic button', editTopicButton);
    await waitFor.pageToFullyLoad();
  };

  this.assignSkillToTopic = async function(skillName, topicName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillName);
    await waitFor.visibilityOf(
      assignSkillToTopicButtons.first(),
      'Assign skill to topic buttons taking too long to appear');
    expect(await assignSkillToTopicButtons.count()).toEqual(1);
    await action.click(
      'Assign skill to topic button', assignSkillToTopicButtons.first());

    var topic = element(by.cssContainingText(topicNamesClass, topicName));
    await waitFor.elementToBeClickable(
      topic, 'Topic list item taking too long to be clickable');
    await action.click('Topic list item', topic);
    await action.click('Confirm move button', confirmMoveButton);
    await waitFor.invisibilityOf(
      confirmMoveButton,
      'Topic assignment modal taking too long to disappear');
  };

  this.createTopic = async function(
      topicName, topicUrlFragment, description, shouldCloseTopicEditor) {
    var initialHandles = [];
    var handles = await browser.getAllWindowHandles();
    initialHandles = handles;
    var parentHandle = await browser.getWindowHandle();
    await action.click('Create Topic button', createTopicButton);
    await waitFor.visibilityOf(
      topicNameField,
      'Create Topic modal takes too long to appear.');
    await action.sendKeys('Topic name field', topicNameField, topicName);
    await action.sendKeys(
      'Topic URL fragment field', topicUrlFragmentField, topicUrlFragment);
    await action.sendKeys(
      'Topic description field', topicDescriptionField, description);
    await workflow.submitImage(
      topicThumbnailButton, thumbnailContainer,
      ('../data/test_svg.svg'), false);

    await action.click(
      'Confirm Topic creation button', confirmTopicCreationButton);

    await waitFor.newTabToBeCreated(
      'Creating topic takes too long', '/topic_editor/');
    handles = await browser.getAllWindowHandles();

    var newHandle = null;
    for (var i = 0; i < handles.length; i++) {
      if (initialHandles.indexOf(handles[i]) === -1) {
        newHandle = handles[i];
        break;
      }
    }
    await browser.switchTo().window(newHandle);
    await waitFor.visibilityOf(
      element(by.css('.protractor-test-topic-name-field')),
      'Topic Editor is taking too long to appear.');
    if (shouldCloseTopicEditor) {
      await browser.driver.close();
      await browser.switchTo().window(parentHandle);
      await waitFor.invisibilityOf(
        confirmTopicCreationButton,
        'Create Topic modal takes too long to disappear.');
    }
    return await waitFor.pageToFullyLoad();
  };

  this.filterSkillsByStatus = async function(status) {
    await action.click(
      'Skill Dashboard status filter', skillStatusFilterDropdown);
    await (
      await browser.driver.switchTo().activeElement()
    ).sendKeys(status + '\n');
  };

  this.filterTopicsByKeyword = async function(keyword) {
    await waitFor.visibilityOf(
      topicFilterKeywordField,
      'Topic Dashboard keyword filter parent taking too long to appear.');
    var filterKeywordInput = topicFilterKeywordField.element(
      by.css('.select2-search__field'));

    await action.sendKeys(
      'Topic Dashboard keyword filter', filterKeywordInput, keyword + '\n');
  };

  this.filterTopicsByClassroom = async function(keyword) {
    await waitFor.visibilityOf(
      topicFilterClassroomField,
      'Topic Dashboard classroom filter taking too long to appear.');

    await action.click(
      'Topic Dashboard classroom filter', topicFilterClassroomField);
    await (
      await browser.driver.switchTo().activeElement()
    ).sendKeys(keyword + '\n');
  };

  this.resetTopicFilters = async function() {
    await action.click('Reset button', topicResetFilters);
  };

  this.deleteTopicWithName = async function(topicName) {
    await this.waitForTopicsToLoad();
    await this.filterTopicsByKeyword(topicName);
    expect(await topicEditOptions.count()).toEqual(1);
    await action.click(
      'Topic edit option', topicEditOptions.first());
    await action.click('Delete topic button', deleteTopicButton);
    await action.click(
      'Confirm Delete Topic button', confirmTopicDeletionButton);
    await this.get();
  };

  this.deleteSkillWithName = async function(skillName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillName);
    expect(await skillEditOptions.count()).toEqual(1);
    await action.click(
      'Skill edit option', skillEditOptions.first());
    await action.click(
      'Delete skill button', deleteSkillButton);
    await action.click(
      'Confirm delete skill button', confirmSkillDeletionButton);
    await waitFor.pageToFullyLoad();
  };

  this.createSkillWithDescriptionAndExplanation = async function(
      description, reviewMaterial, shouldCloseSkillEditor) {
    var initialHandles = [];
    var handles = await browser.getAllWindowHandles();
    initialHandles = handles;
    var parentHandle = await browser.getWindowHandle();
    try {
      await action.click('Create Skill button', createSkillButton);
    } catch (e) {
      await this.navigateToSkillsTab();
      await action.click('Create Skill button', createSkillButtonSecondary);
    }

    await action.sendKeys('Skill Name Field', skillNameField, description);
    await action.click(
      'Open Concept Card button', openConceptCardExplanationButton);

    var editor = element(by.css('.protractor-test-concept-card-text'));
    await waitFor.visibilityOf(
      editor, 'Explanation Editor takes too long to appear');
    var skillReviewMaterialInput = editor.element(by.css('.oppia-rte'));
    await action.sendKeys(
      'Skill Review Material Field', skillReviewMaterialInput,
      reviewMaterial, true);

    await action.click('Create Skill button', confirmSkillCreationButton);

    await waitFor.newTabToBeCreated(
      'Creating skill takes too long', '/skill_editor/');
    handles = await browser.getAllWindowHandles();
    var newHandle = null;
    for (var i = 0; i < handles.length; i++) {
      if (initialHandles.indexOf(handles[i]) === -1) {
        newHandle = handles[i];
        break;
      }
    }
    await browser.switchTo().window(newHandle);
    if (shouldCloseSkillEditor) {
      await browser.driver.close();
      await browser.switchTo().window(parentHandle);
      await waitFor.invisibilityOf(
        confirmSkillCreationButton,
        'Create skill modal takes too long to be disappear.');
    } else {
      await waitFor.visibilityOf(
        element(by.css('.protractor-test-skill-description-field')),
        'Skill Editor is taking too long to appear.');
    }
    await waitFor.pageToFullyLoad();
  };

  this.unassignSkillFromTopic = async function(skillDescription, topicName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillDescription);
    expect(await skillEditOptions.count()).toEqual(1);
    var skillEditOptionBox = skillEditOptions.first();
    await action.click('Skill edit option', skillEditOptionBox);
    await waitFor.elementToBeClickable(
      unassignSkillButon,
      'Unassign Skill button takes too long to be clickable');
    await unassignSkillButon.click();

    await waitFor.modalPopupToAppear();
    await waitFor.visibilityOf(
      assignedTopicNamesInput.first(),
      'Topic names in unassign skill from topics modal taking' +
      ' too long to appear.');
    var topicListItem = element(by.cssContainingText(
      '.protractor-test-unassign-topic-label', topicName));
    var assignedTopicInput = topicListItem.element(
      assignedTopicNameInputClass);
    await waitFor.elementToBeClickable(
      assignedTopicInput,
      'Assigned topic checkbox takes too long to be clickable');
    await assignedTopicInput.click();

    await waitFor.elementToBeClickable(
      confirmUnassignSkillButton,
      'Confirm Unassign skill button takes too long to be clickable');
    await action.click('Confirm Unassign Skill', confirmUnassignSkillButton);
    await waitFor.invisibilityOf(
      confirmUnassignSkillButton,
      'Unassign skill modal takes too long to close.');
  };

  this.navigateToSkillsTab = async function() {
    await action.click('Skills tab button', skillsTabButton);
  };

  this.expectNumberOfTopicsToBe = async function(number) {
    let topicsTableIsPresent = await topicsTable.isPresent();
    if (topicsTableIsPresent) {
      expect(await topicsListItems.count()).toBe(number);
    }
  };

  this.expectTopicNameToBe = async function(topicName, index) {
    await this.waitForTopicsToLoad();
    expect(await topicNames.get(index).getText()).toEqual(topicName);
  };

  this.getTopicsCount = async function() {
    return await topicsListItems.count();
  };

  this.editTopic = async function(topicName) {
    await this.waitForTopicsToLoad();
    await this.filterTopicsByKeyword(topicName);
    expect(await topicNames.count()).toEqual(1);
    await this.navigateToTopicWithIndex(0);
  };

  this.expectSkillDescriptionToBe = async function(description, index) {
    await this.waitForSkillsToLoad();
    var elems = await skillDescriptions;
    expect(await elems[index].getText()).toEqual(description);
  };

  this.expectNumberOfSkillsToBe = async function(number) {
    if (!number) {
      await waitFor.visibilityOf(
        noSkillsPresentMessage,
        'No skills present message taking to long to appear.');
      expect(await noSkillsPresentMessage.isDisplayed()).toBe(true);
      return;
    }
    expect(await skillsListItems.count()).toEqual(number);
  };

  this.searchSkillByName = async function(name) {
    return await this.filterTopicsByKeyword(name);
  };
};

exports.TopicsAndSkillsDashboardPage = TopicsAndSkillsDashboardPage;
