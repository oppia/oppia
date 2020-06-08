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

var forms = require('./forms.js');
var waitFor = require('./waitFor.js');
var interactions = require('../../../extensions/interactions/protractor.js');

var ExplorationPlayerPage = function() {
  var conversationInput = element(
    by.css('.protractor-test-conversation-input'));
  var nextCardButton = element(by.css('.protractor-test-next-card-button'));
  var suggestionDescriptionInput = element(
    by.css('.protractor-test-suggestion-description-input'));
  var closeSuggestionModalButton = element(
    by.css('.protractor-test-exploration-close-suggestion-modal-btn'));
  var conversationContent = element.all(
    by.css('.protractor-test-conversation-content'));
  var conversationFeedback = element.all(
    by.css('.protractor-test-conversation-feedback'));
  var explorationHeader = element(
    by.css('.protractor-test-exploration-header'));
  var infoCardRating = element(
    by.css('.protractor-test-info-card-rating'));
  var explorationSuggestionModal = element(
    by.css('.protractor-test-exploration-suggestion-modal'));
  var feedbackTextArea = element(
    by.css('.protractor-test-exploration-feedback-textarea'));
  var waitingForResponseElem = element(by.css(
    '.protractor-test-input-response-loading-dots'));
  var ratingStars = element.all(by.css('.protractor-test-rating-star'));
  var answerDetailsTextArea = element(
    by.css('.protractor-test-answer-details-text-area'));

  var suggestionSubmitButton = element(
    by.css('.protractor-test-suggestion-submit-btn'));
  var feedbackCloseButton = element(
    by.css('.protractor-test-exploration-feedback-close-button'));
  var reportExplorationButton = element(
    by.css('.protractor-test-report-exploration-button'));
  var feedbackSubmitButton = element(
    by.css('.protractor-test-exploration-feedback-submit-btn'));
  var explorationInfoIcon = element(
    by.css('.protractor-test-exploration-info-icon'));
  var nextCardButton = element(
    by.css('.protractor-test-continue-to-next-card-button'));
  var viewHintButton = element(by.css('.protractor-test-view-hint'));
  var viewSolutionButton = element(by.css('.protractor-test-view-solution'));
  var continueToSolutionButton = element(
    by.css('.protractor-test-continue-to-solution-btn'));
  var gotItButton = element(by.css('.oppia-learner-got-it-button'));
  var confirmRedirectionButton =
      element(by.css('.protractor-test-confirm-redirection-button'));
  var cancelRedirectionButton = element(
    by.css('.protractor-test-cancel-redirection-button'));
  var returnToParentButton = element(
    by.css('.protractor-test-return-to-parent-button'));
  var answerDetailsSubmitButton = element(
    by.css('.protractor-test-answer-details-submit-button'));
  var correctFeedbackElement = element(
    by.css('.protractor-test-correct-feedback'));

  var feedbackPopupLink =
    element(by.css('.protractor-test-exploration-feedback-popup-link'));
  var suggestionPopupLink =
    element(by.css('.protractor-test-exploration-suggestion-popup-link'));

  this.clickThroughToNextCard = async function() {
    await waitFor.elementToBeClickable(
      nextCardButton, '"Next Card" button takes too long to be clickable');
    await nextCardButton.click();
  };

  this.clickSuggestChangesButton = async function() {
    await waitFor.elementToBeClickable(suggestionPopupLink,
      'Suggest changes button taking too long to appear');
    await suggestionPopupLink.click();
  };

  this.expectNextCardButtonTextToBe = async function(text) {
    var buttonText = await nextCardButton.getText();
    expect(buttonText).toMatch(text);
  };

  this.fillAndSubmitSuggestion = async function(
      suggestionTitle, suggestionDescription) {
    var suggestionModal = element(
      by.css('.protractor-test-exploration-suggestion-modal'));
    await waitFor.visibilityOf(suggestionModal,
      'Suggestion Modal is taking too long to appear.');
    var suggestionHeader = element(by.css('.oppia-rte'));
    await suggestionHeader.click();
    await suggestionHeader.sendKeys(suggestionTitle);
    var suggestionModalDescription = element(
      by.css('.protractor-test-suggestion-description-input'));
    await suggestionModalDescription.click();
    await suggestionModalDescription.sendKeys(suggestionDescription);
    var submitSuggestionBtn = element(
      by.css('.protractor-test-suggestion-submit-btn'));

    await submitSuggestionBtn.click();
    var AFTER_SUBMIT_RESPONSE_STRING =
        'Your suggestion has been forwarded to the ' +
        'exploration author for review.';
    var afterSubmitModalText = await element(by.tagName('p')).getText();
    expect(afterSubmitModalText).toMatch(AFTER_SUBMIT_RESPONSE_STRING);
  };

  this.reportExploration = async function() {
    await waitFor.elementToBeClickable(reportExplorationButton,
      'Report Exploration Button takes too long to be clickable');
    await reportExplorationButton.click();
    let radioButton = await element.all(by.tagName('input')).get(0);
    await waitFor.visibilityOf(
      radioButton, 'Radio Buttons takes too long to appear');
    await radioButton.click();
    let textArea = element(by.tagName('textarea'));
    await textArea.sendKeys('Reporting this exploration');
    let submitButton = await element.all(by.tagName('button')).get(1);
    await submitButton.click();
    let afterSubmitText = await element(by.tagName('p')).getText();
    expect(afterSubmitText).toMatch(
      'Your report has been forwarded to the moderators for review.');
  };

  this.viewHint = async function() {
    // We need to wait some time for the solution to activate.
    await waitFor.elementToBeClickable(
      viewHintButton, '"View Hint" button takes too long to be clickable');
    await viewHintButton.click();
    await clickGotItButton();
  };

  this.viewSolution = async function() {
    // We need to wait some time for the solution to activate.
    await waitFor.elementToBeClickable(
      viewSolutionButton,
      '"View Solution" button takes too long to be clickable');
    await viewSolutionButton.click();
    await waitFor.elementToBeClickable(
      continueToSolutionButton,
      '"Continue Solution" button takes too long to be clickable');
    await continueToSolutionButton.click();
    await clickGotItButton();
  };

  var clickGotItButton = async function() {
    await waitFor.elementToBeClickable(
      gotItButton, '"Got It" button takes too long to be clickable');
    await gotItButton.click();
  };

  this.clickConfirmRedirectionButton = async function() {
    await waitFor.elementToBeClickable(
      confirmRedirectionButton,
      '"Confirm Redirect" button takes too long to be clickable');
    await confirmRedirectionButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.clickCancelRedirectionButton = async function() {
    await waitFor.elementToBeClickable(
      cancelRedirectionButton,
      '"Cancel Redirect" button takes too long to be clickable');
    await cancelRedirectionButton.click();
  };

  this.clickOnReturnToParentButton = async function() {
    await waitFor.elementToBeClickable(
      returnToParentButton,
      '"Return to Parent" button takes too long to be clickable');
    await returnToParentButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.clickOnCloseSuggestionModalButton = async function() {
    await waitFor.elementToBeClickable(
      closeSuggestionModalButton,
      '"Close suggestion modal" button takes too long to be clickable');
    await closeSuggestionModalButton.click();
    await waitFor.pageToFullyLoad();
  };

  // This verifies the question just asked, including formatting and
  // rich-text components. To do so the richTextInstructions function will be
  // sent a handler (as given in forms.RichTextChecker) to which calls such as
  //   handler.readItalicText('slanted');
  // can then be sent.
  this.expectContentToMatch = async function(richTextInstructions) {
    await waitFor.visibilityOf(
      await conversationContent.first(), 'Conversation not visible');
    await forms.expectRichText(
      await conversationContent.last()
    ).toMatch(richTextInstructions);
  };

  this.expectExplorationToBeOver = async function() {
    expect(
      await (await conversationContent.last()).getText()
    ).toEqual('Congratulations, you have finished!');
  };

  this.expectExplorationToNotBeOver = async function() {
    expect(
      await (await conversationContent.last()).getText()
    ).not.toEqual('Congratulations, you have finished!');
  };

  // Additional arguments may be sent to this function, and they will be
  // passed on to the relevant interaction's detail checker.
  this.expectInteractionToMatch = async function(interactionId) {
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
    await forms.expectRichText(
      await conversationFeedback.last()
    ).toMatch(richTextInstructions);
  };

  this.expectExplorationNameToBe = async function(name) {
    expect(
      await explorationHeader.getText()
    ).toBe(name);
  };

  this.expectExplorationRatingOnInformationCardToEqual = async function(
      ratingValue) {
    await explorationInfoIcon.click();
    var value = await infoCardRating.getText();
    expect(value).toBe(ratingValue);
  };

  this.rateExploration = async function(ratingValue) {
    var elements = ratingStars;
    await waitFor.elementToBeClickable(
      await elements.get(ratingValue - 1),
      'Rating Star takes too long to be clickable');
    await (await elements.get(ratingValue - 1)).click();
    await waitFor.elementToBeClickable(
      feedbackCloseButton, 'Close Feedback button is not clickable');
    await feedbackCloseButton.click();
    await waitFor.invisibilityOf(
      feedbackCloseButton, 'Close Feedback button does not disappear');
  };

  // `answerData` is a variable that is passed to the
  // corresponding interaction's protractor utilities.
  // Its definition and type are interaction-specific.
  this.submitAnswer = async function(interactionId, answerData) {
    // The .first() targets the inline interaction, if it exists. Otherwise,
    // it will get the supplemental interaction.
    await interactions.getInteraction(interactionId).submitAnswer(
      conversationInput, answerData);
    await waitFor.invisibilityOf(
      waitingForResponseElem, 'Response takes too long to appear');
  };

  this.submitFeedback = async function(feedback) {
    await waitFor.elementToBeClickable(
      feedbackPopupLink, 'Feedback Popup link takes too long to be clickable');
    await feedbackPopupLink.click();
    await feedbackTextArea.sendKeys(feedback);
    await waitFor.elementToBeClickable(
      feedbackSubmitButton,
      'Feedback Submit button takes too long to be clickable');
    await feedbackSubmitButton.click();
    await waitFor.invisibilityOf(
      feedbackSubmitButton, 'Feedback popup takes too long to disappear');
  };

  this.submitSuggestion = async function(suggestion, description) {
    await waitFor.elementToBeClickable(
      suggestionPopupLink, 'Suggestion Popup link takes too long to appear');
    await suggestionPopupLink.click();
    var editor = await forms.RichTextEditor(explorationSuggestionModal);
    await editor.setPlainText(suggestion);
    await suggestionDescriptionInput.sendKeys(description);
    await waitFor.elementToBeClickable(
      suggestionSubmitButton,
      'Suggestion Submit button takes too long to be clickable');
    await suggestionSubmitButton.click();
    await waitFor.invisibilityOf(
      suggestionSubmitButton, 'Suggestion popup takes too long to disappear');
  };

  this.expectCorrectFeedback = async function() {
    await waitFor.visibilityOf(
      correctFeedbackElement,
      'Correct feedback footer takes too long to appear');
  };
};

exports.ExplorationPlayerPage = ExplorationPlayerPage;
