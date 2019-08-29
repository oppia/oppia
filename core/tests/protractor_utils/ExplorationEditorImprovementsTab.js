<<<<<<< HEAD
// Copyright 2018 The Oppia Authors. All Rights Reserved.
=======
// Copyright 2019 The Oppia Authors. All Rights Reserved.
>>>>>>> upstream/develop
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
<<<<<<< HEAD
 * @fileoverview Page object for the exploration editor's feedback tab, for
 * use in Protractor tests.
 */

var ExplorationEditorImprovementsTab = function() {
  var improvementsOpenCardsCount = element(
    by.css('.protractor-test-improvements-open-cards-count'));

  this.getNumberOfOpenCards = function() {
    return parseInt(improvementsOpenCardsCount.getText());
  };

  /** Cards are returned in top-to-bottom order. */
  this.getCardByIndex = function(cardIndex) {
    return element(
      by.css('.protractor-test-improvement-card' + cardIndex.toString()));
  };

  this.getCardTitle = function(cardElement) {
    return cardElement.element(
      by.css('.oppia-improvement-card-header-title')).getText();
  };

  this.getCardBody = function(cardElement) {
    return cardElement.element(by.css('modal-body'));
  };

  this.getCardStatus = function(cardElement) {
    return cardElement.element(
      by.css('.oppia-improvement-card-header-status-pill')).getText();
  };

  /** Buttons are returned in left-to-right order. */
  this.getActionButtonByIndex = function(cardElement, index) {
    return cardElement.element(
      by.css('.protractor-test-improvement-action-button' + index.toString()));
  };
};
=======
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
  var answerDetailsCardStateName = element(
    by.css('.protractor-test-answer-details-state'));
  var answerInfoCount = element(
    by.css('.protractor-test-answer-info-count'));
  var reviewAnswerDetailsButton = element(
    by.css('.protractor-test-review-answer-details'));
  var answerDetails = element(by.css('.protractor-test-answer-details'));
  var closeAnswerDetailsButton = element(
    by.css('.protractor-test-close-answer-details'));

  var _getAnswerDetailsCardStateName = function() {
    return answerDetailsCardStateName.getText();
  };

  var _getAnswerInfoCount = function() {
    return answerInfoCount.getText();
  };

  var _getAnswerDetails = function() {
    return answerDetails.getText();
  };

  this.navigateReviewAnswerDetails = function() {
    waitFor.elementToBeClickable(
      reviewAnswerDetailsButton,
      'Answer details button takes too long to be clickable');
    reviewAnswerDetailsButton.click();
  };

  this.checkAnswerDetailsCard = function(stateName, count) {
    expect(_getAnswerDetailsCardStateName()).toMatch(stateName);
    expect(_getAnswerInfoCount()).toMatch(count);
  };

  this.verifyAnswerDetails = function(answerDetails) {
    expect(_getAnswerDetails()).toMatch(answerDetails);
    waitFor.elementToBeClickable(
      closeAnswerDetailsButton,
      'Answer details close button takes too long to be clickable');
    closeAnswerDetailsButton.click();
  };
};

exports.ExplorationEditorImprovementsTab = ExplorationEditorImprovementsTab;
>>>>>>> upstream/develop
