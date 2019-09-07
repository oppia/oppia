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
  const cardsContainer = $('.protractor-test-cards');
  const onlyOpenInput = $('.protractor-test-only-open-input');
  const closeModalButton = $('.protractor-test-close-modal-button');

  const answerDetails = $('.protractor-test-answer-details');
  const answerInfoCount = $('.protractor-test-answer-info-count');

  const threadMessagesContainer = $('.protractor-test-thread-messages');
  const responseTextarea = $('.protractor-test-response-textarea');
  const responseStatusSelect = $('.protractor-test-response-status-select');
  const responseSendButton = $('.protractor-test-response-send-button');
  const reviewSuggestionButton = $('.protractor-test-review-suggestion-button');

  const suggestionRows = $$('.protractor-test-oppia-feedback-tab-row');
  const acceptSuggestionButton = $(
    '.protractor-test-exploration-accept-suggestion-btn');
  var rejectSuggestionButton =
    $('.protractor-test-exploration-reject-suggestion-btn');
  var suggestionReviewMessageInput =
    $('.protractor-test-suggestion-review-message');
  var suggestionCommitMessageInput =
    $('.protractor-test-suggestion-commit-message');

  const threadMessageLocator =
    by.css('.protractor-test-thread-message-body');
  const threadMessageAuthorLocator =
    by.css('.protractor-test-thread-message-author');
  const threadMessageStatusChangeLocator =
    by.css('.protractor-test-thread-message-status-change');

  const actionButtonLocator = by.css('.protractor-test-action-button');
  const cardLocator = by.css('.protractor-test-card');
  const cardBodyLocator = by.css('.protractor-test-card-body');
  const cardStatusLocator = by.css('.protractor-test-card-status');
  const cardTitleLocator = by.css('.protractor-test-card-title');
  const stateNameLocator = by.css('.protractor-test-card-state-name');

  const suggestionRowClassName = '.protractor-test-oppia-feedback-tab-row';

  var _cardHasStateName = function(card, stateName) {
    return card.element(stateNameLocator).getText()
      .then(text => text === stateName);
  };

  var _cardHasTitle = function(card, titleSubstring) {
    return card.element(cardTitleLocator).getText()
      .then(text => text.includes(titleSubstring));
  };

  var _cardHasContent = function(card, content) {
    return card.element(cardBodyLocator).getText()
      .then(text => text.includes(content));
  };

  var _cardHasType = function(card, cardType) {
    return card.getAttribute('class')
      .then(cardCssClass => cardCssClass.includes(cardType));
  };

  /**
   * @typedef CardMatchOptions
   * @property {string} card_type - the type of the card.
   * @property {string} card_content - the content on the card we expect to see.
   * @property {string} state_name - the state the card should be associated to.
   */

  /** @return {Array.<(ElementFinder) => boolean>} */
  var _buildCardPredicate = function(cardMatchOptions) {
    var predicates = [];
    if (cardMatchOptions.state_name !== undefined) {
      predicates.push(c => _cardHasStateName(c, cardMatchOptions.state_name));
    }
    if (cardMatchOptions.card_title !== undefined) {
      predicates.push(c => _cardHasTitle(c, cardMatchOptions.card_title));
    }
    if (cardMatchOptions.card_type !== undefined) {
      predicates.push(c => _cardHasType(c, cardMatchOptions.card_type));
    }
    if (cardMatchOptions.card_content !== undefined) {
      predicates.push(c => _cardHasContent(c, cardMatchOptions.card_content));
    }
    return (cardElement) => {
      return Promise.all(predicates.map(predicate => predicate(cardElement)))
        .then(results => results.every(booleanValue => booleanValue));
    };
  };

  /** @param {CardMatchOptions} cardMatchOptions */
  var _getFirstMatchingCard = function(cardMatchOptions) {
    const isMatchingCard = _buildCardPredicate(cardMatchOptions);
    return cardsContainer.all(cardLocator).filter(isMatchingCard).first();
  };

  this.setOnlyShowOpenCards = function(choice) {
    if (choice !== onlyOpenInput.isSelected()) {
      onlyOpenInput.click();
    }
  };

  this.verifyAnswerDetails = function(
      expectedAnswerDetails, expectedAnswerInfoCount) {
    expect(answerDetails.getText()).toMatch(expectedAnswerDetails);
    expect(answerInfoCount.getText()).toMatch(String(expectedAnswerInfoCount));
  };

  this.closeModal = function() {
    waitFor.elementToBeClickable(
      closeModalButton, 'Close button takes too long to become clickable');
    closeModalButton.click();
  };

  this.getMatchingAnswerDetailsCard = function(stateName) {
    return _getFirstMatchingCard({
      state_name: stateName,
      card_type: 'answer-details',
    });
  };

  this.getThreadMessages = function() {
    return threadMessagesContainer.all(threadMessageLocator)
      .map(m => m.getText());
  };

  this.sendResponseAndCloseModal = function(feedbackResponse, feedbackStatus) {
    responseTextarea.sendKeys(feedbackResponse);
    if (feedbackStatus) {
      responseStatusSelect.click();
      $('option[label="' + feedbackStatus + '"]').click();
    }
    responseSendButton.click();
  };

  this.getMatchingFeedbackCard = function(titleSubstring) {
    return _getFirstMatchingCard({
      card_title: titleSubstring,
      card_type: 'feedback',
    });
  };

  this.getMatchingSuggestionCard = function(description) {
    return _getFirstMatchingCard({
      card_content: description,
      card_type: 'suggestion',
    });
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

  this.getCardStatus = function(card) {
    return card.element(cardStatusLocator).getText();
  };

  this.clickCardActionButton = function(card, buttonText) {
    var buttonElement = card.element(
      buttonText ? by.buttonText(buttonText) : actionButtonLocator);
    waitFor.elementToBeClickable(
      buttonElement, 'Action button takes too long to become clickable');
    buttonElement.click();
  };
};

exports.ExplorationEditorImprovementsTab = ExplorationEditorImprovementsTab;
