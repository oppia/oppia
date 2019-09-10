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
 * @fileoverview Page object for the exploration editor's improvements tab, for
 *  use in Protractor tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var ruleTemplates = require(
  '../../../extensions/interactions/rule_templates.json');
var waitFor = require('../protractor_utils/waitFor.js');

var ExplorationEditorImprovementsTab = function() {
  var allCards = $$('.protractor-test-improvements-card');
  var allThreadMessages =
    $$('.protractor-test-improvements-thread-message-body');

  var onlyOpenInput = $('.protractor-test-improvements-only-open-input');
  var closeModalButton = $('.protractor-test-improvements-close-modal-button');

  var answerDetails = $('.protractor-test-improvements-answer-details');
  var answerInfoCount = $('.protractor-test-improvements-answer-info-count');

  var responseTextarea = $('.protractor-test-improvements-response-textarea');
  var responseStatusSelect =
    $('.protractor-test-improvements-response-status-select');
  var responseSendButton =
    $('.protractor-test-improvements-response-send-button');
  var reviewSuggestionButton =
    $('.protractor-test-improvements-review-suggestion-button');

  var acceptSuggestionButton =
    $('.protractor-test-exploration-accept-suggestion-btn');
  var rejectSuggestionButton =
    $('.protractor-test-exploration-reject-suggestion-btn');
  var suggestionReviewMessageInput =
    $('.protractor-test-suggestion-review-message');
  var suggestionCommitMessageInput =
    $('.protractor-test-suggestion-commit-message');

  var actionButtonLocator =
    by.css('.protractor-test-improvements-action-button');
  var cardBodyLocator = by.css('.protractor-test-improvements-card-body');
  var cardStatusLocator = by.css('.protractor-test-improvements-card-status');
  var stateNameLocator =
    by.css('.protractor-test-improvements-card-state-name');

  var _buildCardStateNameMatcher = function(expectedStateName) {
    return function(card) {
      return card.element(stateNameLocator).getText()
        .then(stateName => stateName === expectedStateName);
    };
  };

  var _buildCardTypeMatcher = function(expectedCardType) {
    return function(card) {
      return card.getAttribute('class')
        .then(cssClass => cssClass.includes(expectedCardType));
    };
  };

  var _buildCardHasContentMatcher = function(expectedContent) {
    return function(card) {
      return card.element(cardBodyLocator).getText()
        .then(body => body.includes(expectedContent));
    };
  };

  /**
   * Combines a collection of matchers into a single one which requires all of
   * them to pass.
   *
   * @param {Iterable.<(ElementFinder) => Promise.<boolean>>} matchers
   * @returns {(ElementFinder) => Promise.<boolean>}
   */
  var _reduceCardMatchers = function(matchers) {
    return function(card) {
      return Promise.all(matchers.map(isMatch => isMatch(card)))
        .then(matchResults => matchResults.every(m => m));
    };
  };

  this.getAnswerDetailsCard = function(stateName) {
    var answerDetailsCardMatcher = _reduceCardMatchers([
      _buildCardTypeMatcher('answer-details'),
      _buildCardStateNameMatcher(stateName),
    ]);
    return allCards.filter(answerDetailsCardMatcher).first();
  };

  this.getFeedbackCard = function(latestMessage) {
    var feedbackCardMatcher = _reduceCardMatchers([
      _buildCardTypeMatcher('feedback'),
      _buildCardHasContentMatcher(latestMessage),
    ]);
    return allCards.filter(feedbackCardMatcher).first();
  };

  this.getSuggestionCard = function(description) {
    var suggestionCardMatcher = _reduceCardMatchers([
      _buildCardTypeMatcher('suggestion'),
      _buildCardHasContentMatcher(description),
    ]);
    return allCards.filter(suggestionCardMatcher).first();
  };

  this.getCardStatus = function(card) {
    return card.element(cardStatusLocator).getText();
  };

  this.clickCardActionButton = function(card, buttonText) {
    var buttonElement = card.element(by.buttonText(buttonText));
    waitFor.elementToBeClickable(
      buttonElement, 'Action button takes too long to become clickable');
    buttonElement.click();
  };

  this.verifyAnswerDetails = function(expectedDetails, expectedInfoCount) {
    expect(answerDetails.getText()).toMatch(expectedDetails);
    expect(answerInfoCount.getText()).toMatch(String(expectedInfoCount));
  };

  this.getThreadMessages = function() {
    return allThreadMessages.map(message => message.getText());
  };

  this.sendResponseAndCloseModal = function(feedbackResponse, feedbackStatus) {
    responseTextarea.sendKeys(feedbackResponse);
    if (feedbackStatus) {
      responseStatusSelect.click();
      $('option[label="' + feedbackStatus + '"]').click();
    }
    responseSendButton.click();
  };

  this.acceptSuggestion = function() {
    waitFor.elementToBeClickable(
      reviewSuggestionButton,
      'View Suggestion button takes too long to become clickable');
    reviewSuggestionButton.click();

    suggestionCommitMessageInput.sendKeys('Commit message');
    waitFor.elementToBeClickable(
      acceptSuggestionButton,
      'Accept Suggestion button takes too long to become clickable');
    acceptSuggestionButton.click();
  };

  this.rejectSuggestion = function() {
    waitFor.elementToBeClickable(
      reviewSuggestionButton,
      'View Suggestion button takes too long to become clickable');
    reviewSuggestionButton.click();

    suggestionReviewMessageInput.sendKeys('Commit message');
    waitFor.elementToBeClickable(
      rejectSuggestionButton,
      'Accept Suggestion button takes too long to become clickable');
    rejectSuggestionButton.click();
  };

  this.setShowOnlyOpenTasks = function(choice = true) {
    if (choice !== onlyOpenInput.isSelected()) {
      onlyOpenInput.click();
    }
  };

  this.closeModal = function() {
    waitFor.elementToBeClickable(
      closeModalButton, 'Close button takes too long to become clickable');
    closeModalButton.click();
  };
};

exports.ExplorationEditorImprovementsTab = ExplorationEditorImprovementsTab;
