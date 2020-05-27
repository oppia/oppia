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

var forms = require('./forms.js');
var waitFor = require('./waitFor.js');
var SkillEditorPage = require('./SkillEditorPage.js');

var TopicsAndSkillsDashboardPage = function() {
  var DASHBOARD_URL = '/topics_and_skills_dashboard';
  var skillEditorPage = new SkillEditorPage.SkillEditorPage();
  var topicNames = element.all(by.css('.protractor-test-topic-name'));
  var skillDescriptions = element.all(
    by.css('.protractor-test-skill-description'));
  var createTopicButton = element(
    by.css('.protractor-test-create-topic-button'));
  var deleteTopicButtons = element.all(
    by.css('.protractor-test-delete-topic-button'));
  var createSkillButton = element(
    by.css('.protractor-test-create-skill-button'));
  var deleteSkillButtons = element.all(
    by.css('.protractor-test-delete-skill-button'));
  var topicsListItems = element.all(
    by.css('.protractor-test-topics-list-item'));
  var skillsListItems = element.all(
    by.css('.protractor-test-skills-list-item'));
  var topicNameField = element(by.css('.protractor-test-new-topic-name-field'));
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
  var unusedSkillsTabButton = element(
    by.css('.protractor-test-unused-skills-tab')
  );
  var assignSkillToTopicButtons = element.all(
    by.css('.protractor-test-assign-skill-to-topic-button'));
  var confirmMoveButton = element(
    by.css('.protractor-test-confirm-move-button'));
  var mergeSkillsButtons = element.all(
    by.css('.protractor-test-merge-skills-button'));
  var confirmSkillsMergeButton = element(
    by.css('.protractor-test-confirm-skill-selection-button'));
  var searchSkillInput = element(by.css('.protractor-test-search-skill-input'));
  var editConceptCardExplanationButton = element(
    by.css('.protractor-test-edit-concept-card'));
  var saveConceptCardExplanationButton = element(
    by.css('.protractor-test-save-concept-card'));
  var topicNamesInTopicSelectModal = element.all(
    by.css('.protractor-test-topic-name-in-topic-select-modal'));
  var topicsTabButton = element(
    by.css('.protractor-test-topics-tab')
  );

  // Returns a promise of all topics with the given name.
  var _getTopicElements = async function(topicName) {
    topicsListElems = [];
    for (var i = 0; i < await topicsListItems.count(); i++) {
      var name = await topicsListItems.get(i).element(
        by.css('.protractor-test-topic-name')).getText();
      if (name === topicName) {
        topicsListElems.push(topicsListItems.get(i));
      }
    }
    return topicsListElems;
  };

  this.get = async function() {
    await browser.get('/');
    var profileDropdown = element(
      by.css('.protractor-test-profile-dropdown'));
    await waitFor.elementToBeClickable(
      profileDropdown, 'Could not click profile dropdown');
    await profileDropdown.click();
    var topicsAndSkillsDashboardLink = element(by.css(
      '.protractor-test-topics-and-skills-dashboard-link'));
    await waitFor.elementToBeClickable(
      topicsAndSkillsDashboardLink,
      'Could not click on the topics and skills dashboard link');
    await topicsAndSkillsDashboardLink.click();
    await waitFor.pageToFullyLoad();
    expect(await browser.getCurrentUrl()).toEqual(
      'http://localhost:9001/topics_and_skills_dashboard');
  };

  this.mergeSkillWithIndexToSkillWithIndex = async function(
      oldSkillIndex, newSkillIndex) {
    var elems = await mergeSkillsButtons;
    await elems[oldSkillIndex].click();
    var skills = await skillsListItems;
    await skills[newSkillIndex].click();
    await confirmSkillsMergeButton.click();
  };

  this.navigateToTopicWithIndex = async function(index) {
    var elems = await topicsListItems;
    await elems[index].click();
  };

  this.assignSkillWithIndexToTopic = async function(index, topicIndex) {
    var elems = await assignSkillToTopicButtons;
    await elems[index].click();
    var topics = await topicsListItems;
    await topics[index].click();
    await confirmMoveButton.click();
  };

  this.assignSkillWithIndexToTopicByTopicName = async function(
      skillIndex, topicName) {
    await (await assignSkillToTopicButtons.get(skillIndex)).click();
    var topicRowsCount = await topicNamesInTopicSelectModal.count();
    for (var i = 0; i < topicRowsCount; i++) {
      var topicElem = await topicNamesInTopicSelectModal.get(i);
      var isTarget = await topicElem.getText();
      if (isTarget === topicName) {
        await topicElem.click();
        await confirmMoveButton.click();
      }
    }
  };

  this.createTopic = async function(topicName, shouldCloseTopicEditor) {
    var initialHandles = [];
    var handles = await browser.getAllWindowHandles();
    initialHandles = handles;
    var parentHandle = await browser.getWindowHandle();
    await waitFor.elementToBeClickable(
      createTopicButton,
      'Create Topic button takes too long to be clickable');
    await createTopicButton.click();

    await topicNameField.sendKeys(topicName);
    await confirmTopicCreationButton.click();

    await waitFor.newTabToBeCreated(
      'Creating topic takes too long', '/topic_editor/');
    handles = await browser.getAllWindowHandles();

    var newHandle = handles.filter(
      handle => initialHandles.indexOf(handle) === -1)[0];
    await browser.switchTo().window(newHandle);
    if (shouldCloseTopicEditor) {
      await browser.driver.close();
      return await browser.switchTo().window(parentHandle);
    }
    return await waitFor.pageToFullyLoad();
  };

  this.deleteTopicWithIndex = async function(index) {
    var elems = await deleteTopicButtons;
    await waitFor.elementToBeClickable(
      elems[0],
      'Delete Topic button takes too long to be clickable');
    await elems[0].click();

    await waitFor.elementToBeClickable(
      confirmTopicDeletionButton,
      'Confirm Delete Topic button takes too long to be clickable');
    await confirmTopicDeletionButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.deleteSkillWithIndex = async function(index) {
    var elems = await deleteSkillButtons;
    await waitFor.elementToBeClickable(
      elems[0],
      'Delete skill button takes too long to be clickable');
    await elems[0].click();
    await waitFor.elementToBeClickable(
      confirmSkillDeletionButton,
      'Confirm Delete Skill button takes too long to be clickable');
    await confirmSkillDeletionButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.createSkillWithDescriptionAndExplanation = async function(
      description, reviewMaterial, shouldCloseSkillEditor) {
    var initialHandles = [];
    var handles = await browser.getAllWindowHandles();
    initialHandles = handles;
    var parentHandle = await browser.getWindowHandle();
    await waitFor.elementToBeClickable(
      createSkillButton,
      'Create Skill button takes too long to be clickable');
    await createSkillButton.click();

    await skillNameField.sendKeys(description);
    await editConceptCardExplanationButton.click();

    var editor = element(by.css('.protractor-test-concept-card-text'));
    await waitFor.visibilityOf(
      editor, 'Explanation Editor takes too long to appear');

    await (await browser.switchTo().activeElement()).sendKeys(reviewMaterial);

    await waitFor.elementToBeClickable(
      saveConceptCardExplanationButton,
      'Save Concept Card Explanation button takes too long to be clickable');
    await saveConceptCardExplanationButton.click();
    await waitFor.invisibilityOf(
      editor, 'Explanation Editor takes too long to close');

    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Explanation for easy difficulty.');
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Medium', 'Explanation for medium difficulty.');
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Hard', 'Explanation for hard difficulty.');

    await waitFor.elementToBeClickable(
      confirmSkillCreationButton,
      'Create skill button takes too long to be clickable');
    await confirmSkillCreationButton.click();

    await waitFor.newTabToBeCreated(
      'Creating skill takes too long', '/skill_editor/');
    handles = await browser.getAllWindowHandles();
    var newHandle = handles.filter(
      handle => initialHandles.indexOf(handle) === -1)[0];
    await browser.switchTo().window(newHandle);
    if (shouldCloseSkillEditor) {
      await browser.driver.close();
      await browser.switchTo().window(parentHandle);
    }
    await waitFor.pageToFullyLoad();
  };

  this.navigateToUnusedSkillsTab = async function() {
    await unusedSkillsTabButton.click();
  };

  this.expectNumberOfTopicsToBe = async function(number) {
    expect(await topicsListItems.count()).toBe(number);
  };

  this.expectTopicNameToBe = async function(topicName, index) {
    expect(await topicNames.get(index).getText()).toEqual(topicName);
  };

  this.editTopic = async function(topicName) {
    await waitFor.elementToBeClickable(
      topicsTabButton, 'Unable to click on topics tab.');
    var topicElements = await _getTopicElements(topicName);
    if (topicElements.length === 0) {
      throw new Error('Could not find topic tile with name ' + topicName);
    }
    await waitFor.elementToBeClickable(
      topicElements[0], 'Unable to click on topic: ' + topicName);
    await topicElements[0].click();
    await waitFor.pageToFullyLoad();
  };

  this.expectSkillDescriptionToBe = async function(description, index) {
    var elems = await skillDescriptions;
    expect(await elems[index].getText()).toEqual(description);
  };

  this.expectNumberOfSkillsToBe = async function(number) {
    var elems = await skillsListItems;
    expect(elems.length).toBe(number);
  };

  this.searchSkillByName = async function(name) {
    await waitFor.visibilityOf(
      searchSkillInput,
      'searchSkillInput takes too long to be visible.');
    await searchSkillInput.sendKeys(name);
  };
};

exports.TopicsAndSkillsDashboardPage = TopicsAndSkillsDashboardPage;
