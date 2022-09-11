// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the exploration editor's translation tab, for
 * use in Protractor tests.
 */

var action = require('./action.js');
var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');
var path = require('path');

var ExplorationEditorTranslationTab = function() {
  var dismissWelcomeModalButton = element(
    by.css('.e2e-test-translation-tab-dismiss-welcome-modal'));
  var translationWelcomeModal = element(
    by.css('.e2e-test-translation-tab-welcome-modal'));
  var buttons = element.all(by.css('.joyride-step__close'));
  var nextTutorialStageButton = element.all(by.css('.joyride-step__next-container'));
  var translationTabStartTutorialElement = element(by.css(
    '.e2e-test-translation-tab-start-tutorial'));
  var titleElement = element(by.css('.e2e-test-joyride-title'));

  this.exitTutorial = async function() {
    // If the translation welcome modal shows up, exit it.
    await action.click(
      'Dismiss Welcome Modal Button', dismissWelcomeModalButton);
    await waitFor.invisibilityOf(
      translationWelcomeModal,
      'Translation welcome modal takes too long to disappear');

    // Otherwise, if the translation tutorial shows up, exit it.
    if (await buttons.count() === 1) {
      await action.click('Skip button', button.get(0));
    } else if (await buttons.count() !== 0) {
      throw new Error(
        'Expected to find at most one \'exit tutorial\' button');
    }
  };

  this.finishTutorial = async function() {
    // Finish the tutorial.
    var finishTutorialButton = element.all(by.buttonText('Finish'));
    var buttons = finishTutorialButton;
    if (await buttons.count() === 1) {
      await action.click('Finish tutorial stage button', buttons.get(0));
    } else {
      throw new Error('There is more than 1 Finish button!');
    }
  };

  this.playTutorial = async function() {
    var tutorialTabHeadings = [
      'Translations In Oppia',
      'Choose Language',
      'Choose a Card to Translate',
      'Choose a Part of the Card to Translate',
      'Recording Audio',
      'Re-record/Re-upload audio'
    ];
    for (const HEADING of tutorialTabHeadings) {
      var tutorialTabHeadingElement = element(by.cssContainingText(
        '.popover-title', HEADING));
      await waitFor.visibilityOf(
        tutorialTabHeadingElement, 'Tutorial: ' + HEADING + ' is not visible');
      // Progress to the next instruction in the tutorial.
      var buttons = nextTutorialStageButton;
      if (await buttons.count() === 1) {
        await action.click('Next tutorial stage button', buttons.get(0));
        await waitFor.invisibilityOf(
          tutorialTabHeadingElement,
          'Tutorial stage takes too long to disappear');
      } else {
        throw new Error('There is more than one Next button!');
      }
    }
  };

  this.startTutorial = async function() {
    await waitFor.visibilityOf(
      translationWelcomeModal,
      'Translation welcome modal takes too long to appear');
    await action.click(
      'Translation tab start tutorial element',
      translationTabStartTutorialElement);
    await waitFor.visibilityOf(
      titleElement, 'Translation tutorial modal takes too long to appear');
  };

  var startRecordButton = element(
    by.css('.e2e-test-accessibility-translation-start-record'));
  var stopRecordButton = element(
    by.css('.e2e-test-stop-record-button'));
  var confirmRecordButton = element(
    by.css('.e2e-test-confirm-record'));
  var playRecordButton = element(
    by.css('.e2e-test-play-pause-audio-button'));
  // Two such elements are in the DOM, but only the second is visible.
  var uploadAudioButton = element.all(
    by.css('.e2e-test-upload-audio-button')).last();
  var audioUploadInput = element(
    by.css('.e2e-test-upload-audio-input'));
  var saveUploadedAudioButton = element(
    by.css('.e2e-test-save-uploaded-audio-button'));
  var deleteRecordButton = element(
    by.css('.e2e-test-delete-record'));
  var confirmDeleteRecordButton = element(
    by.css('.e2e-test-confirm-discard-changes'));
  var contentTabButton = element(
    by.css('.e2e-test-translation-content-tab'));
  var feedbackTabButton = element(
    by.css('.e2e-test-translation-feedback-tab'));
  var hintsTabButton = element(
    by.css('.e2e-test-translation-hints-tab'));
  var solutionTabButton = element(
    by.css('.e2e-test-translation-solution-tab'));
  var contentTabText = element(by.css('.e2e-test-content-text'));
  var solutionTabText = element(by.css('.e2e-test-solution-text'));
  var numericalStatus = element(
    by.css('.e2e-test-translation-numerical-status'));
  var translationTabContentAccessibility = element(
    by.css('.e2e-test-accessibility-translation-content'));
  var translationTabFeedbackAccessibility = element(
    by.css('.e2e-test-accessibility-translation-feedback'));
  var translationTabHintAccessibility = element(
    by.css('.e2e-test-accessibility-translation-hint'));
  var translationTabSolutionAccessibility = element(
    by.css('.e2e-test-accessibility-translation-solution'));
  var translationTabStartRecordingAccessibility = element(
    by.css('.e2e-test-accessibility-translation-start-record'));
  var translationTabUploadRecordingAccessibility = element(
    by.css('.e2e-test-accessibility-translation-upload-audio'));
  var translationTabPlayRecordingAccessibility = element(
    by.css('.e2e-test-accessibility-translation-play-recorded-audio'));
  var selectedLanguageElement = element(
    by.css('.e2e-test-translation-language-selector')).element(
    by.css('option:checked'));
  var languageSelectorElement = element(
    by.css('.e2e-test-translation-language-selector'));
  var languageSelectorLabelElement = element(
    by.css('.e2e-test-language-selector-label'));
  var progressBarLabelElement = element(
    by.css('.e2e-test-progress-info'));
  var translationModeButton = element(
    by.css('.e2e-test-translation-mode'));
  var voiceoverModeButton = element(by.css('.e2e-test-voiceover-mode'));
  var saveTranslationButton = element(
    by.css('.e2e-test-save-translation'));
  var editTranslationButtton = element(
    by.css('.e2e-test-edit-translation'));
  var translationDisplay = element(
    by.css('.e2e-test-translation-display'));
  var stateGraph = element(
    by.css('.e2e-test-translation-graph'));
  var feedbackList = element.all(
    by.css('.e2e-test-translation-feedback'));
  var stateBackgroundNodes = stateGraph.all(
    by.css('.e2e-test-node-background'));
  var stateNodes = stateGraph.all(
    by.css('.e2e-test-node'));
  var audioOverFiveMinutesErrorMessageElement = element(
    by.css('.e2e-test-audio-file-upload-field-error-message'));
  var audioUploadErrorMessageElement = element(by.css(
    '.e2e-test-upload-error-message'));
  var playPauseAudioButton = element(
    by.css('.e2e-test-play-pause-audio-button'));
  var audioMaterialSliderDiv = element(by.css('.mat-slider'));
  var closeAudioUploaderModalButton = element(
    by.css('.e2e-test-close-audio-upload-modal'));
  var audioUploadContainerElement = element(by.css(
    '.e2e-test-audio-upload-container'));
  var nodeLabelLocator = by.css('.e2e-test-node-label');
  var stateTranslationEditorLocator = by.css(
    '.e2e-test-state-translation-editor');
  var activeTranslationTabElement = element(
    by.css('.e2e-test-active-translation-tab'));
  var translationFeedback = function(index) {
    return element(by.css('.e2e-test-feedback-' + index));
  };
  var translationFeedbackText = function(index) {
    return element(by.css('.e2e-test-feedback-' + index + '-text'));
  };
  var translationHint = function(index) {
    return element(by.css('.e2e-test-hint-' + index));
  };
  var translationHintText = function(index) {
    return element(by.css('.e2e-test-hint-' + index + '-text'));
  };
  var _selectLanguage = async function(language) {
    await waitFor.visibilityOf(
      languageSelectorElement,
      'Language selector takes too long to appear.');
    var languageButton = languageSelectorElement.element(
      by.cssContainingText('option', language));
    await action.click('Language button', languageButton);
  };
  var stateNodeLabel = function(nodeElement) {
    return nodeElement.element(nodeLabelLocator);
  };

  this.deleteAudioRecord = async function() {
    await action.click('Delete record button', deleteRecordButton);
    await action.click(
      'Confirm delete record button',
      confirmDeleteRecordButton);
    await waitFor.pageToFullyLoad();
  };

  this.uploadAudioRecord = async function(audioPath) {
    await action.click('Audio Record Button', uploadAudioButton);
    absPath = path.resolve(__dirname, audioPath);
    await action.sendKeys(
      'Audio upload input', audioUploadInput, absPath, false);
  };

  this.saveAudioRecord = async function() {
    await action.click('Save uploaded audio button', saveUploadedAudioButton);
    await waitFor.pageToFullyLoad();
  };

  this.addAudioRecord = async function() {
    await action.click('Start record button', startRecordButton);
    await waitFor.pageToFullyLoad();
  };

  this.stopAudioRecord = async function() {
    await action.click('Stop record button', stopRecordButton);
    await waitFor.pageToFullyLoad();
  };

  this.confirmAudioRecord = async function() {
    await action.click('Confirm record button', confirmRecordButton);
    await waitFor.pageToFullyLoad();
  };

  this.playAudioRecord = async function() {
    await action.click('Play record button', playRecordButton);
    await waitFor.pageToFullyLoad();
  };

  this.uploadAudioFileForLanguage = async function(
      language, relativePathOfAudioToUpload) {
    await this.changeLanguage(language);
    await this.openUploadAudioModal();
    await this.uploadAudio(relativePathOfAudioToUpload);
  };

  this.setTranslation = async function(richTextInstructions) {
    await action.click('Edit translation button', editTranslationButtton);
    var stateTranslationEditorTag = element(
      by.tagName('state-translation-editor'));
    var stateTranslationEditor = stateTranslationEditorTag.element(
      stateTranslationEditorLocator);
    await waitFor.visibilityOf(
      stateTranslationEditor,
      'stateTranslationEditor taking too long to appear to set content');
    var richTextEditor = await forms.RichTextEditor(stateTranslationEditor);
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    await action.click('Save translation button', saveTranslationButton);
    await waitFor.invisibilityOf(
      saveTranslationButton,
      'State translation editor takes too long to disappear');
  };

  this.expectSaveUploadedAudioButtonToBeDisabled = async function() {
    expect(await action.getAttribute(
      'Save uploaded audio button',
      saveUploadedAudioButton,
      'disabled')).toBe('true');
  };

  this.uploadAudio = async function(relativePathOfAudioToUpload) {
    var audioAbsolutePath = path.resolve(
      __dirname, relativePathOfAudioToUpload);
    await action.sendKeys(
      'Audio upload input', audioUploadInput, audioAbsolutePath, false);
    await action.click('Save uploaded audio button', saveUploadedAudioButton);
    await waitFor.invisibilityOf(
      saveUploadedAudioButton,
      'Upload Audio modal takes too long to disappear');
  };

  this.expectWrongFileType = async function(relativePathOfAudioToUpload) {
    var audioAbsolutePath = path.resolve(
      __dirname, relativePathOfAudioToUpload);
    await action.sendKeys(
      'Audio upload input', audioUploadInput, audioAbsolutePath, false);
    // A fake click to trigger onChange event for audioUploadInput.
    await action.click(
      'Audio upload container element',
      audioUploadContainerElement);
    expect(await action.getText(
      'Audio upload error message element',
      audioUploadErrorMessageElement))
      .toContain('This file is not recognized as an audio file.');
  };

  this.expectAudioOverFiveMinutes = async function(
      relativePathOfAudioToUpload) {
    var audioAbsolutePath = path.resolve(
      __dirname, relativePathOfAudioToUpload);
    await action.sendKeys(
      'Audio upload input', audioUploadInput, audioAbsolutePath, false);
    await action.click('Save uploaded audio button', saveUploadedAudioButton);
    await expect(await action.getText(
      'Audio over five minutes error message element',
      audioOverFiveMinutesErrorMessageElement)).toContain(
      'Audio files must be under 300 seconds in length.');
  };

  this.openUploadAudioModal = async function() {
    await action.click('Upload Audio button', uploadAudioButton);
  };

  this.closeUploadAudioModal = async function() {
    await action.click(
      'Close audio uploader modal button',
      closeAudioUploaderModalButton);
  };

  this.playOrPauseAudioFile = async function() {
    await action.click('Play pause audio button', playPauseAudioButton);
    return await this._isAudioPlaying();
  };

  this._isAudioPlaying = async function() {
    var firstValue = await action.getAttribute(
      'Audio progress slider bar',
      audioMaterialSliderDiv,
      'aria-valuenow');
    try {
      await waitFor.elementAttributeToBe(
        audioMaterialSliderDiv, 'aria-valuenow', firstValue + 1,
        'Audio slider is not advancing');
      return true;
    } catch (e) {
      var secondValue = await action.getAttribute(
        'Audio progress slider bar',
        audioMaterialSliderDiv,
        'aria-valuenow');
      if (firstValue && secondValue) {
        return +firstValue < +secondValue;
      }
    }
  };

  this.expectTranslationToMatch = async function(richTextInstructions) {
    await forms.expectRichText(translationDisplay).toMatch(
      richTextInstructions);
  };

  this.switchToVoiceoverMode = async function() {
    await action.click('Voiceover mode button', voiceoverModeButton);
    await waitFor.pageToFullyLoad();
  };

  this.switchToTranslationMode = async function() {
    await action.click('Translation mode button', translationModeButton);
    await waitFor.pageToFullyLoad();
  };

  this.expectToBeInTranslationMode = async function() {
    expect(await action.getText(
      'Language selector label element',
      languageSelectorLabelElement)).toBe('Translations for language:');
    expect(await action.getText(
      'Progress selector label element',
      progressBarLabelElement)).toBe('Exploration translation progress:');
    expect(await action.getAttribute(
      'Translation mode button',
      translationModeButton,
      'class')).toMatch('oppia-active-mode');
    expect(await action.getAttribute(
      'Voiceover mode button',
      voiceoverModeButton,
      'class')).not.toMatch('oppia-active-mode');
  };

  this.expectToBeInVoiceoverMode = async function() {
    expect(await action.getText(
      'Language selector label element',
      languageSelectorLabelElement)).toBe('Voiceovers for language:');
    expect(await action.getText(
      'Progress bar element',
      progressBarLabelElement)).toBe('Exploration voiceover progress:');
    expect(await action.getAttribute(
      'Translation mode button',
      translationModeButton,
      'class')).not.toMatch('oppia-active-mode');
    expect(await action.getAttribute(
      'Voiceover mode button',
      voiceoverModeButton,
      'class')).toMatch('oppia-active-mode');
  };

  this.expectContentTabContentToMatch = async function(content) {
    await action.click('Content tab button', contentTabButton);
    expect(await action.getText(
      'Content tab text',
      contentTabText)).toMatch(content);
  };

  this.expectFeedbackTabContentsToMatch = async function(contents) {
    await action.click('Feedback tab button', feedbackTabButton);
    expect(await feedbackList.count()).toEqual(contents.length);
    for (var index in contents) {
      await action.click(
        `Translation feedback button ${index}`,
        translationFeedback(index));
      expect(await action.getText(
        `Translation feedback button ${index}`,
        translationFeedbackText(index))).toMatch(contents[index]);
    }
  };

  this.expectHintsTabContentsToMatch = async function(contents) {
    await action.click('Hints tab button', hintsTabButton);
    for (var index in contents) {
      await action.click(
        `Translation hint ${index}`,
        translationHint(index));
      expect(await action.getText(
        `Translation hint ${index}`,
        translationHintText(index))).toMatch(contents[index]);
    }
  };

  this.expectSolutionTabContentToMatch = async function(content) {
    await action.click('Solution tab button', solutionTabButton);
    expect(await action.getText(
      'Solution tab button',
      solutionTabText)).toMatch(content);
  };

  this.expectNumericalStatusToMatch = async function(content) {
    expect(await action.getText(
      'Numerical status',
      numericalStatus)).toMatch(content);
  };

  this.expectNumericalStatusAccessibilityToMatch = async function(content) {
    expect(await action.getAttribute(
      'Numerical status element',
      numericalStatus, 'aria-label')).toMatch(content);
  };

  this.expectContentAccessibilityToMatch = async function(content) {
    expect(await action.getAttribute(
      'Translation tab content',
      translationTabContentAccessibility,
      'aria-label')).toMatch(content);
  };

  this.expectFeedbackAccessibilityToMatch = async function(content) {
    expect(await action.getAttribute(
      'Translation tab feedback',
      translationTabFeedbackAccessibility,
      'aria-label')).toMatch(content);
  };

  this.expectHintAccessibilityToMatch = async function(content) {
    expect(await action.getAttribute(
      'Translation tab hint',
      translationTabHintAccessibility,
      'aria-label')).toMatch(content);
  };

  this.expectSolutionAccessibilityToMatch = async function(content) {
    expect(await action.getAttribute(
      'Translation tab solution',
      translationTabSolutionAccessibility,
      'aria-label')).toMatch(content);
  };

  this.expectStartRecordingAccessibilityToMatch = async function(content) {
    expect(await action.getAttribute(
      'Translation tab start recording',
      translationTabStartRecordingAccessibility,
      'aria-label')).toMatch(content);
  };

  this.expectUploadRecordingAccessibilityToMatch = async function(content) {
    expect(await action.getAttribute(
      'Translation tab upload recording',
      translationTabUploadRecordingAccessibility,
      'aria-label')).toMatch(content);
  };

  this.expectPlayRecordingAccessibilityToMatch = async function(content) {
    expect(await action.getAttribute(
      'Translation tab play recording',
      translationTabPlayRecordingAccessibility,
      'aria-label')).toMatch(content);
  };

  this.changeLanguage = async function(language) {
    await _selectLanguage(language);
    await waitFor.pageToFullyLoad();
  };

  this.expectSelectedLanguageToBe = async function(language) {
    expect(await action.getText(
      'Selected language element',
      selectedLanguageElement)).toMatch(language);
  };

  this.navigateToFeedbackTab = async function() {
    await general.scrollToTop();
    await action.click('Feedback tab button', feedbackTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.expectFeedbackTabToBeActive = function() {
    expect(
      feedbackTabButton[0]
    ).toEqual(activeTranslationTabElement[0]);
  };

  this.moveToState = async function(targetName) {
    await general.scrollToTop();
    var listOfNames = await stateNodes.map(async function(stateElement) {
      return await action.getText(
        'State element',
        stateNodeLabel(stateElement));
    });
    var matched = false;
    for (var i = 0; i < listOfNames.length; i++) {
      if (listOfNames[i] === targetName) {
        await action.click(`State node ${i}`, stateNodes.get(i));
        matched = true;
      }
    }
    if (!matched) {
      throw new Error(
        'State ' + targetName + ' not found by editorTranslationTab.' +
        'moveToState.');
    }
  };

  this.expectCorrectStatusColor = async function(stateName, expectedColor) {
    var listOfNames = await stateNodes.map(async function(stateElement) {
      return await action.getText(
        'State Element',
        stateNodeLabel(stateElement));
    });
    var matched = false;
    for (var i = 0; i < listOfNames.length; i++) {
      if (listOfNames[i] === stateName) {
        expect(await stateBackgroundNodes.get(i).getCssValue('fill')).toBe(
          expectedColor);
        matched = true;
      }
    }
    if (!matched) {
      throw new Error(
        'State ' + targetName +
        ' not found by editorTranslationTab.expectCorrectStatusColor.');
    }
  };
};
exports.ExplorationEditorTranslationTab = ExplorationEditorTranslationTab;
