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

var StoryEditorPage = function () {
  var EDITOR_URL_PREFIX = '/story_editor/';
  var backToStoryEditorButton = $('.e2e-test-back-to-story-editor-button');
  var returnToTopicButton = $('.e2e-test-return-to-topic-button');
  var saveStoryButton = $('.e2e-test-save-story-button');
  var commitMessageField = $('.e2e-test-commit-message-input');
  var closeSaveModalButton = $('.e2e-test-close-save-modal-button');
  var createChapterButton = $('.e2e-test-add-chapter-button');
  var createChapterButtonMobile = $('.e2e-test-mobile-add-chapter');
  var newChapterTitleField = $('.e2e-test-new-chapter-title-field');
  var newChapterExplorationField = $('.e2e-test-chapter-exploration-input');
  var notesEditor = $('.e2e-test-story-notes-rte');
  var openStoryNotesEditorButton = $(
    '.e2e-test-open-story-notes-editor-button'
  );
  var confirmChapterCreationButton = $(
    '.e2e-test-confirm-chapter-creation-button'
  );
  var publishStoryButton = $('.e2e-test-publish-story-button');
  var publishChapterButton = $('.e2e-test-publish-chapters-button');
  var markAsReadyToPublishButton = $(
    '.e2e-test-mark-as-ready-to-publish-button'
  );
  var markAsDraftButton = $('.e2e-test-mark-as-draft-button');
  var publishChangesButton = $('.e2e-test-publish-changes-button');
  var unpublishStoryButton = $('.e2e-test-unpublish-story-button');
  var saveStoryNotesEditorButton = $('.e2e-test-save-story-notes-button');
  var storyDescriptionField = $('.e2e-test-story-description-field');
  var storyNotes = $('.e2e-test-story-notes');
  var storyMetaTagContentField = $('.e2e-test-story-meta-tag-content-field');
  var storyMetaTagContentLabel = $('.e2e-test-story-meta-tag-content-label');
  var storyTitleField = $('.e2e-test-story-title-field');
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var chapterEditOption = $('.e2e-test-edit-options');
  var chapterEditOptionsSelector = function () {
    return $$('.e2e-test-edit-options');
  };
  var deleteChapterButton = $('.e2e-test-delete-chapter-button');
  var confirmDeleteChapterButton = $('.e2e-test-confirm-delete-chapter-button');
  var cancelChapterCreationButton = $(
    '.e2e-test-cancel-chapter-creation-button'
  );
  var saveStoryIcon = $('.e2e-test-mobile-options-base');

  /*
   * CHAPTER
   */
  var addPrerequisiteSkillButton = $('.e2e-test-add-prerequisite-skill');
  var addAcquiredSkillButton = $('.e2e-test-add-acquired-skill');
  var selectSkillModalHeader = $('.e2e-test-skill-select-header');
  var skillNameInputField = $('.e2e-test-skill-name-input');
  var skillSaveButton = $('.e2e-test-confirm-skill-selection-button');
  var skillListItem = $('.e2e-test-skills-list-item');
  var skillListItemsSelector = function () {
    return $$('.e2e-test-skills-list-item');
  };
  var deletePrerequisiteSkillButtonSelector = function () {
    return $$('.e2e-test-remove-prerequisite-skill');
  };
  var deleteAcquiredSkillButtonSelector = function () {
    return $$('.e2e-test-remove-acquired-skill');
  };
  var nextChapterCard = $('.e2e-test-next-chapter-card');
  var warningIndicator = $('.e2e-test-warning-indicator');
  var warningTextElement = $('.e2e-test-warnings-text');
  var warningTextElementsSelector = function () {
    return $$('.e2e-test-warnings-text');
  };
  var chapterTitle = $('.e2e-test-chapter-title');
  var chapterTitlesSelector = function () {
    return $$('.e2e-test-chapter-title');
  };
  var chapterStatusSelector = function () {
    return $$('.e2e-test-chapter-status');
  };
  var discardOption = $('.e2e-test-show-discard-option');
  var discardChangesButton = $('.e2e-test-discard-story-changes');
  var explorationAlreadyPresentMsg = $('.e2e-test-invalid-exp-id');
  var explorationIdInput = $('.e2e-test-exploration-id-input');
  var explorationIdSaveButton = $('.e2e-test-exploration-id-save-button');
  var nextChapterCard = $('.e2e-test-next-chapter-card');
  var nodeDescriptionInputField = $('.e2e-test-add-chapter-description');
  var plannedPublicationDateInput = $(
    '.e2e-test-planned-publication-date-input'
  );
  var nodeOutlineEditor = $('.e2e-test-add-chapter-outline');
  var nodeOutlineFinalizeCheckbox = $('.e2e-test-finalize-outline');
  var nodeOutlineEditorRteContentSelector = function () {
    return $$('.e2e-test-rte');
  };
  var publishUptoChaptersDropdownSelector = $(
    '.e2e-test-publish-up-to-chapter-dropdown'
  );
  var nodeOutlineSaveButton = $('.e2e-test-node-outline-save-button');
  var createChapterThumbnailButton = $(
    '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button'
  );
  var storyThumbnailImageElement = $(
    '.e2e-test-story-thumbnail .e2e-test-custom-photo'
  );
  var storyThumbnailButton = $(
    '.e2e-test-story-thumbnail .e2e-test-photo-button'
  );
  var chapterThumbnailImageElement = $(
    '.e2e-test-story-node-thumbnail .e2e-test-custom-photo'
  );
  var chapterThumbnailButton = $(
    '.e2e-test-story-node-thumbnail .e2e-test-photo-button'
  );

  this.get = async function (storyId) {
    await browser.url(EDITOR_URL_PREFIX + storyId);
    await waitFor.pageToFullyLoad();
  };

  this.getStoryThumbnailSource = async function () {
    return await workflow.getImageSource(storyThumbnailImageElement);
  };

  this.getChapterThumbnailSource = async function () {
    return await workflow.getImageSource(chapterThumbnailImageElement);
  };

  this.submitStoryThumbnail = async function (imgPath, resetExistingImage) {
    return await workflow.submitImage(
      storyThumbnailButton,
      thumbnailContainer,
      imgPath,
      resetExistingImage
    );
  };

  this.submitChapterThumbnail = async function (imgPath, resetExistingImage) {
    return await workflow.submitImage(
      chapterThumbnailButton,
      thumbnailContainer,
      imgPath,
      resetExistingImage
    );
  };

  this.publishStory = async function () {
    let width = (await browser.getWindowSize()).width;

    if (width < 1000) {
      var anchorSelector = function () {
        return $$('i');
      };
      let i = await anchorSelector();

      await action.click('Mobile options', i[11]);

      var publishSelector = function () {
        return $$('.e2e-test-mobile-publish-button');
      };
      let publish = (await publishSelector())[0];
      await action.click('Publish Story Mobile', publish);
    } else {
      await action.click('Publish Story Button', publishStoryButton);
    }

    await waitFor.visibilityOf(
      unpublishStoryButton,
      'Story is taking too long to get published.'
    );
  };

  this.unpublishStory = async function () {
    await action.click('Unpublish Story Button', unpublishStoryButton);
    await action.click('Close Save Modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Unpublish message modal takes too long to disappear.'
    );
  };

  this.deleteChapterWithIndex = async function (index) {
    await waitFor.visibilityOf(
      chapterEditOption,
      'Chapter list taking too long to appear.'
    );
    var chapterEditOptions = await chapterEditOptionsSelector();
    await action.click('Chapter edit options', chapterEditOptions[index]);
    await action.click('Delete chapter button', deleteChapterButton);
    await action.click(
      'Confirm delete chapter button',
      confirmDeleteChapterButton
    );
  };

  this.createNewChapter = async function (title, explorationId, imgPath) {
    await general.scrollToTop();

    let width = (await browser.getWindowSize()).width;

    if (width < 831) {
      await action.click(
        'Create chapter arrow takes too long to be clickable.',
        createChapterButtonMobile
      );
    }

    await action.click(
      'Create chapter button takes too long to be clickable.',
      createChapterButton
    );

    await action.setValue(
      'New chapter title field',
      newChapterTitleField,
      title
    );
    await action.setValue(
      'New chapter exploration ID',
      newChapterExplorationField,
      explorationId
    );
    await workflow.submitImage(
      createChapterThumbnailButton,
      thumbnailContainer,
      imgPath,
      false
    );
    await action.click(
      'Confirm chapter creation button',
      confirmChapterCreationButton
    );
    await general.scrollToTop();
  };

  this.cancelChapterCreation = async function () {
    await action.click(
      'Cancel chapter creation button',
      cancelChapterCreationButton
    );
  };

  this.discardStoryChanges = async function () {
    await action.click('Show discard option button', discardOption);
    await action.click('Discard changes button', discardChangesButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToChapterWithName = async function (chapterName) {
    var chapterTitle = $(`.e2e-test-chapter-title=${chapterName}`);
    await waitFor.visibilityOf(
      chapterTitle,
      'Chapter name is taking too long to appear'
    );
    var chapterTitles = await chapterTitlesSelector();
    var chapterIndex = -1;
    var chapterText = '';
    for (var i = 0; i < chapterTitles.length; i++) {
      chapterText = await action.getText(
        'Chapter Title Element',
        chapterTitles[i]
      );
      if (chapterText === chapterName) {
        chapterIndex = i;
        break;
      }
    }
    expect(chapterIndex).not.toEqual(-1);

    await action.click('Chapter list item', chapterTitles[i]);
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      nodeOutlineEditor,
      'Chapter editor is taking too long to appear.'
    );
    await general.scrollToTop();
  };

  this.navigateToStoryEditorTab = async function () {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      backToStoryEditorButton,
      'Back to story button is not visible'
    );
    await general.scrollToTop();
    await action.click('Back to story editor tab', backToStoryEditorButton);
  };

  this.expectChaptersListToBe = async function (chapters) {
    await this.expectNumberOfChaptersToBe(chapters.length);
    for (var i = 0; i < chapters.length; i++) {
      var chapterTitles = await chapterTitlesSelector();
      expect(await chapterTitles[i].getText()).toEqual(chapters[i]);
    }
  };

  this.expectChapterStatusToBe = async function (index, status) {
    var chapterTitles = await chapterStatusSelector();
    var chapterStatusText = await action.getText(
      'Chapter Status',
      chapterTitles[index]
    );
    expect(chapterStatusText).toEqual(status);
  };

  this.dragChapterToAnotherChapter = async function (chapter1, chapter2) {
    await waitFor.visibilityOf(
      chapterTitle,
      'Chapter titles taking too long to appear.'
    );
    var chapterTitles = await chapterTitlesSelector();
    var matchFound = false;
    for (var i = 0; i < chapterTitles.length; i++) {
      if ((await chapterTitles[i].getText()) === chapter1) {
        matchFound = true;
        break;
      }
    }
    expect(matchFound).toBe(true);
    var toMove = chapterTitles[i];

    matchFound = false;
    for (var i = 0; i < chapterTitles.length; i++) {
      if ((await chapterTitles[i].getText()) === chapter2) {
        matchFound = true;
        break;
      }
    }
    expect(matchFound).toBe(true);
    var target = chapterTitles[i];
    await general.dragAndDrop(toMove, target);
  };

  this.expectDestinationToBe = async function (chapterName) {
    var pattern = 's*' + chapterName + 's*';
    return expect(await nextChapterCard.getText()).toMatch(pattern);
  };

  this.expectNumberOfChaptersToBe = async function (count) {
    await waitFor.visibilityOf(
      chapterTitle,
      'Chapter Title Field takes too long to appear'
    );
    var chapterTitles = await chapterTitlesSelector();
    expect(chapterTitles.length).toEqual(count);
  };

  this.expectNotesToBe = async function (richTextInstructions) {
    await forms.expectRichText(storyNotes).toMatch(richTextInstructions);
  };

  this.expectTitleToBe = async function (title) {
    await waitFor.visibilityOf(
      storyTitleField,
      'Story Title Field takes too long to appear'
    );
    var storyTitleValue = await action.getValue(
      'Story Title Field',
      storyTitleField
    );
    expect(storyTitleValue).toEqual(title);
  };

  this.expectDescriptionToBe = async function (description) {
    await waitFor.visibilityOf(
      storyDescriptionField,
      'Story Description Field takes too long to appear'
    );
    var storyDescriptionValue = await action.getValue(
      'Story Description Field',
      storyDescriptionField
    );
    expect(storyDescriptionValue).toEqual(description);
  };

  this.changeStoryTitle = async function (storyTitle) {
    await waitFor.visibilityOf(
      storyTitleField,
      'Story Title Field taking too long to appear.'
    );
    await action.clear('Story Title Field', storyTitleField);
    await action.setValue('Story Title Field', storyTitleField, storyTitle);
  };

  this.returnToTopic = async function () {
    await general.scrollToTop();
    await waitFor.pageToFullyLoad();

    let width = (await browser.getWindowSize()).width;
    if (width < 1000) {
      var topicButtonSelector = function () {
        return $$('.e2e-test-mobile-back-to-topic');
      };
      var button = (await topicButtonSelector())[0];
      await action.click('Return to topic button', button);
    } else {
      await action.click('Return to topic button', returnToTopicButton);
    }
  };

  this.changeStoryDescription = async function (storyDescription) {
    await waitFor.visibilityOf(
      storyDescriptionField,
      'Story Description Field taking too long to appear.'
    );
    await action.clear('Story Description Field', storyDescriptionField);
    await action.setValue(
      'Story Description Filed',
      storyDescriptionField,
      storyDescription
    );
  };

  this.changeStoryNotes = async function (richTextInstructions) {
    await action.click(
      'Open Story Editor Notes Button',
      openStoryNotesEditorButton
    );
    var storyNotesEditor = await forms.RichTextEditor(notesEditor);
    await storyNotesEditor.clear();
    await richTextInstructions(storyNotesEditor);
    await action.click(
      'Save Story Notes Editor Button',
      saveStoryNotesEditorButton
    );
  };

  this.saveStory = async function (commitMessage) {
    let width = (await browser.getWindowSize()).width;

    if (width < 1000) {
      await action.click('Story Options', saveStoryIcon);
      var buttonSelector = function () {
        return $$('.e2e-test-mobile-save-changes');
      };
      var button = (await buttonSelector())[1];
      await action.click('Save Draft Mobile', button);
    } else {
      await action.click('Save Story Button', saveStoryButton);
    }

    await waitFor.visibilityOf(
      commitMessageField,
      'Commit message modal takes too long to appear.'
    );
    await commitMessageField.setValue(commitMessage);

    await action.click('Close Save Modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Commit message modal takes too long to disappear.'
    );
    await waitFor.pageToFullyLoad();
  };

  this.expectSaveStoryDisabled = async function () {
    await waitFor.visibilityOf(
      saveStoryButton,
      'Save story button taking too long to appear'
    );
    var saveStoryButtonValue = await action.getAttribute(
      'Save Story Button',
      saveStoryButton,
      'disabled'
    );
    return expect(saveStoryButtonValue).toEqual('true');
  };

  this.setChapterExplorationId = async function (explorationId) {
    await waitFor.visibilityOf(
      explorationIdInput,
      'ExplorationIdInput takes too long to be visible'
    );

    await action.setValue(
      'Exploration Id Input',
      explorationIdInput,
      explorationId
    );
    await waitFor.elementToBeClickable(
      explorationIdSaveButton,
      'ExplorationIdSaveButton takes too long to be clickable'
    );
    await action.click('Exploration Id Save button', explorationIdSaveButton);
  };

  this.changeNodeDescription = async function (nodeDescription) {
    // Function scrollToTop is added to prevent nodeDescriptionInputField from
    // being hidden by the navbar.
    await general.scrollToTop();
    await waitFor.visibilityOf(
      nodeDescriptionInputField,
      'NodeDescriptionInputField takes too long to be visible'
    );
    await action.clear('Node Description Input', nodeDescriptionInputField);
    await action.setValue(
      'Node Description Input',
      nodeDescriptionInputField,
      nodeDescription
    );
  };

  this.setNodePlannedPublicationDate = async function (dateString) {
    await waitFor.visibilityOf(
      plannedPublicationDateInput,
      'PlannedPublicationDateInput takes too long to be visible'
    );

    await action.setValue(
      'Planned Publication Date Input',
      plannedPublicationDateInput,
      dateString
    );
  };

  this.setNodeStatusToReadyToPublish = async function () {
    await action.click(
      'Mark As Ready To Publish Button',
      markAsReadyToPublishButton
    );
  };

  this.setNodeStatusToDraft = async function () {
    await action.click('Mark As Draft Button', markAsDraftButton);
  };

  this.publishNodeChanges = async function () {
    await action.click('Publish Changes Button', publishChangesButton);
  };

  this.publishNodes = async function (chapterIndex) {
    await action.select(
      'Publish up to Chapter Dropdown',
      publishUptoChaptersDropdownSelector,
      Number(chapterIndex) + 1
    );
    await action.click('Publish Chapters Button', publishChapterButton);
  };

  this.unpublishNodes = async function (chapterIndex) {
    await action.select(
      'Publish Up to Chapter Dropdown',
      publishUptoChaptersDropdownSelector,
      Number(chapterIndex) + 1
    );
    await action.click('Unpublish Story Button', publishChapterButton);
    await action.click('Close Save Modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Unpublish message modal takes too long to disappear.'
    );
  };

  this.expectNodeDescription = async function (nodeDescription) {
    await waitFor.visibilityOf(
      nodeDescriptionInputField,
      'NodeDescriptionInputField takes too long to be visible'
    );
    let desc = await browser.execute(() => {
      return document.getElementsByClassName(
        'e2e-test-add-chapter-description'
      )[0].value;
    });
    await expect(desc).toMatch(nodeDescription);
  };

  this.expectChapterExplorationIdToBe = async function (id) {
    await waitFor.visibilityOf(
      explorationIdInput,
      'explorationIdInput takes too long to be visible'
    );
    let explorationId = await browser.execute(() => {
      return document.getElementsByClassName('e2e-test-exploration-id-input')[0]
        .value;
    });
    await expect(explorationId).toEqual(id);
  };

  this.changeNodeOutline = async function (richTextInstructions) {
    await waitFor.visibilityOf(
      nodeOutlineEditor,
      'Node outline editor taking too long to appear.'
    );
    var editor = await forms.RichTextEditor(nodeOutlineEditor);
    await editor.clear();
    await richTextInstructions(editor);
    await action.click('Chapter node editor', nodeOutlineEditor);
    await action.click('Node outline save button', nodeOutlineSaveButton);
    await action.click('Finalize outline', nodeOutlineFinalizeCheckbox);
  };

  this.navigateToChapterByIndex = async function (index) {
    // Function scrollToTop is added to prevent chapterTitles from being hidden
    // by the navbar.
    await general.scrollToTop();
    var chapterTitles = await chapterTitlesSelector();
    var chapterTitleButton = chapterTitles[index];
    await action.click('Chapter Title Button', chapterTitleButton);
  };

  this.expectNodeOutlineToMatch = async function (nodeOutline) {
    var nodeOutlineEditorRteContent =
      await nodeOutlineEditorRteContentSelector();
    var outlineEditorRteContentText =
      await nodeOutlineEditorRteContent[0].getText();
    expect(outlineEditorRteContentText).toEqual(nodeOutline);
  };

  this.expectExplorationIdAlreadyExistWarning = async function () {
    var warningText = await action.getText(
      'Exploration Already Present Message',
      explorationAlreadyPresentMsg
    );
    expect(warningText).toEqual(
      'The given exploration already exists in the story.'
    );
  };

  this.getSelectSkillModal = async function () {
    await waitFor.visibilityOf(
      selectSkillModalHeader,
      'selectSkillModalHeader takes too long to be visible.'
    );
    return {
      _searchSkillByName: async function (name) {
        await waitFor.visibilityOf(
          skillNameInputField,
          'skillNameInputField takes too long to be visible'
        );
        await action.setValue(
          'Skill Name Input Field',
          skillNameInputField,
          name
        );
        await action.click('Skill Name Input field', skillNameInputField);
      },

      _selectSkillBasedOnIndex: async function (index) {
        await waitFor.visibilityOf(skillListItem);
        var skillListItems = await skillListItemsSelector();
        var selectedSkill = skillListItems[index];
        await action.click('Selected Skill', selectedSkill);
      },

      selectSkill: async function (name) {
        await this._searchSkillByName(name);
        await this._selectSkillBasedOnIndex(0);
        await waitFor.pageToFullyLoad();
        await action.click('Skill Save Button', skillSaveButton);
      },
    };
  };

  this.addAcquiredSkill = async function (skillName) {
    await action.click('addAcquiredSkillButton', addAcquiredSkillButton);
    var selectSkillModal = await this.getSelectSkillModal();
    await selectSkillModal.selectSkill(skillName);
  };

  this.addPrerequisiteSkill = async function (skillName) {
    await action.click(
      'addPrerequisiteSkillButton',
      addPrerequisiteSkillButton
    );
    var selectSkillModal = await this.getSelectSkillModal();
    await selectSkillModal.selectSkill(skillName);
  };

  this.deleteAcquiredSkillByIndex = async function (index) {
    var deleteAcquiredSkillButton = await deleteAcquiredSkillButtonSelector();
    var deleteButton = deleteAcquiredSkillButton[index];
    await action.click('Delete Acquired Skill Button', deleteButton);
  };

  this.deletePrerequisiteSkillByIndex = async function (index) {
    var deletePrerequisiteSkillButton =
      await deletePrerequisiteSkillButtonSelector();
    var deleteButton = deletePrerequisiteSkillButton[index];
    await action.click('Delete Prerequisite Skill Button', deleteButton);
  };

  this.updateMetaTagContent = async function (newMetaTagContent) {
    await action.setValue(
      'Update Meta Tag Content',
      storyMetaTagContentField,
      newMetaTagContent
    );
    await action.click('Meta Tag Content label', storyMetaTagContentLabel);
  };

  this.expectAcquiredSkillDescriptionCardCount = async function (number) {
    let count = await browser.execute(() => {
      return document.getElementsByClassName(
        'e2e-test-acquired-skill-description-card'
      ).length;
    });
    await expect(count).toEqual(number);
  };

  this.expectPrerequisiteSkillDescriptionCardCount = async function (number) {
    let count = await browser.execute(() => {
      return document.getElementsByClassName(
        'e2e-test-prerequisite-skill-description-card'
      ).length;
    });
    await expect(count).toEqual(number);
  };

  this.expectWarningInIndicator = async function (warning) {
    await waitFor.visibilityOf(
      warningIndicator,
      'Warning Indicator taking too long to appear.'
    );
    await warningIndicator.moveTo();
    await waitFor.visibilityOf(
      warningTextElement,
      'Warning Text Elements taking too long to appear'
    );
    var warningTextElements = await warningTextElementsSelector();
    var warningElemCount = warningTextElements.length;
    var matchFound = false;
    for (var i = 0; i < warningElemCount; i++) {
      var text = await action.getText('Warning Text', warningTextElements[i]);
      if (warning.test(text)) {
        matchFound = true;
        break;
      }
    }
    expect(matchFound).toBe(true);
  };
};

exports.StoryEditorPage = StoryEditorPage;
