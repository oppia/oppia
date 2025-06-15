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
 * @fileoverview Page object for the exploration player, for use in WebdriverIO
 * tests.
 */

var forms = require('./forms.js');
var waitFor = require('./waitFor.js');
var action = require('./action.js');
var interactions = require('../../../extensions/interactions/webdriverio.js');

var ExplorationPlayerPage = function () {
  var audioBarExpandButton = $('.e2e-test-audio-bar');
  var cancelRedirectionButton = $('.e2e-test-cancel-redirection-button');
  var correctFeedbackElement = $('.e2e-test-correct-feedback');
  var confirmRedirectionButton = $('.e2e-test-confirm-redirection-button');
  var continueToSolutionButton = $('.e2e-test-continue-to-solution-btn');
  var conversationFeedback = $('.e2e-test-conversation-feedback-latest');
  var conversationSkinCardsContainer = $(
    '.e2e-test-conversation-skin-cards-container'
  );
  var conversationInput = $('.e2e-test-conversation-input');
  var conversationContent = $('.e2e-test-conversation-content');
  var conversationContentsSelector = function () {
    return $$('.e2e-test-conversation-content');
  };
  var explorationHeader = $('.e2e-test-exploration-header');
  var explorationInfoIcon = $('.e2e-test-exploration-info-icon');
  var feedbackCloseButton = $('.e2e-test-exploration-feedback-close-button');
  var feedbackPopupLink = $('.e2e-test-exploration-feedback-popup-link');
  var feedbackSubmitButton = $('.e2e-test-exploration-feedback-submit-btn');
  var feedbackTextArea = $('.e2e-test-exploration-feedback-textarea');
  var flaggedSuccessElement = $(
    '.e2e-test-exploration-flagged-success-message'
  );
  var congratulatorycheckpointMessage = $(
    '.e2e-test-congratulatory-checkpoint-message-box'
  );
  var lessonInfoModalCheckpointMessage = $(
    '.e2e-test-lesson-info-modal-checkpoint-message'
  );
  var lessonInfoModalCloseButton = $(
    '.e2e-test-close-lesson-info-modal-button'
  );
  var lessonInfoTooltip = $('.e2e-test-close-lesson-info-tooltip');
  var gotItButton = $('.e2e-test-learner-got-it-button');
  var infoCardRating = $('.e2e-test-info-card-rating');
  var continueToNextCardButton = $('.e2e-test-continue-to-next-card-button');
  var forwardButton = $('.e2e-test-next-button');
  var playButton = $('.e2e-test-play-circle');
  var radioButton = $('.e2e-test-report-exploration-radio-button');
  var radioButtonSelector = function () {
    return $$('.e2e-test-report-exploration-radio-button');
  };
  var ratingStar = $('.e2e-test-rating-star');
  var ratingStarsSelector = function () {
    return $$('.e2e-test-rating-star');
  };
  var reportExplorationButton = $('.e2e-test-report-exploration-button');
  var reportExplorationTextArea = $('.e2e-test-report-exploration-text-area');
  var returnToParentButton = $('.e2e-test-return-to-parent-button');
  let submitButton = $('.e2e-test-submit-report-button');
  var suggestionPopupLink = $('.e2e-test-exploration-suggestion-popup-link');
  var viewHintButton = $('.e2e-test-view-hint');
  var viewSolutionButton = $('.e2e-test-view-solution');
  var waitingForResponseElem = $('.e2e-test-input-response-loading-dots');
  var skipQuestionButton = $('.e2e-test-skip-question-button');

  this.expandAudioBar = async function () {
    await action.click('Audio Bar Expand Button', audioBarExpandButton);
  };

  this.expectAudioToBePaused = async function () {
    await waitFor.visibilityOf(
      playButton,
      'Play button taking too long to show up.'
    );
  };

  this.clickThroughToNextCard = async function () {
    await action.click('Next Card button', continueToNextCardButton);
  };

  this.clickForwardButton = async function () {
    await action.click('Forward button', forwardButton);
  };

  this.clickSuggestChangesButton = async function () {
    await action.click('Suggestion Popup link', suggestionPopupLink);
  };

  this.expectNextCardButtonTextToBe = async function (text) {
    var buttonText = await action.getText(
      'Next Card Button',
      continueToNextCardButton
    );
    expect(buttonText).toMatch(text);
  };

  this.reportExploration = async function () {
    await action.click('Report Exploration Button', reportExplorationButton);
    await waitFor.visibilityOf(
      radioButton,
      'Radio Buttons takes too long to appear'
    );
    var radioButtonOption = await radioButtonSelector();
    await action.click('Radio Button', radioButtonOption[0]);
    await action.setValue(
      'Text Area',
      reportExplorationTextArea,
      'Reporting this exploration'
    );
    await action.click('Submit Button', submitButton);
    let afterSubmitText = await action.getText(
      'Flagged Success Element',
      flaggedSuccessElement
    );
    expect(afterSubmitText).toMatch(
      'Your report has been forwarded to the moderators for review.'
    );
  };

  this.viewHint = async function () {
    // We need to wait some time for the solution to activate.
    var until = require('wdio-wait-for');
    const WAIT_FOR_FIRST_HINT_MSEC = 60000;
    await browser.waitUntil(until.elementToBeClickable(viewHintButton), {
      timeout: WAIT_FOR_FIRST_HINT_MSEC,
      timeoutMsg: '"View Hint" button takes too long to be clickable',
    });
    await action.click('View Hint Button', viewHintButton);
    await clickGotItButton();
  };

  this.viewSolution = async function () {
    var until = require('wdio-wait-for');
    const WAIT_FOR_SUBSEQUENT_HINTS = 30000;
    // We need to wait some time for the solution to activate.
    await browser.waitUntil(until.elementToBeClickable(viewSolutionButton), {
      timeout: WAIT_FOR_SUBSEQUENT_HINTS,
      timeoutMsg: '"View Solution" button takes too long to be clickable',
    });
    await action.click('View Solution Button', viewSolutionButton);
    await action.click('Continue To Solution Button', continueToSolutionButton);
    await clickGotItButton();
  };

  var clickGotItButton = async function () {
    await waitFor.elementToBeClickable(gotItButton);
    await action.click('Got It Button', gotItButton);
  };

  this.clickConfirmRedirectionButton = async function () {
    await waitFor.elementToBeClickable(confirmRedirectionButton);
    await action.click('Confirm Redirection Button', confirmRedirectionButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickCancelRedirectionButton = async function () {
    await waitFor.elementToBeClickable(cancelRedirectionButton);
    await action.click('Cancel Redirection Button', cancelRedirectionButton);
  };

  this.clickOnReturnToParentButton = async function () {
    await waitFor.elementToBeClickable(returnToParentButton);
    await action.click('Return To Parent Button', returnToParentButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickCloseLessonInfoTooltip = async function (
    closeLessonInfoTooltipElement
  ) {
    await waitFor.elementToBeClickable(
      closeLessonInfoTooltipElement,
      'Lesson Info Tooltip takes too long to appear'
    );
    await action.click(
      'Close Lesson Info Tooltip',
      closeLessonInfoTooltipElement
    );
  };

  // This verifies the question just asked, including formatting and
  // rich-text components. To do so the richTextInstructions function will be
  // sent a handler (as given in forms.RichTextChecker) to which calls such as
  //   handler.readItalicText('slanted');
  // can then be sent.
  this.expectContentToMatch = async function (richTextInstructions) {
    await waitFor.visibilityOf(conversationContent, 'Conversation not visible');
    var conversationContents = await conversationContentsSelector();
    var lastElement = conversationContents.length - 1;
    await waitFor.visibilityOf(
      conversationContents[lastElement],
      'Conversation not fully present'
    );
    await forms
      .expectRichText(conversationContents[lastElement])
      .toMatch(richTextInstructions);
  };

  this.waitForLessonCompletionMessageToDisappear = async function () {
    var lessonCompletionMessage = $('.e2e-test-lesson-completion-message');
    await waitFor.invisibilityOf(
      lessonCompletionMessage,
      'Lesson Completion Message took long to disappear'
    );
  };

  this.expectExplorationToBeOver = async function () {
    await waitFor.visibilityOf(conversationContent, 'Conversation not visible');
    var conversationContents = await conversationContentsSelector();
    var lastElement = conversationContents.length - 1;
    await waitFor.visibilityOf(
      conversationContents[lastElement],
      'Ending message not visible'
    );
    await waitFor.textToBePresentInElement(
      conversationContents[lastElement],
      'Congratulations, you have finished!',
      'Ending Message Not Visible'
    );
    let conversationContentText = await action.getText(
      'Conversation Content Element',
      conversationContents[lastElement]
    );
    expect(conversationContentText).toEqual(
      'Congratulations, you have finished!'
    );
  };

  this.expectExplorationToNotBeOver = async function () {
    await waitFor.visibilityOf(conversationContent, 'Conversation not visible');
    var conversationContents = await conversationContentsSelector();
    var lastElement = conversationContents.length - 1;
    await waitFor.visibilityOf(
      conversationContents[lastElement],
      'Ending message not visible'
    );
    let conversationContentText = await action.getText(
      'Conversation Content Element',
      conversationContents[lastElement]
    );
    expect(conversationContentText).not.toEqual(
      'Congratulations, you have finished!'
    );
  };

  // Additional arguments may be sent to this function, and they will be
  // passed on to the relevant interaction's detail checker.
  this.expectInteractionToMatch = async function (interactionId) {
    await waitFor.visibilityOf(
      conversationSkinCardsContainer,
      'Conversation skill cards take too long to appear.'
    );
    // Convert additional arguments to an array to send on.
    var args = [conversationInput];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var interaction = await interactions.getInteraction(interactionId);
    await interaction.expectInteractionDetailsToMatch.apply(null, args);
  };

  // Note that the 'latest' feedback may be on either the current or a
  // previous card.
  this.expectLatestFeedbackToMatch = async function (richTextInstructions) {
    await waitFor.visibilityOf(conversationFeedback);
    await forms
      .expectRichText(conversationFeedback)
      .toMatch(richTextInstructions);
  };

  this.expectExplorationNameToBe = async function (name) {
    await waitFor.visibilityOf(
      explorationHeader,
      'Exploration Header taking too long to appear.'
    );
    await waitFor.textToBePresentInElement(
      explorationHeader,
      name,
      'No Header Text'
    );
    var ExplorationHeaderText = await action.getText(
      'Exploration Header',
      explorationHeader
    );
    expect(ExplorationHeaderText).toBe(name);
  };

  this.expectExplorationRatingOnInformationCardToEqual = async function (
    ratingValue
  ) {
    await waitFor.elementToBeClickable(explorationInfoIcon);
    await action.click('Exploration Info Icon', explorationInfoIcon);
    await waitFor.visibilityOf(
      infoCardRating,
      'Rating takes too long to appear'
    );
    var value = await action.getText('Info Card Rating', infoCardRating);
    expect(value).toBe(ratingValue);
  };

  this.rateExploration = async function (ratingValue) {
    await waitFor.visibilityOf(
      ratingStar,
      'Rating stars takes too long to appear'
    );
    var ratingStars = await ratingStarsSelector();
    await action.click('Submit Button', ratingStars[ratingValue - 1]);
    await waitFor.visibilityOfSuccessToast(
      'Success toast for rating takes too long to appear.'
    );
    await waitFor.elementToBeClickable(feedbackCloseButton);
    await action.click('Feedback Close Button', feedbackCloseButton);
    await waitFor.invisibilityOf(
      feedbackCloseButton,
      'Close Feedback button does not disappear'
    );
  };

  this.skipQuestion = async function () {
    await action.click('Skip question button', skipQuestionButton);
  };

  // `answerData` is a variable that is passed to the
  // corresponding interaction's protractor utilities.
  // Its definition and type are interaction-specific.
  this.submitAnswer = async function (interactionId, answerData) {
    // TODO(#11969): Move this wait to interactions submitAnswer function.
    await waitFor.presenceOf(
      conversationInput,
      'Conversation input takes too long to appear.'
    );
    // The [0] targets the inline interaction, if it exists. Otherwise,
    // it will get the supplemental interaction.
    await interactions
      .getInteraction(interactionId)
      .submitAnswer(conversationInput, answerData);
    await waitFor.invisibilityOf(
      waitingForResponseElem,
      'Response takes too long to appear'
    );
  };

  this.submitFeedback = async function (feedback) {
    await waitFor.elementToBeClickable(feedbackPopupLink);
    await action.click('Feedback Popup Link', feedbackPopupLink);
    await action.setValue('Feedback Text Area', feedbackTextArea, feedback);
    await waitFor.elementToBeClickable(feedbackSubmitButton);
    await action.click('Feedback Submit Button', feedbackSubmitButton);
    await waitFor.invisibilityOf(
      feedbackSubmitButton,
      'Feedback popup takes too long to disappear'
    );
  };

  this.expectCorrectFeedback = async function () {
    await waitFor.visibilityOf(
      correctFeedbackElement,
      'Correct feedback footer takes too long to appear'
    );
  };

  this.expectCongratulatoryCheckpointMessageToAppear = async function () {
    await waitFor.visibilityOf(
      congratulatorycheckpointMessage,
      'Checkpoint message takes too long to appear'
    );
  };

  this.expectCongratulatoryCheckpointMessageToDisappear = async function () {
    await waitFor.invisibilityOf(
      congratulatorycheckpointMessage,
      'Checkpoint message takes too long to disappear'
    );
  };

  this.dismissLessonInfoTooltip = async function () {
    await action.click('Lesson Info Tooltip', lessonInfoTooltip);
  };

  this.expectCheckpointProgressMessageToBeDisplayedOnLessonInfoModal =
    async function () {
      await action.click('Exploration Info Icon', explorationInfoIcon);
      await waitFor.visibilityOf(
        lessonInfoModalCheckpointMessage,
        'Checkpoint message on the lesson info modal takes too long to appear'
      );
      expect(lessonInfoModalCheckpointMessage).toHaveText([
        "You're making good progress! Keep going!",
        'Amazing! You just completed your second checkpoint!',
        "One more checkpoint completed, you're doing great!",
      ]);
      await action.click('Close Button', lessonInfoModalCloseButton);
    };

  this.submitFeedback = async function (feedback) {
    await waitFor.elementToBeClickable(feedbackPopupLink);
    await action.click('Feedback Popup Link', feedbackPopupLink);
    await action.setValue('Feedback Text Area', feedbackTextArea, feedback);
    await waitFor.elementToBeClickable(feedbackSubmitButton);
    await action.click('Feedback Submit Button', feedbackSubmitButton);
    await waitFor.invisibilityOf(
      feedbackSubmitButton,
      'Feedback popup takes too long to disappear'
    );
  };
};

exports.ExplorationPlayerPage = ExplorationPlayerPage;
