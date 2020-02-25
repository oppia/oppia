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

var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var StoryEditorPage = function() {
  var EDITOR_URL_PREFIX = '/story_editor/';
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
  var createInitialChapterButton = element(
    by.css('.protractor-test-create-chapter-button'));
  var newChapterTitleField = element(
    by.css('.protractor-test-new-chapter-title-field'));
  var confirmChapterCreationButton = element(
    by.css('.protractor-test-confirm-chapter-creation-button'));
  var addDestinationChapterButton = element(
    by.css('.protractor-test-add-destination-chapter-button'));
  var deleteDestinationChapterButton = element(
    by.css('.protractor-test-remove-destination-button'));
  var destinationSelect = element(
    by.css('.protractor-test-destination-select'));
  var chapterTitles = element.all(by.css('.protractor-test-chapter-title'));
  var deleteChapterButtons = element.all(
    by.css('.protractor-test-delete-chapter-button'));
  var confirmDeleteChapterButton = element(
    by.css('.protractor-test-confirm-delete-chapter-button'));
  var publishStoryButton = element(
    by.css('.protractor-test-publish-story-button'));
  var unpublishStoryButton = element(
    by.css('.protractor-test-unpublish-story-button'));

  /*
   * CHAPTER
   */
  var initialChapterSelect = element(
    by.css('.protractor-test-initial-chapter-select'));
  var explorationIdInput = element(
    by.css('.protractor-test-exploration-id-input'));
  var explorationIdSaveButton = element(
    by.css('.protractor-test-exploration-id-save-button'));
  var nodeOutlineEditor = element(
    by.css('.protractor-test-add-chapter-outline'));
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
  var disconnectedChapterWarning = element(
    by.css('.protractor-test-disconnected-node-warning'));
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
  this.get = function(storyId) {
    browser.get(EDITOR_URL_PREFIX + storyId);
    return waitFor.pageToFullyLoad();
  };

  this.publishStory = function() {
    publishStoryButton.click();
  };

  this.unpublishStory = function() {
    unpublishStoryButton.click();
  };

  this.deleteChapterWithIndex = function(index) {
    deleteChapterButtons.then(function(elems) {
      elems[index].click();
    });
    confirmDeleteChapterButton.click();
  };

  this.createNewDestinationChapter = function(title) {
    browser.actions().mouseMove(addDestinationChapterButton).perform();
    addDestinationChapterButton.click();
    newChapterTitleField.sendKeys(title);
    confirmChapterCreationButton.click();
    general.scrollToTop();
  };

  this.removeDestination = function() {
    deleteDestinationChapterButton.click();
  };

  this.selectDestinationChapterByName = function(chapterName) {
    var destinationOption = destinationSelect.element(
      by.cssContainingText('option', chapterName));
    destinationOption.click();
  };

  this.expectDestinationToBe = function(chapterName) {
    var pattern = '\s*' + chapterName + '\s*';
    return expect(nextChapterCard.getText()).toMatch(pattern);
  };

  this.expectNumberOfChaptersToBe = function(count) {
    chapterTitles.then(function(items) {
      expect(items.length).toEqual(count);
    });
  };

  this.createInitialChapter = function(title) {
    createInitialChapterButton.click();
    newChapterTitleField.sendKeys(title);
    confirmChapterCreationButton.click();
  };

  this.expectNotesToBe = function(richTextInstructions) {
    forms.expectRichText(storyNotes).toMatch(richTextInstructions);
  };

  this.expectTitleToBe = function(title) {
    expect(storyTitleField.getAttribute('value')).toEqual(title);
  };

  this.expectDescriptionToBe = function(description) {
    expect(storyDescriptionField.getAttribute('value')).toEqual(description);
  };

  this.changeStoryTitle = function(storyTitle) {
    storyTitleField.clear();
    storyTitleField.sendKeys(storyTitle);
  };

  this.returnToTopic = function() {
    returnToTopicButton.click();
    waitFor.pageToFullyLoad();
  };

  this.changeStoryDescription = function(storyDescription) {
    storyDescriptionField.clear();
    storyDescriptionField.sendKeys(storyDescription);
  };

  this.changeStoryNotes = function(richTextInstructions) {
    openStoryNotesEditorButton.click();
    var storyNotesEditor = forms.RichTextEditor(
      notesEditor);
    storyNotesEditor.clear();
    richTextInstructions(storyNotesEditor);
    saveStoryNotesEditorButton.click();
  };

  this.saveStory = function(commitMessage) {
    saveStoryButton.click();
    commitMessageField.sendKeys(commitMessage);

    waitFor.elementToBeClickable(
      closeSaveModalButton,
      'Close save modal button takes too long to be clickable');
    closeSaveModalButton.click();
    waitFor.pageToFullyLoad();
  };

  this.expectSaveStoryDisabled = function() {
    return expect(
      saveStoryButton.getAttribute('disabled')).toEqual('true');
  };

  this.expectDisplayUnreachableChapterWarning = function() {
    return expect(disconnectedChapterWarning.isPresent()).toBe(true);
  };

  this.setChapterExplorationId = function(explorationId) {
    waitFor.visibilityOf(
      explorationIdInput,
      'ExplorationIdInput takes too long to be visible'
    );

    explorationIdInput.sendKeys(explorationId);
    waitFor.elementToBeClickable(
      explorationIdSaveButton,
      'ExplorationIdSaveButton takes too long to be clickable'
    );
    explorationIdSaveButton.click();
  };

  this.changeNodeOutline = function(richTextInstructions) {
    var editor = forms.RichTextEditor(
      nodeOutlineEditor);
    editor.clear();
    richTextInstructions(editor);
    nodeOutlineSaveButton.click();
  };

  this.navigateToChapterByIndex = function(index) {
    chapterTitles.then(function(elements) {
      elements[index].click();
    });
  };

  this.expectExplorationIdAlreadyExistWarningAndCloseIt = function() {
    var warningToast = element(
      by.css('.protractor-test-toast-warning-message'));
    waitFor.visibilityOf(
      warningToast,
      'warningToast takes too long to be visible.');
    expect(warningToast.getText()).toEqual(
      'The given exploration already exists in the story.');
    var closeToastButton = element(
      by.css('.protractor-test-close-toast-warning'));
    waitFor.elementToBeClickable(
      closeToastButton,
      'closeToastButton takes too long to be clickable.');
    closeToastButton.click();
  };

  this.getSelectSkillModal = function() {
    waitFor.visibilityOf(
      selectSkillModalHeader,
      'selectSkillModalHeader takes too long to be visible.');
    return {
      _searchSkillByName: function(name) {
        waitFor.visibilityOf(
          skillNameInputField,
          'skillNameInputField takes too long to be visible');
        skillNameInputField.sendKeys(name);
      },

      _selectSkillBasedOnIndex: function(index) {
        skillListItems.then(function(elements) {
          var selectedSkill = elements[index];
          waitFor.elementToBeClickable(
            selectedSkill,
            'selectedSkill takes too long to be clickable.'
          );
          selectedSkill.click();
        });
      },

      selectSkill: function(name) {
        this._searchSkillByName(name);
        this._selectSkillBasedOnIndex(0);
        waitFor.elementToBeClickable(
          skillSaveButton,
          'doneButton takes too long to be clickable');
        skillSaveButton.click();
      },
    };
  };

  this.addAcquiredSkill = function(skillName) {
    waitFor.visibilityOf(
      addAcquiredSkillButton,
      'addAcquiredSkillButton takes too long to be visible');
    waitFor.elementToBeClickable(
      addAcquiredSkillButton,
      'addAcquiredSkillButton takes too long to be clickable');
    addAcquiredSkillButton.click();
    var selectSkillModal = this.getSelectSkillModal();
    selectSkillModal.selectSkill(skillName);
  };

  this.addPrerequisiteSkill = function(skillName) {
    waitFor.visibilityOf(
      addPrerequisiteSkillButton,
      'addPrerequisitesSkillButton takes too long to be visible');
    waitFor.elementToBeClickable(
      addPrerequisiteSkillButton,
      'addPrerequisitesSkillButton takes too long to be clickable');
    addPrerequisiteSkillButton.click();
    var selectSkillModal = this.getSelectSkillModal();
    selectSkillModal.selectSkill(skillName);
  };

  this.deleteAcquiredSkillByIndex = function(index) {
    deleteAcquiredSkillButton.then(function(elements) {
      var toDelete = elements[index];
      toDelete.click();
    });
  };

  this.deletePrerequisiteSkillByIndex = function(index) {
    deletePrerequisiteSkillButton.then(function(elements) {
      var toDelete = elements[index];
      toDelete.click();
    });
  };

  this.expectAcquiredSkillDescriptionCardCount = function(number) {
    expect(acquiredSkillDescriptionCard.count()).toBe(number);
  };

  this.expectPrerequisiteSkillDescriptionCardCount = function(number) {
    expect(prerequisiteSkillDescriptionCard.count()).toBe(number);
  };

  this.selectInitialChapterByName = function(name) {
    var initialChapterOption = initialChapterSelect.element(
      by.cssContainingText('option', name));
    initialChapterOption.click();
  };

  this.expectWarningInIndicator = function(warning) {
    browser.actions().mouseMove(warningIndicator).perform();
    warningTextElements.then(function(elems) {
      var p = new Promise(function(resolve, reject) {
        elems.forEach(function(elem) {
          elem.getText().then(function(text) {
            if (warning.test(text)) {
              resolve(true);
            }
          });
        });
        reject();
      });
      p.then(function(result) {
        expect(result).toBe(true);
      });
    });
  };
};

exports.StoryEditorPage = StoryEditorPage;
