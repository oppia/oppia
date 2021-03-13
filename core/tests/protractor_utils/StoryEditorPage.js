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
    by.css('.protractor-test-thumbnail-container'));
  var storyTitleField = element(by.css('.protractor-test-story-title-field'));
  var storyDescriptionField = element(
    by.css('.protractor-test-story-description-field'));
  var storyNotes = element(by.css('.protractor-test-story-notes'));
  var notesEditor = element(by.css('.protractor-test-story-notes-rte'));
  var openStoryNotesEditorButton = element(
    by.css('.protractor-test-open-story-notes-editor-button'));
  var saveStoryNotesEditorButton = element(
    by.css('.protractor-test-save-story-notes-button'));
  var returnToTopicButton = element(
    by.css('.protractor-test-return-to-topic-button'));
  var saveStoryButton = element(
    by.css('.protractor-test-save-story-button'));
  var commitMessageField = element(
    by.css('.protractor-test-commit-message-input'));
  var closeSaveModalButton = element(
    by.css('.protractor-test-close-save-modal-button'));
  var createChapterButton = element(
    by.css('.protractor-test-add-chapter-button'));
  var newChapterTitleField = element(
    by.css('.protractor-test-new-chapter-title-field'));
  var newChapterExplorationField = element(
    by.css('.protractor-test-chapter-exploration-input'));
  var confirmChapterCreationButton = element(
    by.css('.protractor-test-confirm-chapter-creation-button'));
  var cancelChapterCreationButton = element(
    by.css('.protractor-test-cancel-chapter-creation-button'));
  var chapterTitles = element.all(by.css('.protractor-test-chapter-title'));
  var deleteChapterButton = element(
    by.css('.protractor-test-delete-chapter-button'));
  var confirmDeleteChapterButton = element(
    by.css('.protractor-test-confirm-delete-chapter-button'));
  var publishStoryButton = element(
    by.css('.protractor-test-publish-story-button'));
  var unpublishStoryButton = element(
    by.css('.protractor-test-unpublish-story-button'));
  var chapterEditOptions = element.all(by.css('.protractor-test-edit-options'));
  var backToStoryEditorButton = element(
    by.css('.protractor-test-back-to-story-editor-button'));
  var storyMetaTagContentField = element(
    by.css('.protractor-test-story-meta-tag-content-field'));
  var storyMetaTagContentLabel = element(
    by.css('.protractor-test-story-meta-tag-content-label'));

  /*
   * CHAPTER
   */
  var explorationIdInput = element(
    by.css('.protractor-test-exploration-id-input'));
  var explorationIdSaveButton = element(
    by.css('.protractor-test-exploration-id-save-button'));
  var nodeDescriptionInputField = element(
    by.css('.protractor-test-add-chapter-description'));
  var nodeOutlineEditor = element(
    by.css('.protractor-test-add-chapter-outline'));
  var nodeOutlineEditorRteContent = element.all(by.css('.oppia-rte'));
  var nodeOutlineFinalizeCheckbox = element(
    by.css('.protractor-test-finalize-outline'));
  var nodeOutlineSaveButton = element(
    by.css('.protractor-test-node-outline-save-button'));
  var addPrerequisiteSkillButton = element(
    by.css('.protractor-test-add-prerequisite-skill'));
  var addAcquiredSkillButton = element(
    by.css('.protractor-test-add-acquired-skill'));
  var selectSkillModalHeader = element(
    by.css('.protractor-test-skill-select-header'));
  var skillNameInputField = element(
    by.css('.protractor-test-skill-name-input'));
  var skillSaveButton = element(
    by.css('.protractor-test-confirm-skill-selection-button'));
  var skillListItems = element.all(
    by.css('.protractor-test-skills-list-item'));
  var deletePrerequisiteSkillButton = element.all(
    by.css('.protractor-test-remove-prerequisite-skill'));
  var deleteAcquiredSkillButton = element.all(
    by.css('.protractor-test-remove-acquired-skill'));
  var prerequisiteSkillDescriptionCard = element.all(
    by.css('.protractor-test-prerequisite-skill-description-card'));
  var acquiredSkillDescriptionCard = element.all(
    by.css('.protractor-test-acquired-skill-description-card'));
  var nextChapterCard = element(by.css('.protractor-test-next-chapter-card'));
  var warningIndicator = element(by.css('.protractor-test-warning-indicator'));
  var warningTextElements = element.all(
    by.css('.protractor-test-warnings-text'));
  var storyThumbnailImageElement = element(
    by.css('.story-thumbnail .protractor-test-custom-photo'));
  var storyThumbnailButton = element(
    by.css('.story-thumbnail .protractor-test-photo-button'));
  var chapterThumbnailImageElement = element(
    by.css('.story-node-thumbnail .protractor-test-custom-photo'));
  var chapterThumbnailButton = element(
    by.css('.story-node-thumbnail .protractor-test-photo-button'));
  var createChapterThumbnailButton = element(
    by.css('.chapter-input-thumbnail .protractor-test-photo-button'));
  var explorationAlreadyPresentMsg = element(
    by.css('.protractor-test-invalid-exp-id'));
  var discardOption = element(by.css('.protractor-test-show-discard-option'));
  var discardChangesButton = element(
    by.css('.protractor-test-discard-story-changes'));

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
    await publishStoryButton.click();
  };

  this.unpublishStory = async function() {
    await unpublishStoryButton.click();
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
    await general.scrollToTop();
    await action.click(
      'Create chapter button takes too long to be clickable.',
      createChapterButton);
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
    for (var i = 0; i < await chapterTitles.count(); i++) {
      if (await chapterTitles.get(i).getText() === chapterName) {
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
      await chapterTitles.first(),
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
    expect(await storyTitleField.getAttribute('value')).toEqual(title);
  };

  this.expectDescriptionToBe = async function(description) {
    expect(await storyDescriptionField.getAttribute('value')).toEqual(
      description);
  };

  this.changeStoryTitle = async function(storyTitle) {
    await storyTitleField.clear();
    await storyTitleField.sendKeys(storyTitle);
  };

  this.returnToTopic = async function() {
    await general.scrollToTop();
    await returnToTopicButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.changeStoryDescription = async function(storyDescription) {
    await storyDescriptionField.clear();
    await storyDescriptionField.sendKeys(storyDescription);
  };

  this.changeStoryNotes = async function(richTextInstructions) {
    await openStoryNotesEditorButton.click();
    var storyNotesEditor = await forms.RichTextEditor(
      notesEditor);
    await storyNotesEditor.clear();
    await richTextInstructions(storyNotesEditor);
    await saveStoryNotesEditorButton.click();
  };

  this.saveStory = async function(commitMessage) {
    await waitFor.elementToBeClickable(
      saveStoryButton,
      'Save story button takes too long to be clickable');
    await saveStoryButton.click();
    await waitFor.visibilityOf(
      commitMessageField,
      'Commit message modal takes too long to appear.');
    await commitMessageField.sendKeys(commitMessage);

    await waitFor.elementToBeClickable(
      closeSaveModalButton,
      'Close save modal button takes too long to be clickable');
    await closeSaveModalButton.click();
    await waitFor.invisibilityOf(
      closeSaveModalButton,
      'Commit message modal takes too long to disappear.');
    await waitFor.pageToFullyLoad();
    // Wait for the "Save Draft" button to be reset.
    await waitFor.textToBePresentInElement(
      saveStoryButton, 'Save Draft', 'Story could not be saved.');
  };

  this.expectSaveStoryDisabled = async function() {
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
      'NodeDescriptionInputField takes too long to be visible'
    );
    await nodeDescriptionInputField.clear();
    await nodeDescriptionInputField.sendKeys(nodeDescription);
  };

  this.expectNodeDescription = async function(nodeDescription) {
    await waitFor.visibilityOf(
      nodeDescriptionInputField,
      'NodeDescriptionInputField takes too long to be visible'
    );
    await expect(await nodeDescriptionInputField.getAttribute('value'))
      .toMatch(nodeDescription);
  };

  this.expectChapterExplorationIdToBe = function(id) {
    expect(explorationIdInput.getAttribute('value')).toEqual(id);
  };

  this.changeNodeOutline = async function(richTextInstructions) {
    var editor = await forms.RichTextEditor(
      nodeOutlineEditor);
    await editor.clear();
    await richTextInstructions(editor);
    await action.click('Chapter node editor', nodeOutlineEditor);
    await nodeOutlineSaveButton.click();
    await action.click('Finalize outline', nodeOutlineFinalizeCheckbox);
  };

  this.navigateToChapterByIndex = async function(index) {
    // Function scrollToTop is added to prevent chapterTitles from being hidden
    // by the navbar.
    await general.scrollToTop();
    var chapterTitleButton = await chapterTitles.get(index);
    await chapterTitleButton.click();
  };

  this.expectNodeOutlineToMatch = function(nodeOutline) {
    expect(
      nodeOutlineEditorRteContent.first().getText()).toEqual(nodeOutline);
  };

  this.expectExplorationIdAlreadyExistWarning = async function() {
    expect(await explorationAlreadyPresentMsg.isDisplayed()).toBe(true);
    expect(
      await explorationAlreadyPresentMsg.getText()).toEqual(
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
      },

      _selectSkillBasedOnIndex: async function(index) {
        var selectedSkill = skillListItems.get(index);
        await waitFor.elementToBeClickable(
          selectedSkill,
          'selectedSkill takes too long to be clickable.'
        );
        await selectedSkill.click();
      },

      selectSkill: async function(name) {
        await this._searchSkillByName(name);
        await this._selectSkillBasedOnIndex(0);
        await waitFor.elementToBeClickable(
          skillSaveButton,
          'doneButton takes too long to be clickable');
        await skillSaveButton.click();
      },
    };
  };

  this.addAcquiredSkill = async function(skillName) {
    await waitFor.visibilityOf(
      addAcquiredSkillButton,
      'addAcquiredSkillButton takes too long to be visible');
    await waitFor.elementToBeClickable(
      addAcquiredSkillButton,
      'addAcquiredSkillButton takes too long to be clickable');
    await addAcquiredSkillButton.click();
    var selectSkillModal = await this.getSelectSkillModal();
    await selectSkillModal.selectSkill(skillName);
  };

  this.addPrerequisiteSkill = async function(skillName) {
    await waitFor.visibilityOf(
      addPrerequisiteSkillButton,
      'addPrerequisitesSkillButton takes too long to be visible');
    await waitFor.elementToBeClickable(
      addPrerequisiteSkillButton,
      'addPrerequisitesSkillButton takes too long to be clickable');
    await addPrerequisiteSkillButton.click();
    var selectSkillModal = await this.getSelectSkillModal();
    await selectSkillModal.selectSkill(skillName);
  };

  this.deleteAcquiredSkillByIndex = async function(index) {
    await deleteAcquiredSkillButton.get(index).click();
  };

  this.deletePrerequisiteSkillByIndex = async function(index) {
    await deletePrerequisiteSkillButton.get(index).click();
  };

  this.updateMetaTagContent = async function(newMetaTagContent) {
    await action.sendKeys(
      'Update Meta Tag Content', storyMetaTagContentField, newMetaTagContent);
    await action.click('Meta Tag Content label', storyMetaTagContentLabel);
  };

  this.expectAcquiredSkillDescriptionCardCount = async function(number) {
    expect(await acquiredSkillDescriptionCard.count()).toBe(number);
  };

  this.expectPrerequisiteSkillDescriptionCardCount = async function(number) {
    expect(await prerequisiteSkillDescriptionCard.count()).toBe(number);
  };

  this.expectWarningInIndicator = async function(warning) {
    await waitFor.visibilityOf(
      warningIndicator, 'Warning Indicator taking too long to appear.');
    await browser.actions().mouseMove(warningIndicator).perform();
    var warningElemCount = await warningTextElements.count();
    var matchFound = false;
    for (var i = 0; i < warningElemCount; i++) {
      var text = await warningTextElements.get(i).getText();
      if (warning.test(text)) {
        matchFound = true;
        break;
      }
    }
    expect(matchFound).toBe(true);
  };
};

exports.StoryEditorPage = StoryEditorPage;
