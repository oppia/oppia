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
  var topicNames = element.all(by.css('.e2e-test-topic-name'));
  var skillDescriptions = element.all(
    by.css('.e2e-test-skill-description'));
  var createTopicButton = element(
    by.css('.e2e-test-create-topic-button'));
  var createSkillButton = element(
    by.css('.e2e-test-create-skill-button'));
  var createSkillButtonSecondary = element(
    by.css('.e2e-test-create-skill-button-circle'));
  var createSkillButtonSecondaryMobile = element(
    by.css('.e2e-test-mobile-create-skill-button-secondary'));
  var deleteSkillButton = element(
    by.css('.e2e-test-delete-skill-button'));
  var topicsTable = element(by.css('.e2e-test-topics-table'));
  var topicsTableMobile = element(by.css('.e2e-test-mobile-topic-table'));
  var skillsTable = element(by.css('.e2e-test-skills-table'));
  var skillsTableMobile = element(
    by.css('.e2e-test-mobile-skills-table'));
  var topicsListItems = element.all(
    by.css('.e2e-test-topics-list-item'));
  var topicNamesClass = '.e2e-test-topic-name-in-topic-select-modal';
  var skillsListItems = element.all(
    by.css('.e2e-test-skills-list-item'));
  var skillListItemsClass = '.e2e-test-skills-list-item';
  var topicNameField = element(by.css(
    '.e2e-test-new-topic-name-field'));
  var topicUrlFragmentField = element(by.css(
    '.e2e-test-new-topic-url-fragment-field'));
  var topicDescriptionField = element(by.css(
    '.e2e-test-new-topic-description-field'));
  var topicPageTitleFragmentField = element(by.css(
    '.e2e-test-new-page-title-fragm-field'));
  var topicFilterKeywordField = element(by.css(
    '.e2e-test-select-keyword-dropdown'));
  var topicFilterClassroomField = element(by.css(
    '.e2e-test-select-classroom-dropdown'));
  var topicEditOptions = element.all(
    by.css('.e2e-test-topic-edit-box'));
  var topicEditOptionsMobile = element.all(
    by.css('.e2e-test-mobile-topic-name'));
  var skillEditOptions = element.all(
    by.css('.e2e-test-skill-edit-box'));
  var topicResetFilters = element(by.css(
    '.e2e-test-topic-filter-reset'));
  var deleteTopicButton = element(
    by.css('.e2e-test-delete-topic-button'));
  var editTopicButton = element(
    by.css('.e2e-test-edit-topic-button'));
  var unassignSkillButton = element(
    by.css('.e2e-test-unassign-skill-button'));
  var skillNameField = element(
    by.css('.e2e-test-new-skill-description-field')
  );
  var confirmTopicCreationButton = element(
    by.css('.e2e-test-confirm-topic-creation-button')
  );
  var confirmTopicDeletionButton = element(
    by.css('.e2e-test-confirm-topic-deletion-button')
  );
  var confirmSkillCreationButton = element(
    by.css('.e2e-test-confirm-skill-creation-button')
  );
  var confirmSkillDeletionButton = element(
    by.css('.e2e-test-confirm-skill-deletion-button')
  );
  var skillsTabButton = element(
    by.css('.e2e-test-skills-tab')
  );
  var assignSkillToTopicButtons = element.all(
    by.css('.e2e-test-assign-skill-to-topic-button'));
  var assignSkillToTopicButtonsMobile = element.all(
    by.css('.e2e-test-mobile-assign-skill-to-topic-button'));
  var confirmMoveButton = element(
    by.css('.e2e-test-confirm-move-button'));
  var mergeSkillsButton = element(
    by.css('.e2e-test-merge-skills-button'));
  var confirmSkillsMergeButton = element(
    by.css('.e2e-test-confirm-skill-selection-button'));
  var openConceptCardExplanationButton = element(
    by.css('.e2e-test-open-concept-card'));
  var topicThumbnailButton = element(
    by.css('.e2e-test-photo-button'));
  var thumbnailContainer = element(
    by.css('.e2e-test-thumbnail-container'));
  var skillStatusFilterDropdown = element(
    by.css('.e2e-test-select-skill-status-dropdown'));
  var confirmUnassignSkillButton =
    element(by.css('.e2e-test-confirm-unassign-skill-button'));
  var noSkillsPresentMessage = element(
    by.css('.e2e-test-no-skills-present-message'));
  var assignedTopicNamesInput = element.all(
    by.css('.e2e-test-unassign-topic'));
  var assignedTopicNameInputClass = by.css('.e2e-test-unassign-topic');
  var topicNameFieldElement = element(
    by.css('.e2e-test-topic-name-field'));
  var keywordFieldInput = by.css('.e2e-test-multi-selection-input');
  var editor = element(by.css('.e2e-test-concept-card-text'));
  var retLocator = by.css('.e2e-test-rte');
  var skillDescriptionField = element(
    by.css('.e2e-test-skill-description-field'));
  var openSkillEditorButtons = element.all(
    by.css('.e2e-test-open-skill-editor'));
  var openFilter = element(
    by.css('.e2e-test-mobile-toggle-filter')
  );
  var closeSkillFilter = element(
    by.css('.e2e-test-mobile-filter-close')
  );
  var skillOptions = element(
    by.css('.e2e-test-mobile-skills-option')
  );

  this.get = async function() {
    await waitFor.clientSideRedirection(async() => {
      await browser.get('/');
    }, (url) => {
      return /learner-dashboard/.test(url);
    }, async() => {
      await waitFor.pageToFullyLoad();
    });
    await general.navigateToTopicsAndSkillsDashboardPage();
    expect(await browser.getCurrentUrl()).toEqual(
      'http://localhost:9001/topics-and-skills-dashboard');
  };

  // Only use this if the skills count is not zero. This is supposed to be used
  // for actions being performed on the skills like deleting, assigning etc.
  this.waitForSkillsToLoad = async function() {
    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      await waitFor.visibilityOf(
        skillsTableMobile, 'Skills table taking too long to appear.');
      await waitFor.invisibilityOf(
        noSkillsPresentMessage, 'Skills list taking too long to appear.');
    } else {
      await waitFor.visibilityOf(
        skillsTable, 'Skills table taking too long to appear.');
      await waitFor.invisibilityOf(
        noSkillsPresentMessage, 'Skills list taking too long to appear.');
    }
  };

  // Only use this if the topics count is not zero. This is supposed to be used
  // for actions being performed on the topics like editing, deleting etc.
  this.waitForTopicsToLoad = async function() {
    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      await waitFor.visibilityOf(
        topicsTableMobile, 'Topics table taking too long to appear');
    } else {
      await waitFor.visibilityOf(
        topicsTable, 'Topics table taking too long to appear');
      await waitFor.visibilityOf(
        topicsListItems.first(), 'Topics list taking too long to appear');
    }
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
    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      await action.click('Topic name', topicEditOptionsMobile.get(index));
    } else {
      await action.click(
        'Topic edit option', topicEditOptions.get(index));
      await action.click(
        'Edit topic button', editTopicButton);
    }
    await waitFor.pageToFullyLoad();
  };

  this.navigateToSkillWithDescription = async function(description) {
    await this.navigateToSkillsTab();
    await this.waitForSkillsToLoad();
    for (var i = 0; i < await openSkillEditorButtons.count(); i++) {
      var button = openSkillEditorButtons.get(i);
      var buttonText = await action.getText('Skill editor button', button);
      if (buttonText.includes(description)) {
        await action.click('Skill editor', button);
        await waitFor.pageToFullyLoad();
        return;
      }
    }
  };

  this.assignSkillToTopic = async function(skillName, topicName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillName);

    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      await action.click('Skill Options', skillOptions);
      await waitFor.visibilityOf(
        assignSkillToTopicButtonsMobile.first(),
        'Assign skill to topic buttons taking too long to appear');
      expect(await assignSkillToTopicButtonsMobile.count()).toEqual(1);
      await action.click(
        'Assign skill to topic button',
        assignSkillToTopicButtonsMobile.first());
    } else {
      await waitFor.visibilityOf(
        assignSkillToTopicButtons.first(),
        'Assign skill to topic buttons taking too long to appear');
      expect(await assignSkillToTopicButtons.count()).toEqual(1);
      await action.click(
        'Assign skill to topic button', assignSkillToTopicButtons.first());
    }

    var topic = element(by.cssContainingText(topicNamesClass, topicName));
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
    await action.sendKeys(
      'Topic page title fragment field',
      topicPageTitleFragmentField, description);
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
      topicNameFieldElement, 'Topic Editor is taking too long to appear.');
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
    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      await action.click('Skill Filter', openFilter);
    }

    await action.click(
      'Skill Dashboard status filter', skillStatusFilterDropdown);
    var dropdownOption = element(
      by.cssContainingText('mat-option .mat-option-text', status));
    await action.click(
      'Skill status filter option: ' + status, dropdownOption);

    if (width < 831) {
      await action.click('Close Filter', closeSkillFilter);
    }
  };

  this.filterTopicsByKeyword = async function(keyword) {
    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      await action.click('Skill Filter', openFilter);
    }

    await waitFor.visibilityOf(
      topicFilterKeywordField,
      'Topic Dashboard keyword filter parent taking too long to appear.');
    var filterKeywordInput = topicFilterKeywordField.element(
      keywordFieldInput);

    await action.sendKeys(
      'Topic Dashboard keyword filter: ' + keyword,
      filterKeywordInput, keyword + '\n');

    if (width < 831) {
      await action.click('Close Filter', closeSkillFilter);
    }
  };

  this.filterTopicsByClassroom = async function(keyword) {
    await action.click(
      'Topic Dashboard classroom filter', topicFilterClassroomField);

    var dropdownOption = element(
      by.cssContainingText('mat-option .mat-option-text', keyword));
    await action.click(
      'Topic dashboard classroom filter option', dropdownOption);
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

    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      try {
        await action.click('Create Skill button', createSkillButton);
      } catch (e) {
        await this.navigateToSkillsTab();
        await action.click(
          'Create Skill button', createSkillButtonSecondaryMobile);
      }
    } else {
      try {
        await action.click('Create Skill button', createSkillButton);
      } catch (e) {
        await this.navigateToSkillsTab();
        await action.click('Create Skill button', createSkillButtonSecondary);
      }
    }

    await action.sendKeys('Skill Name Field', skillNameField, description);
    await action.click(
      'Open Concept Card button', openConceptCardExplanationButton);

    await waitFor.visibilityOf(
      editor, 'Explanation Editor takes too long to appear');
    var skillReviewMaterialInput = editor.element(retLocator);
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
        skillDescriptionField, 'Skill Editor is taking too long to appear.');
    }
    await waitFor.pageToFullyLoad();
  };

  this.unassignSkillFromTopic = async function(skillDescription, topicName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillDescription);
    expect(await skillEditOptions.count()).toEqual(1);
    var skillEditOptionBox = skillEditOptions.first();
    await action.click('Skill edit option', skillEditOptionBox);
    await action.click('Unassign Skill Button', unassignSkillButton);

    await waitFor.modalPopupToAppear();
    await waitFor.visibilityOf(
      assignedTopicNamesInput.first(),
      'Topic names in unassign skill from topics modal taking' +
      ' too long to appear.');
    var topicListItem = element(by.cssContainingText(
      '.e2e-test-unassign-topic-label', topicName));
    var assignedTopicInput = topicListItem.element(
      assignedTopicNameInputClass);
    await action.click('Assigned Topic Input', assignedTopicInput);

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
    var topicNamesElement = topicNames.get(index);
    var text = await action.getText('Topic Names Element', topicNamesElement);
    expect(text).toEqual(topicName);
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
    var skillDescriptionsElement = await skillDescriptions;
    var text = await action.getText(
      'Skill Description Element', skillDescriptionsElement[index]);
    expect(text).toEqual(description);
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
