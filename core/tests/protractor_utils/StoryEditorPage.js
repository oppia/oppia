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

var action = require('../protractor_utils/action.js');
var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var StoryEditorPage = function() {
  var EDITOR_URL_PREFIX = '/story_editor/';
  var thumbnailContainer = element(
    by.css('.e2e-test-thumbnail-container'));
  var storyTitleField = element(by.css('.e2e-test-story-title-field'));
  var storyDescriptionField = element(
    by.css('.e2e-test-story-description-field'));
  var storyNotes = element(by.css('.e2e-test-story-notes'));
  var notesEditor = element(by.css('.e2e-test-story-notes-rte'));
  var openStoryNotesEditorButton = element(
    by.css('.e2e-test-open-story-notes-editor-button'));
  var saveStoryNotesEditorButton = element(
    by.css('.e2e-test-save-story-notes-button'));
  var returnToTopicButton = element(
    by.css('.e2e-test-return-to-topic-button'));
  var saveStoryButton = element(
    by.css('.e2e-test-save-story-button'));
  var commitMessageField = element(
    by.css('.e2e-test-commit-message-input'));
  var closeSaveModalButton = element(
    by.css('.e2e-test-close-save-modal-button'));
  var createChapterButton = element(
    by.css('.e2e-test-add-chapter-button'));
  var newChapterTitleField = element(
    by.css('.e2e-test-new-chapter-title-field'));
  var newChapterExplorationField = element(
    by.css('.e2e-test-chapter-exploration-input'));
  var confirmChapterCreationButton = element(
    by.css('.e2e-test-confirm-chapter-creation-button'));
  var cancelChapterCreationButton = element(
    by.css('.e2e-test-cancel-chapter-creation-button'));
  var chapterTitles = element.all(by.css('.e2e-test-chapter-title'));
  var deleteChapterButton = element(
    by.css('.e2e-test-delete-chapter-button'));
  var confirmDeleteChapterButton = element(
    by.css('.e2e-test-confirm-delete-chapter-button'));
  var publishStoryButton = element(
    by.css('.e2e-test-publish-story-button'));
  var unpublishStoryButton = element(
    by.css('.e2e-test-unpublish-story-button'));
  var chapterEditOptions = element.all(by.css('.e2e-test-edit-options'));
  var backToStoryEditorButton = element(
    by.css('.e2e-test-back-to-story-editor-button'));
  var storyMetaTagContentField = element(
    by.css('.e2e-test-story-meta-tag-content-field'));
  var storyMetaTagContentLabel = element(
    by.css('.e2e-test-story-meta-tag-content-label'));
  var addChapterDropdown = element(
    by.css('.e2e-test-mobile-add-chapter'));
  var navigateToOptionsMobile = element(
    by.css('.e2e-test-mobile-options-base'));
  var saveButtonMobile = element.all(
    by.css('.e2e-test-save-changes-for-small-screens'));
  var changesOptions = element.all(
    by.css('.e2e-test-mobile-changes-dropdown'));
  var publishButtonMobile = element(
    by.css('.e2e-test-mobile-publish-button'));
  /*
   * CHAPTER
   */
  var explorationIdInput = element(
    by.css('.e2e-test-exploration-id-input'));
  var explorationIdSaveButton = element(
    by.css('.e2e-test-exploration-id-save-button'));
  var nodeDescriptionInputField = element(
    by.css('.e2e-test-add-chapter-description'));
  var nodeOutlineEditor = element(
    by.css('.e2e-test-add-chapter-outline'));
  var nodeOutlineEditorRteContent = element.all(by.css('.e2e-test-rte'));
  var nodeOutlineFinalizeCheckbox = element(
    by.css('.e2e-test-finalize-outline'));
  var nodeOutlineSaveButton = element(
    by.css('.e2e-test-node-outline-save-button'));
  var addPrerequisiteSkillButton = element(
    by.css('.e2e-test-add-prerequisite-skill'));
  var addAcquiredSkillButton = element(
    by.css('.e2e-test-add-acquired-skill'));
  var selectSkillModalHeader = element(
    by.css('.e2e-test-skill-select-header'));
  var skillNameInputField = element(
    by.css('.e2e-test-skill-name-input'));
  var skillSaveButton = element(
    by.css('.e2e-test-confirm-skill-selection-button'));
  var skillListItems = element.all(
    by.css('.e2e-test-skills-list-item'));
  var deletePrerequisiteSkillButton = element.all(
    by.css('.e2e-test-remove-prerequisite-skill'));
  var deleteAcquiredSkillButton = element.all(
    by.css('.e2e-test-remove-acquired-skill'));
  var nextChapterCard = element(by.css('.e2e-test-next-chapter-card'));
  var warningIndicator = element(by.css('.e2e-test-warning-indicator'));
  var warningTextElements = element.all(
    by.css('.e2e-test-warnings-text'));
  var storyThumbnailImageElement = element(
    by.css('.e2e-test-story-thumbnail .e2e-test-custom-photo'));
  var storyThumbnailButton = element(
    by.css('.e2e-test-story-thumbnail .e2e-test-photo-button'));
  var chapterThumbnailImageElement = element(
    by.css(
      '.e2e-test-story-node-thumbnail .e2e-test-custom-photo'));
  var chapterThumbnailButton = element(
    by.css(
      '.e2e-test-story-node-thumbnail .e2e-test-photo-button'));
  var createChapterThumbnailButton = element(
    by.css(
      '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button')
  );
  var explorationAlreadyPresentMsg = element(
    by.css('.e2e-test-invalid-exp-id'));
  var discardOption = element(by.css('.e2e-test-show-discard-option'));
  var discardChangesButton = element(
    by.css('.e2e-test-discard-story-changes'));

  this.get = async function(storyId) {
    await browser.get(EDITOR_URL_PREFIX + storyId);
    await waitFor.pageToFullyLoad();
  };

  this.getStoryThumbnailSource = async function() {
    return await workflow.getImageSource(storyThumbnailImageElement);
  };

  this.getChapterThumbnailSource = async function() {
    return await workflow.getImageSource(chapterThumbnailImageElement);
  };

  this.submitStoryThumbnail = async function(imgPath, resetExistingImage) {
    return await workflow.submitImage(
      storyThumbnailButton, thumbnailContainer, imgPath, resetExistingImage);
  };

  this.submitChapterThumbnail = async function(imgPath, resetExistingImage) {
    return await workflow.submitImage(
      chapterThumbnailButton, thumbnailContainer, imgPath, resetExistingImage);
  };

  this.publishStory = async function() {
    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      if (changesOptions.count() === 0) {
        await action.click(
          'Settings tab button', navigateToSettingsTabButtonMobile, true);
      }
      await action.click('Changes options', changesOptions.first(), true);
      await publishButtonMobile.isDisplayed();
      await action.click('Publish button mobile', publishButtonMobile, true);
    } else {
      await action.click('Publish Story Button', publishStoryButton);
    }
  };

  this.unpublishStory = async function() {
    await action.click('Unpublish Story Button', unpublishStoryButton);
    await action.click('Close Save Modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Unpublish message modal takes too long to disappear.');
  };

  this.deleteChapterWithIndex = async function(index) {
    await waitFor.visibilityOf(
      chapterEditOptions.first(),
      'Chapter list taking too long to appear.');
    await action.click('Chapter edit options', chapterEditOptions.get(index));
    await action.click('Delete chapter button', deleteChapterButton);
    await confirmDeleteChapterButton.click();
  };

  this.createNewChapter = async function(title, explorationId, imgPath) {
    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      await action.click('Chapter dropdown', addChapterDropdown, true);
      await action.click(
        'Create chapter button takes too long to be clickable.',
        createChapterButton, true);
    } else {
      await general.scrollToTop();
      await action.click(
        'Create chapter button takes too long to be clickable.',
        createChapterButton);
    }
    await action.sendKeys(
      'New chapter title field', newChapterTitleField, title);
    await action.sendKeys(
      'New chapter exploration ID', newChapterExplorationField, explorationId);
    await workflow.submitImage(
      createChapterThumbnailButton, thumbnailContainer, imgPath, false);
    await action.click(
      'Confirm chapter creation button', confirmChapterCreationButton);
    await general.scrollToTop();
  };

  this.cancelChapterCreation = async function() {
    await action.click(
      'Cancel chapter creation button', cancelChapterCreationButton);
  };

  this.discardStoryChanges = async function() {
    await action.click('Show discard option button', discardOption);
    await action.click('Discard changes button', discardChangesButton);
  };

  this.navigateToChapterWithName = async function(chapterName) {
    await waitFor.visibilityOf(
      chapterTitles.first(), 'Chapter list taking too long to appear');
    var chapterIndex = -1;
    var chapterText = '';
    for (var i = 0; i < await chapterTitles.count(); i++) {
      chapterText = await action.getText(
        'Chapter Title Element', chapterTitles.get(i));
      if (chapterText === chapterName) {
        chapterIndex = i;
        break;
      }
    }
    expect(chapterIndex).not.toEqual(-1);

    await action.click('Chapter list item', chapterTitles.get(i));
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      nodeOutlineEditor, 'Chapter editor is taking too long to appear.');
    await general.scrollToTop();
  };

  this.navigateToStoryEditorTab = async function() {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      backToStoryEditorButton, 'Back to story button is not visible');
    await general.scrollToTop();
    await action.click('Back to story editor tab', backToStoryEditorButton);
  };

  this.expectChaptersListToBe = async function(chapters) {
    await this.expectNumberOfChaptersToBe(chapters.length);
    for (var i = 0; i < chapters.length; i++) {
      expect(await chapterTitles.get(i).getText()).toEqual(chapters[i]);
    }
  };

  this.dragChapterToAnotherChapter = (async function(chapter1, chapter2) {
    await waitFor.visibilityOf(
      chapterTitles.first(),
      'Chapter titles taking too long to appear.');
    var matchFound = false;
    for (var i = 0; i < await chapterTitles.count(); i++) {
      if (await chapterTitles.get(i).getText() === chapter1) {
        matchFound = true;
        break;
      }
    }
    expect(matchFound).toBe(true);
    var toMove = chapterTitles.get(i);

    matchFound = false;
    for (var i = 0; i < await chapterTitles.count(); i++) {
      if (await chapterTitles.get(i).getText() === chapter2) {
        matchFound = true;
        break;
      }
    }
    expect(matchFound).toBe(true);
    var target = chapterTitles.get(i);
    await general.dragAndDrop(toMove, target);
  });

  this.expectDestinationToBe = async function(chapterName) {
    var pattern = '\s*' + chapterName + '\s*';
    return expect(await nextChapterCard.getText()).toMatch(pattern);
  };

  this.expectNumberOfChaptersToBe = async function(count) {
    expect(await chapterTitles.count()).toEqual(count);
  };

  this.expectNotesToBe = async function(richTextInstructions) {
    await forms.expectRichText(storyNotes).toMatch(richTextInstructions);
  };

  this.expectTitleToBe = async function(title) {
    await waitFor.presenceOf(
      storyTitleField, 'Story Title Field takes too long to appear');
    expect(await storyTitleField.getAttribute('value')).toEqual(title);
  };

  this.expectDescriptionToBe = async function(description) {
    await waitFor.presenceOf(
      storyDescriptionField,
      'Story Description Field takes too long to appear');
    expect(await storyDescriptionField.getAttribute('value')).toEqual(
      description);
  };

  this.changeStoryTitle = async function(storyTitle) {
    await waitFor.visibilityOf(
      storyTitleField, 'Story Title Field taking too long to appear.');
    await storyTitleField.clear();
    await storyTitleField.sendKeys(storyTitle);
  };

  this.returnToTopic = async function() {
    await general.scrollToTop();
    await action.click('Return to topic button', returnToTopicButton);
    await waitFor.pageToFullyLoad();
  };

  this.changeStoryDescription = async function(storyDescription) {
    await waitFor.visibilityOf(
      storyDescriptionField,
      'Story Description Field taking too long to appear.');
    await storyDescriptionField.clear();
    await storyDescriptionField.sendKeys(storyDescription);
  };

  this.changeStoryNotes = async function(richTextInstructions) {
    await action.click(
      'Open Story Editor Notes Button', openStoryNotesEditorButton);
    var storyNotesEditor = await forms.RichTextEditor(
      notesEditor);
    await storyNotesEditor.clear();
    await richTextInstructions(storyNotesEditor);
    await action.click(
      'Save Story Notes Editor Button', saveStoryNotesEditorButton);
  };

  this.saveStory = async function(commitMessage) {
    let width = (await browser.manage().window().getSize()).width;
    if (width < 831) {
      if (await saveButtonMobile.count() === 0) {
        await action.click(
          'Settings tab button', navigateToOptionsMobile);
      }
      await waitFor.visibilityOf(
        saveButtonMobile, 'Save draft button takes too long to appear.');
      await action.click('Save draft', saveButtonMobile.first());
    } else {
      await action.click('Save Story Button', saveStoryButton);
    }

    await waitFor.visibilityOf(
      commitMessageField, 'Commit message modal takes too long to appear.');
    await commitMessageField.sendKeys(commitMessage);

    await action.click('Close Save Modal button', closeSaveModalButton);
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Commit message modal takes too long to disappear.');
    await waitFor.pageToFullyLoad();
    // Wait for the "Save Draft" button to be reset.
    await waitFor.visibilityOf(
      saveStoryButton, 'Save Story Button taking too long to appear.');
    await waitFor.textToBePresentInElement(
      saveStoryButton, 'Save Draft', 'Story could not be saved.');
  };

  this.expectSaveStoryDisabled = async function() {
    await waitFor.visibilityOf(
      saveStoryButton, 'Save story button taking too long to appear');
    return expect(
      await saveStoryButton.getAttribute('disabled')).toEqual('true');
  };

  this.setChapterExplorationId = async function(explorationId) {
    await waitFor.visibilityOf(
      explorationIdInput,
      'ExplorationIdInput takes too long to be visible'
    );

    await explorationIdInput.sendKeys(explorationId);
    await waitFor.elementToBeClickable(
      explorationIdSaveButton,
      'ExplorationIdSaveButton takes too long to be clickable'
    );
    await explorationIdSaveButton.click();
  };

  this.changeNodeDescription = async function(nodeDescription) {
    // Function scrollToTop is added to prevent nodeDescriptionInputField from
    // being hidden by the navbar.
    await general.scrollToTop();
    await waitFor.visibilityOf(
      nodeDescriptionInputField,
      'NodeDescriptionInputField takes too long to be visible');
    await nodeDescriptionInputField.clear();
    await nodeDescriptionInputField.sendKeys(nodeDescription);
  };

  this.expectNodeDescription = async function(nodeDescription) {
    await waitFor.visibilityOf(
      nodeDescriptionInputField,
      'NodeDescriptionInputField takes too long to be visible'
    );
    let desc = await browser.executeScript(() => {
      return document.getElementsByClassName(
        'e2e-test-add-chapter-description')[0].value;
    });
    await expect(desc).toMatch(nodeDescription);
  };

  this.expectChapterExplorationIdToBe = async function(id) {
    await waitFor.visibilityOf(
      explorationIdInput,
      'explorationIdInput takes too long to be visible'
    );
    let explorationId = await browser.executeScript(() => {
      return document.getElementsByClassName(
        'e2e-test-exploration-id-input')[0].value;
    });
    await expect(explorationId).toEqual(id);
  };

  this.changeNodeOutline = async function(richTextInstructions) {
    await waitFor.visibilityOf(
      nodeOutlineEditor, 'Node outline editor taking too long to appear.');
    var editor = await forms.RichTextEditor(
      nodeOutlineEditor);
    await editor.clear();
    await richTextInstructions(editor);
    await action.click('Chapter node editor', nodeOutlineEditor);
    await action.click('Node outline save button', nodeOutlineSaveButton);
    await action.click('Finalize outline', nodeOutlineFinalizeCheckbox);
  };

  this.navigateToChapterByIndex = async function(index) {
    // Function scrollToTop is added to prevent chapterTitles from being hidden
    // by the navbar.
    await general.scrollToTop();
    var chapterTitleButton = chapterTitles.get(index);
    await chapterTitleButton.click();
  };

  this.expectNodeOutlineToMatch = function(nodeOutline) {
    expect(
      nodeOutlineEditorRteContent.first().getText()).toEqual(nodeOutline);
  };

  this.expectExplorationIdAlreadyExistWarning = async function() {
    var warningText = await action.getText(
      'Exploration Already Present Message', explorationAlreadyPresentMsg);
    expect(warningText).toEqual(
      'The given exploration already exists in the story.');
  };

  this.getSelectSkillModal = async function() {
    await waitFor.visibilityOf(
      selectSkillModalHeader,
      'selectSkillModalHeader takes too long to be visible.');
    return {
      _searchSkillByName: async function(name) {
        await waitFor.visibilityOf(
          skillNameInputField,
          'skillNameInputField takes too long to be visible');
        await skillNameInputField.sendKeys(name);
        await action.click('Skill Name Input field', skillNameInputField);
      },

      _selectSkillBasedOnIndex: async function(index) {
        await waitFor.visibilityOf(skillListItems.get(0));
        var selectedSkill = skillListItems.get(index);
        await action.click('Selected Skill', selectedSkill);
      },

      selectSkill: async function(name) {
        await this._searchSkillByName(name);
        await this._selectSkillBasedOnIndex(0);
        await waitFor.pageToFullyLoad();
        await action.click('Skill Save Button', skillSaveButton);
      },
    };
  };

  this.addAcquiredSkill = async function(skillName) {
    await action.click(
      'addAcquiredSkillButton', addAcquiredSkillButton);
    var selectSkillModal = await this.getSelectSkillModal();
    await selectSkillModal.selectSkill(skillName);
  };

  this.addPrerequisiteSkill = async function(skillName) {
    await action.click(
      'addPrerequisiteSkillButton', addPrerequisiteSkillButton);
    var selectSkillModal = await this.getSelectSkillModal();
    await selectSkillModal.selectSkill(skillName);
  };

  this.deleteAcquiredSkillByIndex = async function(index) {
    var deleteButton = deleteAcquiredSkillButton.get(index);
    await action.click('Delete Acquired Skill Button', deleteButton);
  };

  this.deletePrerequisiteSkillByIndex = async function(index) {
    var deleteButton = deletePrerequisiteSkillButton.get(index);
    await action.click('Delete Prerequisite Skill Button', deleteButton);
  };

  this.updateMetaTagContent = async function(newMetaTagContent) {
    await action.sendKeys(
      'Update Meta Tag Content', storyMetaTagContentField, newMetaTagContent);
    await action.click('Meta Tag Content label', storyMetaTagContentLabel);
  };

  this.expectAcquiredSkillDescriptionCardCount = async function(number) {
    let count = await browser.executeScript(() => {
      return document.getElementsByClassName(
        'e2e-test-acquired-skill-description-card').length;
    });
    await expect(count).toEqual(number);
  };

  this.expectPrerequisiteSkillDescriptionCardCount = async function(number) {
    let count = await browser.executeScript(() => {
      return document.getElementsByClassName(
        'e2e-test-prerequisite-skill-description-card').length;
    });
    await expect(count).toEqual(number);
  };

  this.expectWarningInIndicator = async function(warning) {
    await waitFor.visibilityOf(
      warningIndicator, 'Warning Indicator taking too long to appear.');
    await browser.actions().mouseMove(warningIndicator).perform();
    await waitFor.visibilityOf(
      warningTextElements.first(),
      'Warning Text Elements taking too long to appear');
    var warningElemCount = await warningTextElements.count();
    var matchFound = false;
    for (var i = 0; i < warningElemCount; i++) {
      var text = await action.getText(
        'Warning Text', warningTextElements.get(i));
      if (warning.test(text)) {
        matchFound = true;
        break;
      }
    }
    expect(matchFound).toBe(true);
  };
};

exports.StoryEditorPage = StoryEditorPage;
