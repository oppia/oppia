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
 * @fileoverview Utilities for playing through an exploration and checking its
 * contents when carrying out end-to-end testing with protractor.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var interactions = require('../../../extensions/interactions/protractor.js');

var ExplorationPlayerPage = function(){
  this.restartExploration = function() {
    element(by.css('.protractor-test-restart-exploration')).click();
  };

  this.expectExplorationNameToBe = function(name) {
    expect(
      element(by.css('.protractor-test-exploration-header')).getText()
    ).toBe(name);
  };

  // This verifies the question just asked, including formatting and
  // rich-text components. To do so the richTextInstructions function will be
  // sent a handler (as given in forms.RichTextChecker) to which calls such as
  //   handler.readItalicText('slanted');
  // can then be sent.
  this.expectContentToMatch = function(richTextInstructions) {
    forms.expectRichText(
      element.all(by.css('.protractor-test-conversation-content')).last()
    ).toMatch(richTextInstructions);
  };

  // Note that the 'latest' feedback may be on either the current or a
  // previous card.
  this.expectLatestFeedbackToMatch = function(richTextInstructions) {
    forms.expectRichText(
      element.all(by.css('.protractor-test-conversation-feedback')).last()
    ).toMatch(richTextInstructions);
  };

  // Additional arguments may be sent to this function, and they will be
  // passed on to the relevant interaction's detail checker.
  this.expectInteractionToMatch = function(interactionId) {
    // Convert additional arguments to an array to send on.
    var args = [element(by.css('.protractor-test-conversation-input'))];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    interactions.getInteraction(interactionId).
      expectInteractionDetailsToMatch.apply(null, args);
  };

  // `answerData` is a variable that is passed to the corresponding interaction's
  // protractor utilities. Its definition and type are interaction-specific.
  this.submitAnswer = function(interactionId, answerData) {
    // The .first() targets the inline interaction, if it exists. Otherwise,
    // it will get the supplemental interaction.
    interactions.getInteraction(interactionId).submitAnswer(
      element.all(by.css('.protractor-test-conversation-input')).first(),
      answerData);
    general.waitForSystem();
  };

  this.clickThroughToNextCard = function() {
    element(by.css('.protractor-test-continue-to-next-card-button')).click();
  };

  this.rateExploration = function(ratingValue) {
    element.all(by.css('.protractor-test-rating-star')).then(function(elements) {
      elements[ratingValue - 1].click();
    });
  };

  this.expectExplorationRatingOnInformationCardToEqual = function(ratingValue) {
    element(by.css('.protractor-test-exploration-info-icon')).click();
    element(by.css('.protractor-test-info-card-rating')).getText().
      then(function(value) {
        expect(value).toBe(ratingValue);
      });
  };

  this.expectExplorationToBeOver = function() {
    expect(element.all(by.css(
      '.protractor-test-conversation-content'
    )).last().getText()).toEqual('Congratulations, you have finished!');
  };

  this.expectExplorationToNotBeOver = function() {
    expect(element.all(by.css(
      '.protractor-test-conversation-content'
    )).last().getText()).not.toEqual('Congratulations, you have finished!');
  };

  this.openFeedbackPopup = function() {
    element(by.css('.protractor-test-exploration-feedback-popup-link')).click();
  };

  this.openSuggestionPopup = function() {
    element(by.css('.protractor-test-exploration-suggestion-popup-link')).click();
  };

  this.submitFeedback = function(feedback) {
    openFeedbackPopup();
    element(by.css('.protractor-test-exploration-feedback-textarea')).
      sendKeys(feedback);
    element(by.css('.protractor-test-exploration-feedback-submit-btn')).click();
  };

  this.viewHint = function() {
    element(by.css('.protractor-test-view-hint')).click();
  }

  this.viewSolution = function() {
    element(by.css('.protractor-test-view-solution')).click();
  }

  this.fillInSuggestion = function(suggestion) {
    var suggestionModalClass = '.protractor-test-exploration-suggestion-modal';
    var richTextEditor = forms.RichTextEditor(
      element(by.css(suggestionModalClass)));
    richTextEditor.setPlainText(suggestion);
  };

  this.addSuggestionDescription = function(description) {
    element(by.css('.protractor-test-suggestion-description-input')).
      sendKeys(description);
  };

  this.submitSuggestion = function(suggestion, description) {
    openSuggestionPopup();
    fillInSuggestion(suggestion);
    addSuggestionDescription(description);
    element(by.css('.protractor-test-suggestion-submit-btn')).click();
    general.waitForSystem();
  };
};


exports.ExplorationPlayerPage  = ExplorationPlayerPage;

/*exports.restartExploration = restartExploration;*/

/*exports.expectExplorationNameToBe = expectExplorationNameToBe;
exports.expectContentToMatch = expectContentToMatch;
exports.expectLatestFeedbackToMatch = expectLatestFeedbackToMatch;

exports.expectInteractionToMatch = expectInteractionToMatch;
exports.submitAnswer = submitAnswer;
exports.clickThroughToNextCard = clickThroughToNextCard;
exports.rateExploration = rateExploration;
exports.expectExplorationRatingOnInformationCardToEqual = (
  expectExplorationRatingOnInformationCardToEqual);

exports.expectExplorationToBeOver = expectExplorationToBeOver;
exports.expectExplorationToNotBeOver = expectExplorationToNotBeOver;

exports.openFeedbackPopup = openFeedbackPopup;
exports.submitFeedback = submitFeedback;
exports.submitSuggestion = submitSuggestion;

exports.viewHint = viewHint;
exports.viewSolution = viewSolution;*/
