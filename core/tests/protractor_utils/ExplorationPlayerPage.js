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

var general = require('../protractor_utils/general.js');
var forms = require('./forms.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var until = protractor.ExpectedConditions;

var ExplorationPlayerPage = function() {
  var conversationInput = element(
    by.css('.protractor-test-conversation-input'));
  var suggestionDescriptionInput = element(
    by.css('.protractor-test-suggestion-description-input'));
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
  var ratingStar = element.all(by.css('.protractor-test-rating-star'));

  var suggestionSubmitButton = element(
    by.css('.protractor-test-suggestion-submit-btn'));
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

  var feedbackPopupLink =
    element(by.css('.protractor-test-exploration-feedback-popup-link'));
  var suggestionPopupLink =
    element(by.css('.protractor-test-exploration-suggestion-popup-link'));

  this.clickThroughToNextCard = function() {
    browser.wait(until.elementToBeClickable(nextCardButton), 5000,
      ' Next Card button takes too long to appear');
    nextCardButton.click();
  };

  this.viewHint = function() {
    // We need to wait some time for the solution to activate.
    browser.wait(until.elementToBeClickable(viewHintButton), 5000,
      ' View Hintbutton takes too long to appear');
    viewHintButton.click();
    clickGotItButton();
  };

  this.viewSolution = function() {
    // We need to wait some time for the solution to activate.
    browser.wait(until.elementToBeClickable(viewSolutionButton), 5000,
      ' Solution takes too long to appear');
    viewSolutionButton.click();
    browser.wait(until.elementToBeClickable(continueToSolutionButton), 5000,
      ' Continue Solution button takes too long to appear');
    continueToSolutionButton.click();
    clickGotItButton();
  };

  var clickGotItButton = function() {
    browser.wait(until.elementToBeClickable(gotItButton), 5000,
      ' Got It button takes too long to appear');
    gotItButton.click();
  };

  this.clickConfirmRedirectionButton = function() {
    browser.wait(until.elementToBeClickable(confirmRedirectionButton), 5000,
      ' Confirm Redirect button takes too long to appear');
    confirmRedirectionButton.click();
    general.waitForLoadingMessage();
  };

  this.clickCancelRedirectionButton = function() {
    browser.wait(until.elementToBeClickable(cancelRedirectionButton), 5000,
      ' Cancel Redirect button takes too long to appear');
    cancelRedirectionButton.click();
  };

  this.clickOnReturnToParentButton = function() {
    browser.wait(until.elementToBeClickable(returnToParentButton), 5000,
      ' Cancel Redirect button takes too long to appear');
    returnToParentButton.click();
    general.waitForLoadingMessage();
  };

  // This verifies the question just asked, including formatting and
  // rich-text components. To do so the richTextInstructions function will be
  // sent a handler (as given in forms.RichTextChecker) to which calls such as
  //   handler.readItalicText('slanted');
  // can then be sent.
  this.expectContentToMatch = function(richTextInstructions) {
    forms.expectRichText(
      conversationContent.last()
    ).toMatch(richTextInstructions);
  };

  this.expectExplorationToBeOver = function() {
    expect(
      conversationContent.last().getText()
    ).toEqual('Congratulations, you have finished!');
  };

  this.expectExplorationToNotBeOver = function() {
    expect(
      conversationContent.last().getText()
    ).not.toEqual('Congratulations, you have finished!');
  };

  // Additional arguments may be sent to this function, and they will be
  // passed on to the relevant interaction's detail checker.
  this.expectInteractionToMatch = function(interactionId) {
    // Convert additional arguments to an array to send on.
    var args = [conversationInput];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    interactions.getInteraction(interactionId).
      expectInteractionDetailsToMatch.apply(null, args);
  };

  // Note that the 'latest' feedback may be on either the current or a
  // previous card.
  this.expectLatestFeedbackToMatch = function(richTextInstructions) {
    forms.expectRichText(
      conversationFeedback.last()
    ).toMatch(richTextInstructions);
  };

  this.expectExplorationNameToBe = function(name) {
    expect(
      explorationHeader.getText()
    ).toBe(name);
  };

  this.expectExplorationRatingOnInformationCardToEqual = function(ratingValue) {
    explorationInfoIcon.click();
    infoCardRating.getText().then(function(value) {
      expect(value).toBe(ratingValue);
    });
  };

  this.rateExploration = function(ratingValue) {
    ratingStar.then(function(elements) {
      browser.wait(until.elementToBeClickable(elements[ratingValue - 1]), 5000,
        'Rating Star takes too long to appear');
      elements[ratingValue - 1].click();
    });
  };

  // `answerData` is a variable that is passed to the
  // corresponding interaction's protractor utilities.
  // Its definition and type are interaction-specific.
  this.submitAnswer = function(interactionId, answerData) {
    // The .first() targets the inline interaction, if it exists. Otherwise,
    // it will get the supplemental interaction.
    interactions.getInteraction(interactionId).submitAnswer(
      conversationInput, answerData);
    general.waitForSystem();
  };

  this.submitFeedback = function(feedback) {
    browser.wait(until.elementToBeClickable(feedbackPopupLink), 5000,
      'Feedback Popup link takes too long to appear');
    feedbackPopupLink.click();
    feedbackTextArea.sendKeys(feedback);
    browser.wait(until.elementToBeClickable(feedbackSubmitButton), 5000,
      'Feedback Submit button takes too long to appear');
    feedbackSubmitButton.click();
    browser.wait(until.invisibilityOf(feedbackSubmitButton), 5000);
  };

  this.submitSuggestion = function(suggestion, description) {
    browser.wait(until.elementToBeClickable(suggestionPopupLink), 5000,
      'Suggestion Popup link takes too long to appear');
    suggestionPopupLink.click();
    forms.RichTextEditor(explorationSuggestionModal).setPlainText(suggestion);
    suggestionDescriptionInput.sendKeys(description);
    browser.wait(until.elementToBeClickable(suggestionSubmitButton), 5000,
      'Suggestion Submit button takes too long to appear');
    suggestionSubmitButton.click();
    browser.wait(until.invisibilityOf(suggestionSubmitButton), 5000);
  };
};

exports.ExplorationPlayerPage = ExplorationPlayerPage;
