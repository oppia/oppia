
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
 * @fileoverview Page object for the exploration player, for use in Protractor
 * tests.
 */

var action = require('./action.js');
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');
var interactions = require('../../../extensions/interactions/protractor.js');
const { browser } = require('protractor');

var ExplorationPlayerPage = function() {
  var conversationInput = element(
    by.css('.e2e-test-conversation-input'));
  var nextCardButton = element(by.css('.e2e-test-next-card-button'));
  var conversationSkinCardsContainer = element(
    by.css('.e2e-test-conversation-skin-cards-container'));
  var conversationContent = element.all(
    by.css('.e2e-test-conversation-content'));
  var conversationFeedback = element(
    by.css('.e2e-test-conversation-feedback-latest'));
  var explorationHeader = element(
    by.css('.e2e-test-exploration-header'));
  var infoCardRating = element(
    by.css('.e2e-test-info-card-rating'));
  var feedbackTextArea = element(
    by.css('.e2e-test-exploration-feedback-textarea'));
  var waitingForResponseElem = element(by.css(
    '.e2e-test-input-response-loading-dots'));
  var ratingStars = element.all(by.css('.e2e-test-rating-star'));
  var feedbackCloseButton = element(
    by.css('.e2e-test-exploration-feedback-close-button'));
  var reportExplorationButton = element(
    by.css('.e2e-test-report-exploration-button'));
  var feedbackSubmitButton = element(
    by.css('.e2e-test-exploration-feedback-submit-btn'));
  var explorationInfoIcon = element(
    by.css('.e2e-test-exploration-info-icon'));
  var nextCardButton = element(
    by.css('.e2e-test-continue-to-next-card-button'));
  var viewHintButton = element(by.css('.e2e-test-view-hint'));
  var viewSolutionButton = element(by.css('.e2e-test-view-solution'));
  var continueToSolutionButton = element(
    by.css('.e2e-test-continue-to-solution-btn'));
  var gotItButton = element(by.css('.e2e-test-learner-got-it-button'));
  var confirmRedirectionButton =
      element(by.css('.e2e-test-confirm-redirection-button'));
  var cancelRedirectionButton = element(
    by.css('.e2e-test-cancel-redirection-button'));
  var returnToParentButton = element(
    by.css('.e2e-test-return-to-parent-button'));
  var correctFeedbackElement = element(
    by.css('.e2e-test-correct-feedback'));

  var feedbackPopupLink =
    element(by.css('.e2e-test-exploration-feedback-popup-link'));
  var suggestionPopupLink =
    element(by.css('.e2e-test-exploration-suggestion-popup-link'));

  var audioBarExpandButton = element(by.css('.e2e-test-audio-bar'));
  var voiceoverLanguageSelector = element(
    by.css('.e2e-test-audio-lang-select'));
  var playButton = element(by.css('.e2e-test-play-circle'));
  var pauseButton = element(by.css('.e2e-test-pause-circle'));
  let submitButton = element(by.css('.e2e-test-submit-report-button'));
  var flaggedSuccessElement = element(
    by.css('.e2e-test-exploration-flagged-success-message'));

  this.expandAudioBar = async function() {
    await action.click('Audio Bar Expand Button', audioBarExpandButton);
  };

  this.pressPlayButton = async function() {
    await action.click('Play Button', playButton);
  };

  this.expectAudioToBePlaying = async function() {
    await waitFor.visibilityOf(
      pauseButton, 'Pause button taking too long to show up.');
  };

  this.pressPauseButton = async function() {
    await action.click('Pause Button', pauseButton);
  };

  this.expectAudioToBePaused = async function() {
    await waitFor.visibilityOf(
      playButton, 'Play button taking too long to show up.');
  };

  this.changeVoiceoverLanguage = async function(language) {
    await waitFor.visibilityOf(
      voiceoverLanguageSelector, 'Language selector takes too long to appear.');
    var languageButton = voiceoverLanguageSelector.element(
      by.cssContainingText('option', language));
    await action.click('Language Button', languageButton);
  };

  this.clickThroughToNextCard = async function() {
    await waitFor.elementToBeClickable(nextCardButton);
    await action.click('Next Card button', nextCardButton);
  };

  this.clickSuggestChangesButton = async function() {
    await action.click('Suggestion Popup link', suggestionPopupLink);
  };

  this.expectNextCardButtonTextToBe = async function(text) {
    await waitFor.visibilityOf(
      nextCardButton, 'Next Card Button not showing up.');
    var buttonText = await nextCardButton.getText();
    expect(buttonText).toMatch(text);
  };

  this.reportExploration = async function() {
    await action.click('Report Exploration Button', reportExplorationButton);
    let radioButton = element.all(by.tagName('input')).get(0);
    await waitFor.visibilityOf(
      radioButton, 'Radio Buttons takes too long to appear');
    await action.click('Radio Button', radioButton);
    let textArea = element(by.tagName('textarea'));
    await action.sendKeys('Text Area', textArea, 'Reporting this exploration');
    await action.click('Submit Button', submitButton);
    await waitFor.visibilityOf(
      flaggedSuccessElement, 'Successfully-flagged modal not showing up.');
    let afterSubmitText = await flaggedSuccessElement.getText();
    expect(afterSubmitText).toMatch(
      'Your report has been forwarded to the moderators for review.');
  };

  this.viewHint = async function() {
    // We need to wait some time for the solution to activate.
    var until = protractor.ExpectedConditions;
    const WAIT_FOR_FIRST_HINT_MSEC = 60000;
    await browser.wait(
      until.elementToBeClickable(viewHintButton), WAIT_FOR_FIRST_HINT_MSEC,
      '"View Hint" button takes too long to be clickable');
    await action.click('View Hint Button', viewHintButton);
    await clickGotItButton();
  };

  this.viewSolution = async function() {
    var until = protractor.ExpectedConditions;
    const WAIT_FOR_SUBSEQUENT_HINTS = 30000;
    // We need to wait some time for the solution to activate.
    await browser.wait(
      until.elementToBeClickable(viewSolutionButton), WAIT_FOR_SUBSEQUENT_HINTS,
      '"View Solution" button takes too long to be clickable');
    await action.click('View Solution Button', viewSolutionButton);
    await action.click(
      'Continue To Solution Button', continueToSolutionButton);
    await clickGotItButton();
  };

  var clickGotItButton = async function() {
    await waitFor.elementToBeClickable(gotItButton);
    await action.click('Got It Button', gotItButton);
  };

  this.clickConfirmRedirectionButton = async function() {
    await waitFor.elementToBeClickable(confirmRedirectionButton);
    await action.click('Confirm Redirection Button', confirmRedirectionButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickCancelRedirectionButton = async function() {
    await waitFor.elementToBeClickable(cancelRedirectionButton);
    await action.click('Cancel Redirection Button', cancelRedirectionButton);
  };

  this.clickOnReturnToParentButton = async function() {
    await waitFor.elementToBeClickable(returnToParentButton);
    await action.click('Return To Parent Button', returnToParentButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickCloseLessonInfoTooltip = async function(
      closeLessonInfoTooltipElement
  ) {
    await waitFor.elementToBeClickable(
      closeLessonInfoTooltipElement,
      'Lesson Info Tooltip takes too long to appear');
    await action.click(
      'Close Lesson Info Tooltip', closeLessonInfoTooltipElement);
  };

  // This verifies the question just asked, including formatting and
  // rich-text components. To do so the richTextInstructions function will be
  // sent a handler (as given in forms.RichTextChecker) to which calls such as
  //   handler.readItalicText('slanted');
  // can then be sent.
  this.expectContentToMatch = async function(richTextInstructions) {
    await waitFor.visibilityOf(
      conversationContent.first(), 'Conversation not visible');
    await waitFor.visibilityOf(
      conversationContent.last(), 'Conversation not fully present');
    await forms.expectRichText(
      conversationContent.last()
    ).toMatch(richTextInstructions);
  };

  this.expectExplorationToBeOver = async function() {
    await waitFor.visibilityOf(
      conversationContent.last(), 'Ending message not visible');
    await waitFor.textToBePresentInElement(
      conversationContent.last(), 'Congratulations, you have finished!',
      'Ending Message Not Visible');
    expect(
      await (conversationContent.last().getText())
    ).toEqual('Congratulations, you have finished!');
  };

  this.expectExplorationToNotBeOver = async function() {
    await waitFor.visibilityOf(
      conversationContent.last(), 'Ending message not visible');
    expect(
      await (conversationContent.last()).getText()
    ).not.toEqual('Congratulations, you have finished!');
  };

  // Additional arguments may be sent to this function, and they will be
  // passed on to the relevant interaction's detail checker.
  this.expectInteractionToMatch = async function(interactionId) {
    await waitFor.visibilityOf(
      conversationSkinCardsContainer,
      'Conversation skill cards take too long to appear.');
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
  this.expectLatestFeedbackToMatch = async function(richTextInstructions) {
    await waitFor.visibilityOf(conversationFeedback);
    await forms.expectRichText(
      conversationFeedback
    ).toMatch(richTextInstructions);
  };

  this.expectExplorationNameToBe = async function(name) {
    await waitFor.visibilityOf(
      explorationHeader, 'Exploration Header taking too long to appear.');
    await waitFor.textToBePresentInElement(
      explorationHeader, name, 'No Header Text');
    expect(
      await explorationHeader.getText()
    ).toBe(name);
  };

  this.expectExplorationRatingOnInformationCardToEqual = async function(
      ratingValue) {
    await waitFor.elementToBeClickable(explorationInfoIcon);
    await action.click('Exploration Info Icon', explorationInfoIcon);
    await waitFor.visibilityOf(
      infoCardRating, 'Rating takes too long to appear');
    var value = await infoCardRating.getText();
    expect(value).toBe(ratingValue);
  };

  this.rateExploration = async function(ratingValue) {
    await waitFor.elementToBeClickable(ratingStars.get(ratingValue - 1));
    await action.click('Submit Button', ratingStars.get(ratingValue - 1));
    await waitFor.visibilityOfSuccessToast(
      'Success toast for rating takes too long to appear.');
    await waitFor.elementToBeClickable(feedbackCloseButton);
    await action.click('Feedback Close Button', feedbackCloseButton);
    await waitFor.invisibilityOf(
      feedbackCloseButton, 'Close Feedback button does not disappear');
  };

  // `answerData` is a variable that is passed to the
  // corresponding interaction's protractor utilities.
  // Its definition and type are interaction-specific.
  this.submitAnswer = async function(interactionId, answerData) {
    // TODO(#11969): Move this wait to interactions submitAnswer function.
    await waitFor.presenceOf(
      conversationInput, 'Conversation input takes too long to appear.');
    // The .first() targets the inline interaction, if it exists. Otherwise,
    // it will get the supplemental interaction.
    await interactions.getInteraction(interactionId).submitAnswer(
      conversationInput, answerData);
    await waitFor.invisibilityOf(
      waitingForResponseElem, 'Response takes too long to appear');
  };

  this.submitFeedback = async function(feedback) {
    await waitFor.elementToBeClickable(feedbackPopupLink);
    await action.click('Feedback Popup Link', feedbackPopupLink);
    await action.sendKeys('Feedback Text Area', feedbackTextArea, feedback);
    await waitFor.elementToBeClickable(feedbackSubmitButton);
    await action.click('Feedback Submit Button', feedbackSubmitButton);
    await waitFor.invisibilityOf(
      feedbackSubmitButton, 'Feedback popup takes too long to disappear');
  };

  this.expectCorrectFeedback = async function() {
    await waitFor.visibilityOf(
      correctFeedbackElement,
      'Correct feedback footer takes too long to appear');
  };
};

exports.ExplorationPlayerPage = ExplorationPlayerPage;
