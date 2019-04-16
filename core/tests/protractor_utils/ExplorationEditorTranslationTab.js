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
var general = require('./general.js');
var path = require('path');
var waitFor = require('../protractor_utils/waitFor.js');

var ExplorationEditorTranslationTab = function() {
  var dismissWelcomeModalButton = element(
    by.css('.protractor-test-translation-tab-dismiss-welcome-modal'));
  var translationWelcomeModal = element(
    by.css('.protractor-test-translation-tab-welcome-modal'));

  var saveUploadedAudioButton = element(
    by.css('.protractor-test-save-uploaded-audio-button'));

  this.exitTutorial = function() {
    // If the translation welcome modal shows up, exit it.
    translationWelcomeModal.isPresent().then(function(isVisible) {
      if (isVisible) {
        waitFor.elementToBeClickable(
          dismissWelcomeModalButton,
          'Welcome modal is taking too long to appear');
        dismissWelcomeModalButton.click();
      }
    });

    waitFor.invisibilityOf(
      translationWelcomeModal,
      'Translation welcome modal takes too long to disappear');

    // Otherwise, if the translation tutorial shows up, exit it.
    element.all(by.css('.skipBtn')).then(function(buttons) {
      if (buttons.length === 1) {
        buttons[0].click();
      } else if (buttons.length !== 0) {
        throw 'Expected to find at most one \'exit tutorial\' button';
      }
    });
  };

  this.finishTutorial = function() {
    // Finish the tutorial.
    var finishTutorialButton = element.all(by.buttonText('Finish'));
    waitFor.elementToBeClickable(
      finishTutorialButton.first(),
      'Finish Tutorial Stage button is not clickable');
    finishTutorialButton.then(function(buttons) {
      if (buttons.length === 1) {
        buttons[0].click();
      } else {
        throw Error('There is more than 1 Finish button!');
      }
    });
  };
  this.playTutorial = function() {
    var tutorialTabHeadings = [
      'Translations In Oppia',
      'Choose Language',
      'Choose a Card to Translate',
      'Choose a Part of the Card to Translate',
      'Recording Audio',
      'Re-record/Re-upload audio'
    ];
    tutorialTabHeadings.forEach(function(heading) {
      var tutorialTabHeadingElement = element(by.cssContainingText(
        '.popover-title', heading));
      waitFor.visibilityOf(
        tutorialTabHeadingElement, 'Tutorial: ' + heading + 'is not visible');
      // Progress to the next instruction in the tutorial.
      var nextTutorialStageButton = element.all(by.css('.nextBtn'));
      waitFor.elementToBeClickable(
        nextTutorialStageButton.first(),
        'Next Tutorial Stage button is not clickable');
      nextTutorialStageButton.then(function(buttons) {
        if (buttons.length === 1) {
          buttons[0].click();
          waitFor.invisibilityOf(
            tutorialTabHeadingElement,
            'Tutorial stage takes too long to disappear');
        } else {
          throw Error('There is more than one Next button!');
        }
      });
    });
  };

  this.startTutorial = function() {
    waitFor.visibilityOf(
      translationWelcomeModal,
      'Translation welcome modal takes too long to appear');
    element(by.css('.protractor-test-translation-tab-start-tutorial')).click();
    waitFor.visibilityOf(
      element(by.css('.ng-joyride-title')),
      'Translation tutorial modal takes too long to appear');
  };

  var contentTabButton = element(
    by.css('.protractor-test-translation-content-tab'));
  var feedbackTabButton = element(
    by.css('.protractor-test-translation-feedback-tab'));
  var hintsTabButton = element(
    by.css('.protractor-test-translation-hints-tab'));
  var solutionTabButton = element(
    by.css('.protractor-test-translation-solution-tab'));

  var contentTabText = element(by.css('.protractor-test-content-text'));
  var audioOverFiveMinutesErrorMessageElement = element(by.className(
    'oppia-audio-file-upload-field-error-message'));
  var uploadAudioButton = element.all(
    by.className('protractor-test-upload-audio-button')).last();

  var feedbackList = element.all(
    by.css('li.protractor-test-translation-feedback'));
  var translationFeedback = function(index) {
    return element(by.css('.protractor-test-feedback-' + index));
  };
  var translationFeedbackText = function(index) {
    return element(by.css('.protractor-test-feedback-' + index + '-text'));
  };

  var hintsList = element.all(
    by.css('li.protractor-test-translation-hint'));
  var translationHint = function(index) {
    return element(by.css('.protractor-test-hint-' + index));
  };
  var translationHintText = function(index) {
    return element(by.css('.protractor-test-hint-' + index + '-text'));
  };

  var solutionTabText = element(by.css('.protractor-test-solution-text'));

  var numericalStatus = element(
    by.css('.protractor-test-translation-numerical-status'));

  var translationTabContentAccessibility = element(
    by.css('.protractor-test-accessibility-translation-content'));
  var translationTabFeedbackAccessibility = element(
    by.css('.protractor-test-accessibility-translation-feedback'));

  var translationTabHintAccessibility = element(
    by.css('.protractor-test-accessibility-translation-hint'));

  var translationTabSolutionAccessibility = element(
    by.css('.protractor-test-accessibility-translation-solution'));

  var translationTabStartRecordingAccessibility = element(
    by.css('.protractor-test-accessibility-translation-start-record'));

  var translationTabUploadRecordingAccessibility = element(
    by.css('.protractor-test-accessibility-translation-upload-audio'));

  var translationTabPlayRecordingAccessibility = element(
    by.css('.protractor-test-accessibility-translation-play-recorded-audio'));

  var _selectLanguage = function(language) {
    element(by.css('.protractor-test-translation-language-selector')).
      element(by.cssContainingText('option', language)).click();
  };

  var audioUploadInputElem = element(by.className(
    'protractor-test-upload-audio'));
  var translationGraph = element(by.css('.protractor-test-translation-graph'));
  var stateBackgroundNodes = translationGraph.all(by.css(
    '.protractor-test-node-background'));
  var stateNodes = translationGraph.all(by.css('.protractor-test-node'));
  var stateNodeLabel = function(nodeElement) {
    return nodeElement.element(by.css('.protractor-test-node-label'));
  };

  this.expectSaveUploadedAudioButtonToBeDisabled = function() {
    expect(saveUploadedAudioButton.getAttribute('disabled')).toBe('true');
  };


  this.uploadAudio = function(relativePathOfAudioToUpload) {
    var audioAbsolutePath = path.resolve(
      __dirname, relativePathOfAudioToUpload);
    audioUploadInputElem.sendKeys(audioAbsolutePath);
    waitFor.elementToBeClickable(
      saveUploadedAudioButton, 'Save button is not clickable');
    saveUploadedAudioButton.click();
    waitFor.invisibilityOf(saveUploadedAudioButton,
      'Upload Audio modal takes too long to disappear');
  };

  this.expectWrongFileType = function(relativePathOfAudioToUpload) {
    var audioAbsolutePath = path.resolve(
      __dirname, relativePathOfAudioToUpload);
    audioUploadInputElem.sendKeys(audioAbsolutePath);
    expect(element(by.css('div.error-message')).getText())
      .toContain('This file is not recognized as an audio file.');
  };

  this.expectAudioOverFiveMinutes = function(relativePathOfAudioToUpload) {
    var audioAbsolutePath = path.resolve(
      __dirname, relativePathOfAudioToUpload);
    audioUploadInputElem.sendKeys(audioAbsolutePath);
    waitFor.elementToBeClickable(
      saveUploadedAudioButton, 'Save button is not clickable');
    saveUploadedAudioButton.click();
    waitFor.visibilityOf(audioOverFiveMinutesErrorMessageElement,
      'Error element is not visible');
    expect(audioOverFiveMinutesErrorMessageElement.getText()).toContain(
      'Audio files must be under 300 seconds in length.');
  };

  this.expectContentTabContentToMatch = function(content) {
    waitFor.elementToBeClickable(
      contentTabButton, 'Content Tab button is not clickable');
    contentTabButton.click();
    expect(contentTabText.getText()).toMatch(content);
  };

  this.expectFeedbackTabContentsToMatch = function(contents) {
    waitFor.elementToBeClickable(
      feedbackTabButton, 'Feedback Tab button is not clickable');
    feedbackTabButton.click();
    expect(feedbackList.count()).toEqual(contents.length);
    for (var index in contents) {
      translationFeedback(index).click();
      expect(translationFeedbackText(index).getText()).toMatch(contents[index]);
    }
  };

  this.expectHintsTabContentsToMatch = function(contents) {
    waitFor.elementToBeClickable(
      hintsTabButton, 'Hints Tab button is not clickable');
    hintsTabButton.click();
    for (var index in contents) {
      translationHint(index).click();
      expect(translationHintText(index).getText()).toMatch(contents[index]);
    }
  };

  this.expectSolutionTabContentToMatch = function(content) {
    waitFor.elementToBeClickable(
      solutionTabButton, 'Solution Tab button is not clickable');
    solutionTabButton.click();
    expect(solutionTabText.getText()).toMatch(content);
  };

  this.expectNumericalStatusToMatch = function(content) {
    expect(numericalStatus.getText()).toMatch(content);
  };

  this.expectNumericalStatusAccessibilityToMatch = function(content) {
    expect(numericalStatus.getAttribute('aria-label')).toMatch(content);
  };

  this.expectContentAccessibilityToMatch = function(content) {
    expect(translationTabContentAccessibility.getAttribute(
      'aria-label')).toMatch(content);
  };

  this.expectFeedbackAccessibilityToMatch = function(content) {
    expect(translationTabFeedbackAccessibility.getAttribute(
      'aria-label')).toMatch(content);
  };

  this.expectHintAccessibilityToMatch = function(content) {
    expect(translationTabHintAccessibility.getAttribute(
      'aria-label')).toMatch(content);
  };

  this.expectSolutionAccessibilityToMatch = function(content) {
    expect(translationTabSolutionAccessibility.getAttribute(
      'aria-label')).toMatch(content);
  };

  this.expectStartRecordingAccessibilityToMatch = function(content) {
    expect(translationTabStartRecordingAccessibility.getAttribute(
      'aria-label')).toMatch(content);
  };

  this.expectUploadRecordingAccessibilityToMatch = function(content) {
    expect(translationTabUploadRecordingAccessibility.getAttribute(
      'aria-label')).toMatch(content);
  };

  this.expectPlayRecordingAccessibilityToMatch = function(content) {
    expect(translationTabPlayRecordingAccessibility.getAttribute(
      'aria-label')).toMatch(content);
  };

  this.changeTranslationLanguage = function(language) {
    _selectLanguage(language);
    waitFor.pageToFullyLoad();
  };

  this.navigateToFeedbackTab = function() {
    waitFor.elementToBeClickable(
      feedbackTabButton,
      'Feedback tab of translation page is not clickable');
    feedbackTabButton.click();
    waitFor.pageToFullyLoad();
  };

  this.expectFeedbackTabToBeActive = function() {
    expect(element(by.css('.protractor-test-translation-feedback-tab'))[0]
    ).toEqual(element(by.css('.oppia-active-translation-tab'))[0]);
  };

  this.openUploadAudioModal = function() {
    waitFor.elementToBeClickable(
      uploadAudioButton, 'Upload Audio button is not clickable');
    uploadAudioButton.click();
  };


  // NOTE: if the state is not visible in the state graph this function will
  // fail.
  this.moveToState = function(targetName) {
    general.scrollToTop();
    stateNodes.map(function(stateElement) {
      return stateNodeLabel(stateElement).getText();
    }).then(function(listOfNames) {
      var matched = false;
      for (var i = 0; i < listOfNames.length; i++) {
        if (listOfNames[i] === targetName) {
          stateNodes.get(i).click();
          matched = true;
        }
      }
      if (!matched) {
        throw Error(
          'State ' + targetName + ' not found by editorTranslationTab.' +
          'moveToState.');
      }
    });
  };

  this.expectCorrectStatusColor = function(stateName, expectedColor) {
    stateNodes.map(function(stateElement) {
      return stateNodeLabel(stateElement).getText();
    }).then(function(listOfNames) {
      var matched = false;
      for (var i = 0; i < listOfNames.length; i++) {
        if (listOfNames[i] === stateName) {
          expect(stateBackgroundNodes.get(i).getCssValue('fill')).toBe(
            expectedColor);
          matched = true;
        }
      }
      if (!matched) {
        throw Error(
          'State ' + targetName +
          ' not found by editorTranslationTab.expectCorrectStatusColor.');
      }
    });
  };
};
exports.ExplorationEditorTranslationTab = ExplorationEditorTranslationTab;
