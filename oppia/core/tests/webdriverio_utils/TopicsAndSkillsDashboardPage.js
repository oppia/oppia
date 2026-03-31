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

var TopicsAndSkillsDashboardPage = function () {
  var assignSkillToTopicButton = $('.e2e-test-assign-skill-to-topic-button');
  var assignSkillToTopicButtonLocator =
    '.e2e-test-assign-skill-to-topic-button';
  var assignSkillToTopicButtonsSelector = function () {
    return $$('.e2e-test-assign-skill-to-topic-button');
  };
  var topicEditOptionsMobileSelector = function () {
    return $$('.e2e-test-mobile-topic-name');
  };
  var assignedTopicNameInputClass = '.e2e-test-unassign-topic';
  var assignedTopicNamesInput = $('.e2e-test-unassign-topic');
  var confirmMoveButton = $('.e2e-test-confirm-move-button');
  var confirmSkillCreationButton = $('.e2e-test-confirm-skill-creation-button');
  var confirmSkillsMergeButton = $('.e2e-test-confirm-skill-selection-button');
  var confirmSkillDeletionButton = $('.e2e-test-confirm-skill-deletion-button');
  var confirmTopicCreationButton = $('.e2e-test-confirm-topic-creation-button');
  var confirmTopicDeletionButton = $('.e2e-test-confirm-topic-deletion-button');
  var confirmUnassignSkillButton = $('.e2e-test-confirm-unassign-skill-button');
  var createSkillButton = $('.e2e-test-create-skill-button');
  var createSkillButtonSecondary = $('.e2e-test-create-skill-button-circle');
  var createSkillButtonSecondaryMobile = $(
    '.e2e-test-mobile-create-skill-button-secondary'
  );
  var createTopicButton = $('.e2e-test-create-topic-button');
  var deleteSkillButton = $('.e2e-test-delete-skill-button');
  var deleteTopicButton = $('.e2e-test-delete-topic-button');
  var editTopicButton = $('.e2e-test-edit-topic-button');
  var editor = $('.e2e-test-concept-card-text');
  var mergeSkillsButton = $('.e2e-test-merge-skills-button');
  var noSkillsPresentMessage = $('.e2e-test-no-skills-present-message');
  var openConceptCardExplanationButton = $('.e2e-test-open-concept-card');
  var openSkillEditorButtonsSelector = function () {
    return $$('.e2e-test-open-skill-editor');
  };
  var skillDescriptionsElementSelector = function () {
    return $$('.e2e-test-skill-description');
  };
  var skillDescriptionField = $('.e2e-test-skill-description-field');
  var skillEditOptionsSelector = function () {
    return $$('.e2e-test-skill-edit-box');
  };
  var skillsListItem = $('.e2e-test-skills-list-item');
  var skillsListItemsSelector = function () {
    return $$('.e2e-test-skills-list-item');
  };
  var skillNameField = $('.e2e-test-new-skill-description-field');
  var skillStatusFilterDropdown = $('.e2e-test-select-skill-status-dropdown');
  var skillsTabButton = $('.e2e-test-skills-tab');
  var skillsTable = $('.e2e-test-skills-table');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var topicDescriptionField = $('.e2e-test-new-topic-description-field');
  var topicEditOptionsSelector = function () {
    return $$('.e2e-test-topic-edit-box');
  };
  var topicFilterKeywordField = $('.e2e-test-select-keyword-dropdown');
  var topicFilterClassroomField = $('.e2e-test-select-classroom-dropdown');
  var topicsListItem = $('.e2e-test-topics-list-item');
  var topicsListItemsSelector = async function () {
    await waitFor.pageToFullyLoad();
    return await $$('.e2e-test-topics-list-item');
  };
  var topicNameField = $('.e2e-test-new-topic-name-field');
  var topicNameFieldElement = $('.e2e-test-topic-name-field');
  var topicNamesSelector = async function () {
    return await $$('.e2e-test-topic-name');
  };
  var topicPageTitleFragmentField = $('.e2e-test-new-page-title-fragm-field');
  var topicResetFilters = $('.e2e-test-topic-filter-reset');
  var topicThumbnailButton = $('.e2e-test-photo-button');
  var topicUrlFragmentField = $(
    '.e2e-test-new-topic-url-fragment-field .e2e-test-url-fragment-field'
  );
  var topicsTable = $('.e2e-test-topics-table');
  var topicsTableMobile = $('.e2e-test-mobile-topic-table');
  var unassignSkillButton = $('.e2e-test-unassign-skill-button');
  var openFilter = $('.e2e-test-mobile-toggle-filter');
  var closeSkillFilter = $('.e2e-test-mobile-filter-close');
  var skillsTableMobile = $('.e2e-test-mobile-skills-table');
  var assignSkillToTopicButtonsMobile = $(
    '.e2e-test-mobile-assign-skill-to-topic-button'
  );
  var skillOptions = $('.e2e-test-mobile-skills-option');

  this.get = async function () {
    await waitFor.clientSideRedirection(
      async () => {
        await browser.url('/');
      },
      url => {
        return /learner-dashboard/.test(url);
      },
      async () => {
        await waitFor.pageToFullyLoad();
      }
    );
    await general.navigateToTopicsAndSkillsDashboardPage();
    expect(await browser.getUrl()).toEqual(
      'http://localhost:8181/topics-and-skills-dashboard'
    );
  };

  // Only use this if the skills count is not zero. This is supposed to be used
  // for actions being performed on the skills like deleting, assigning etc.
  this.waitForSkillsToLoad = async function () {
    let width = (await browser.getWindowSize()).width;
    if (width < 831) {
      await waitFor.visibilityOf(
        skillsTableMobile,
        'Skills table taking too long to appear.'
      );
      await waitFor.invisibilityOf(
        noSkillsPresentMessage,
        'Skills list taking too long to appear.'
      );
    } else {
      await waitFor.visibilityOf(
        skillsTable,
        'Skills table taking too long to appear.'
      );
      await waitFor.invisibilityOf(
        noSkillsPresentMessage,
        'Skills list taking too long to appear.'
      );
    }
  };

  // Only use this if the topics count is not zero. This is supposed to be used
  // for actions being performed on the topics like editing, deleting etc.
  this.waitForTopicsToLoad = async function () {
    let width = (await browser.getWindowSize()).width;
    if (width < 831) {
      await waitFor.visibilityOf(
        topicsTableMobile,
        'Topics table taking too long to appear'
      );
    } else {
      await waitFor.visibilityOf(
        topicsTable,
        'Topics table taking too long to appear'
      );
      await waitFor.visibilityOf(
        topicsListItem,
        'Topics list taking too long to appear'
      );
    }
  };

  this.isTopicTablePresent = async function () {
    return await topicsTable.isExisting();
  };

  this.mergeSkills = async function (oldSkillName, newSkillName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(oldSkillName);
    var skillEditOptions = await skillEditOptionsSelector();
    expect(skillEditOptions.length).toEqual(1);
    await action.click('Skill edit options', skillEditOptions[0]);
    await action.click('Merge skill button', mergeSkillsButton);

    var skill = $(`.e2e-test-skills-list-item*=${newSkillName}`);
    await action.click('Skill radio button', skill);
    await action.click('Confirm Skills Merge button', confirmSkillsMergeButton);
    await waitFor.invisibilityOf(
      confirmSkillsMergeButton,
      'Confirm Skill Modal takes too long to close.'
    );
  };

  this.navigateToTopicWithIndex = async function (index) {
    await this.waitForTopicsToLoad();
    let width = (await browser.getWindowSize()).width;
    if (width < 831) {
      var topicEditOptionsMobile = await topicEditOptionsMobileSelector();
      await action.click('Topic name', topicEditOptionsMobile[index]);
    } else {
      var topicEditOptions = await topicEditOptionsSelector();
      await action.click('Topic edit option', topicEditOptions[index]);
      await action.click('Edit topic button', editTopicButton);
    }
    await waitFor.pageToFullyLoad();
  };

  this.navigateToSkillWithDescription = async function (description) {
    await this.navigateToSkillsTab();
    await this.waitForSkillsToLoad();
    var openSkillEditorButtons = await openSkillEditorButtonsSelector();
    for (var i = 0; i < openSkillEditorButtons.length; i++) {
      var button = openSkillEditorButtons[i];
      var buttonText = await action.getText('Skill editor button', button);
      if (buttonText.includes(description)) {
        await action.click('Skill editor', button);
        await waitFor.pageToFullyLoad();
        return;
      }
    }
  };

  this.assignSkillToTopic = async function (skillName, topicName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillName);

    let width = (await browser.getWindowSize()).width;
    if (width < 831) {
      await action.click('Skill Options', skillOptions);
      await waitFor.visibilityOf(
        assignSkillToTopicButtonsMobile,
        'Assign skill to topic buttons taking too long to appear'
      );
      await action.click(
        'Assign skill to topic button',
        assignSkillToTopicButtonsMobile
      );
    } else {
      await waitFor.visibilityOf(
        assignSkillToTopicButton,
        'Assign skill to topic buttons taking too long to appear'
      );
      await waitFor.numberOfElementsToBe(
        assignSkillToTopicButtonLocator,
        'assignSkillToTopicButtons',
        1
      );
      var assignSkillToTopicButtons = await assignSkillToTopicButtonsSelector();
      await action.click(
        'Assign skill to topic button',
        assignSkillToTopicButtons[0]
      );
    }

    var topic = $(`.e2e-test-topic-name-in-topic-select-modal=${topicName}`);
    await action.click('Topic list item', topic);
    await action.click('Confirm move button', confirmMoveButton);
    await waitFor.invisibilityOf(
      confirmMoveButton,
      'Topic assignment modal taking too long to disappear'
    );
  };

  this.createTopic = async function (
    topicName,
    topicUrlFragment,
    description,
    shouldCloseTopicEditor
  ) {
    var initialHandles = [];
    var handles = await browser.getWindowHandles();
    initialHandles = handles;
    var parentHandle = await browser.getWindowHandle();
    await waitFor.visibilityOf(
      createTopicButton,
      'Create Topic Button takes too long to appear.'
    );
    await action.click('Create Topic button', createTopicButton);
    await waitFor.visibilityOf(
      topicNameField,
      'Create Topic modal takes too long to appear.'
    );
    await action.setValue('Topic name field', topicNameField, topicName);
    await waitFor.visibilityOf(
      topicUrlFragmentField,
      'Url fragment editor component takes too long to appear'
    );
    await action.setValue(
      'Topic URL fragment field',
      topicUrlFragmentField,
      topicUrlFragment
    );
    await action.setValue(
      'Topic description field',
      topicDescriptionField,
      description
    );
    await action.setValue(
      'Topic page title fragment field',
      topicPageTitleFragmentField,
      description
    );
    await workflow.submitImage(
      topicThumbnailButton,
      thumbnailContainer,
      '../data/test_svg.svg',
      false
    );

    await action.click(
      'Confirm Topic creation button',
      confirmTopicCreationButton
    );

    await waitFor.newTabToBeCreated(
      'Creating topic takes too long',
      '/topic_editor/'
    );
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
      topicNameFieldElement,
      'Topic Editor is taking too long to appear.'
    );
    if (shouldCloseTopicEditor) {
      await browser.closeWindow();
      await browser.switchToWindow(parentHandle);
      await waitFor.invisibilityOf(
        confirmTopicCreationButton,
        'Create Topic modal takes too long to disappear.'
      );
    }
    return await waitFor.pageToFullyLoad();
  };

  this.filterSkillsByStatus = async function (status) {
    let width = (await browser.getWindowSize()).width;
    if (width < 831) {
      await action.click('Skill Filter', openFilter);
    }

    await action.click(
      'Skill Dashboard status filter',
      skillStatusFilterDropdown
    );
    var dropdownOption = $(`.mat-option-text=${status}`);
    await action.click('Skill status filter option: ' + status, dropdownOption);

    if (width < 831) {
      await action.click('Close Filter', closeSkillFilter);
    }
  };

  this.filterTopicsByKeyword = async function (keyword) {
    let width = (await browser.getWindowSize()).width;
    if (width < 831) {
      await action.click('Skill Filter', openFilter);
    }

    await waitFor.visibilityOf(
      topicFilterKeywordField,
      'Topic Dashboard keyword filter parent taking too long to appear.'
    );

    var filterKeywordInput = await topicFilterKeywordField.$(
      '.e2e-test-multi-selection-input'
    );

    await action.setValue(
      'Topic Dashboard keyword filter: ' + keyword,
      filterKeywordInput,
      keyword + '\n'
    );

    if (width < 831) {
      await action.click('Close Filter', closeSkillFilter);
    }
  };

  this.filterTopicsByClassroom = async function (keyword) {
    await action.click(
      'Topic Dashboard classroom filter',
      topicFilterClassroomField
    );

    var dropdownOption = $(`.mat-option-text=${keyword}`);
    await action.click(
      'Topic dashboard classroom filter option',
      dropdownOption
    );
  };

  this.resetTopicFilters = async function () {
    await action.click('Reset button', topicResetFilters);
  };

  this.deleteTopicWithName = async function (topicName) {
    await this.waitForTopicsToLoad();
    await this.filterTopicsByKeyword(topicName);
    var topicEditOptions = await topicEditOptionsSelector();
    expect(topicEditOptions.length).toEqual(1);
    await action.click('Topic edit option', topicEditOptions[0]);
    await action.click('Delete topic button', deleteTopicButton);
    await action.click(
      'Confirm Delete Topic button',
      confirmTopicDeletionButton
    );
    await this.get();
  };

  this.deleteSkillWithName = async function (skillName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillName);
    var skillEditOptions = await skillEditOptionsSelector();
    expect(await skillEditOptions.length).toEqual(1);
    await action.click('Skill edit option', skillEditOptions[0]);
    await action.click('Delete skill button', deleteSkillButton);
    await action.click(
      'Confirm delete skill button',
      confirmSkillDeletionButton
    );
    await waitFor.pageToFullyLoad();
  };

  this.createSkillWithDescriptionAndExplanation = async function (
    description,
    reviewMaterial,
    shouldCloseSkillEditor
  ) {
    var initialHandles = [];
    var handles = await browser.getWindowHandles();
    initialHandles = handles;
    var parentHandle = await browser.getWindowHandle();

    let width = (await browser.getWindowSize()).width;

    if (width < 831) {
      try {
        await action.click('Create Skill button', createSkillButton);
      } catch (e) {
        await this.navigateToSkillsTab();
        await action.click(
          'Create Skill button',
          createSkillButtonSecondaryMobile
        );
      }
    } else {
      try {
        await action.click('Create Skill button', createSkillButton);
      } catch (e) {
        await this.navigateToSkillsTab();
        await action.click('Create Skill button', createSkillButtonSecondary);
      }
    }

    await action.setValue('Skill Name Field', skillNameField, description);
    await action.click(
      'Open Concept Card button',
      openConceptCardExplanationButton
    );

    await waitFor.visibilityOf(
      editor,
      'Explanation Editor takes too long to appear'
    );
    var skillReviewMaterialInput = editor.$('.e2e-test-rte');
    await action.setValue(
      'Skill Review Material Field',
      skillReviewMaterialInput,
      reviewMaterial,
      true
    );

    await action.click('Create Skill button', confirmSkillCreationButton);

    await waitFor.newTabToBeCreated(
      'Creating skill takes too long',
      '/skill_editor/'
    );
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
        'Create skill modal takes too long to be disappear.'
      );
    } else {
      await waitFor.visibilityOf(
        skillDescriptionField,
        'Skill Editor is taking too long to appear.'
      );
    }
    await waitFor.pageToFullyLoad();
  };

  this.unassignSkillFromTopic = async function (skillDescription, topicName) {
    await this.waitForSkillsToLoad();
    await this.searchSkillByName(skillDescription);
    var skillEditOptions = await skillEditOptionsSelector();
    expect(skillEditOptions.length).toEqual(1);
    var skillEditOptionBox = skillEditOptions[0];
    await action.click('Skill edit option', skillEditOptionBox);
    await action.click('Unassign Skill Button', unassignSkillButton);

    await waitFor.modalPopupToAppear();
    await waitFor.visibilityOf(
      assignedTopicNamesInput,
      'Topic names in unassign skill from topics modal taking' +
        ' too long to appear.'
    );
    var topicListItem = $(`.e2e-test-unassign-topic-label=${topicName}`);
    var assignedTopicInput = topicListItem.$(assignedTopicNameInputClass);
    await action.click('Assigned Topic Input', assignedTopicInput);

    await action.click('Confirm Unassign Skill', confirmUnassignSkillButton);
    await waitFor.invisibilityOf(
      confirmUnassignSkillButton,
      'Unassign skill modal takes too long to close.'
    );
  };

  this.navigateToSkillsTab = async function () {
    await action.click('Skills tab button', skillsTabButton);
  };

  this.expectNumberOfTopicsToBe = async function (number) {
    var topicsListItems = await topicsListItemsSelector();
    let topicsTableIsPresent = await topicsTable.isExisting();
    if (topicsTableIsPresent) {
      expect(topicsListItems.length).toBe(number);
    }
  };

  this.expectTopicNameToBe = async function (topicName, index) {
    await this.waitForTopicsToLoad();
    var topicNames = await topicNamesSelector();
    var topicNamesElement = topicNames[index];
    var text = await action.getText('Topic Names Element', topicNamesElement);
    expect(text).toEqual(topicName);
  };

  this.getTopicsCount = async function () {
    var topicsListItems = await topicsListItemsSelector();
    return topicsListItems.length;
  };

  this.editTopic = async function (topicName) {
    await this.waitForTopicsToLoad();
    await this.filterTopicsByKeyword(topicName);
    var topicNames = await topicNamesSelector();
    expect(topicNames.length).toEqual(1);
    await this.navigateToTopicWithIndex(0);
  };

  this.expectSkillDescriptionToBe = async function (description, index) {
    await this.waitForSkillsToLoad();
    var skillDescriptionsElement = await skillDescriptionsElementSelector();
    var text = await action.getText(
      'Skill Description Element',
      skillDescriptionsElement[index]
    );
    expect(text).toEqual(description);
  };

  this.expectNumberOfSkillsToBe = async function (number) {
    if (!number) {
      await waitFor.visibilityOf(
        noSkillsPresentMessage,
        'No skills present message taking too long to appear.'
      );
      expect(await noSkillsPresentMessage.isDisplayed()).toBe(true);
      return;
    }
    await waitFor.visibilityOf(
      skillsListItem,
      'Skills are taking too long to appear.'
    );
    var skillsListItems = await skillsListItemsSelector();
    expect(skillsListItems.length).toEqual(number);
  };

  this.searchSkillByName = async function (name) {
    return await this.filterTopicsByKeyword(name);
  };
};

exports.TopicsAndSkillsDashboardPage = TopicsAndSkillsDashboardPage;
