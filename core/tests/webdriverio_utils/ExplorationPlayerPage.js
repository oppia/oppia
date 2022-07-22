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

var ExplorationPlayerPage = function() {
  var conversationInput = $('.e2e-test-conversation-input');
  var conversationContentSelector = function() {
    return $$('.e2e-test-conversation-content');
  };
  var explorationHeader = $('.e2e-test-exploration-header');
  var feedbackCloseButton = $('.e2e-test-exploration-feedback-close-button');
  var feedbackPopupLink = $('.e2e-test-exploration-feedback-popup-link');
  var feedbackSubmitButton = $('.e2e-test-exploration-feedback-submit-btn');
  var feedbackTextArea = $('.e2e-test-exploration-feedback-textarea');
  var ratingStar = $('.e2e-test-rating-star');
  var ratingStarsSelector = function() {
    return $$('.e2e-test-rating-star');
  };
  var waitingForResponseElem = $('.e2e-test-input-response-loading-dots');

  // This verifies the question just asked, including formatting and
  // rich-text components. To do so the richTextInstructions function will be
  // sent a handler (as given in forms.RichTextChecker) to which calls such as
  //   handler.readItalicText('slanted');
  // can then be sent.
  this.expectContentToMatch = async function(richTextInstructions) {
    var conversationContent = await conversationContentSelector();
    var lastElement = conversationContent.length - 1;
    await waitFor.visibilityOf(
      conversationContent[0], 'Conversation not visible');
    await waitFor.visibilityOf(
      conversationContent[lastElement], 'Conversation not fully present');
    await forms.expectRichText(
      conversationContent[lastElement]
    ).toMatch(richTextInstructions);
  };

  // `answerData` is a variable that is passed to the
  // corresponding interaction's protractor utilities.
  // Its definition and type are interaction-specific.
  this.submitAnswer = async function(interactionId, answerData) {
    // TODO(#11969): Move this wait to interactions submitAnswer function.
    await waitFor.presenceOf(
      conversationInput, 'Conversation input takes too long to appear.');
    // The [0] targets the inline interaction, if it exists. Otherwise,
    // it will get the supplemental interaction.
    await interactions.getInteraction(interactionId).submitAnswer(
      conversationInput, answerData);
    await waitFor.invisibilityOf(
      waitingForResponseElem, 'Response takes too long to appear');
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

  this.rateExploration = async function(ratingValue) {
    await waitFor.visibilityOf(
      ratingStar, 'Rating stars takes too long to appear');
    var ratingStars = await ratingStarsSelector();
    await action.click('Submit Button', ratingStars[ratingValue - 1]);
    await waitFor.visibilityOfSuccessToast(
      'Success toast for rating takes too long to appear.');
    await waitFor.elementToBeClickable(feedbackCloseButton);
    await action.click('Feedback Close Button', feedbackCloseButton);
    await waitFor.invisibilityOf(
      feedbackCloseButton, 'Close Feedback button does not disappear');
  };

  this.expectExplorationToNotBeOver = async function() {
    var conversationContent = await conversationContentSelector();
    var lastElement = conversationContent.length - 1;
    await waitFor.visibilityOf(
      conversationContent[lastElement], 'Ending message not visible');
    expect(
      await conversationContent[lastElement].getText()
    ).not.toEqual('Congratulations, you have finished!');
  };

  this.submitFeedback = async function(feedback) {
    await waitFor.elementToBeClickable(feedbackPopupLink);
    await action.click('Feedback Popup Link', feedbackPopupLink);
    await action.setValue('Feedback Text Area', feedbackTextArea, feedback);
    await waitFor.elementToBeClickable(feedbackSubmitButton);
    await action.click('Feedback Submit Button', feedbackSubmitButton);
    await waitFor.invisibilityOf(
      feedbackSubmitButton, 'Feedback popup takes too long to disappear');
  };
};

exports.ExplorationPlayerPage = ExplorationPlayerPage;
