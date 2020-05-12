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
 * @fileoverview Page object for the community dashboard, for use in Protractor
 * tests.
 */
var waitFor = require('./waitFor.js');

var CommunityDashboardTranslateTextTab = require(
  '../protractor_utils/CommunityDashboardTranslateTextTab.js');
var CommunityDashboardPage = function() {
  var navigateToTranslateTextTabButton = element(
    by.css('.protractor-test-translateTextTab'));
  var submitQuestionTabButton = element(
    by.css('.protractor-test-submitQuestionTab'));
  var opportunityLoadingPlaceholder = element(
    by.css('.protractor-test-opportunity-loading-placeholder'));
  var opportunityListEmptyAvailabilityMessage = element(
    by.css('.protractor-test-opportunity-list-empty-availability-message'));
  var opportunityListItems = element.all(
    by.css('.protractor-test-opportunity-list-item'));
  var opportunityListItemHeadings = element.all(
    by.css('.protractor-test-opportunity-list-item-heading'));
  var opportunityListItemSubheadings = element.all(
    by.css('.protractor-test-opportunity-list-item-subheading'));
  var opportunityListItemButtons = element.all(
    by.css('.protractor-test-opportunity-list-item-button'));
  var opportunityListItemLabels = element.all(
    by.css('.protractor-test-opportunity-list-item-label'));
  var opportunityListItemProgressPercentages = element.all(
    by.css('.protractor-test-opportunity-list-item-progress-percentage'));
  var acceptQuestionSuggestionButton = element(
    by.css('.protractor-test-question-suggestion-review-accept-button'));
  var rejectQuestionSuggestionButton = element(
    by.css('.protractor-test-question-suggestion-review-reject-button'));
  var questionSuggestionReviewMessageInput = element(
    by.css('.protractor-test-suggestion-review-message'));

  var reviewRightsDiv = element(by.css('.protractor-test-review-rights'));

  this.get = function() {
    browser.get('/community_dashboard');
    waitFor.pageToFullyLoad();
  };

  this.getTranslateTextTab = function() {
    return new CommunityDashboardTranslateTextTab
      .CommunityDashboardTranslateTextTab();
  };

  this.waitForOpportunitiesToLoad = function() {
    waitFor.invisibilityOf(
      opportunityLoadingPlaceholder,
      'Opportunity placeholders take too long to become invisible.');
  };

  this.expectUserToBeTranslationReviewer = function(language) {
    waitFor.visibilityOf(
      reviewRightsDiv, 'User does not have rights to review translation');

    var translationReviewRightsElement = element(by.css(
      '.protractor-test-translation-' + language + '-reviewer'));
    waitFor.visibilityOf(
      translationReviewRightsElement,
      'User does not have rights to review translation in language: ' + language
    );
  };

  var _expectUserToBeReviewer = function(
      reviewCategory, langaugeDescription = null) {
    waitFor.visibilityOf(
      reviewRightsDiv,
      'Review rights div is not visible, so user does not have rights to ' +
      'review ' + reviewCategory);

    var reviewRightsElementClassName = ('.protractor-test-' + reviewCategory);
    if (langaugeDescription !== null) {
      reviewRightsElementClassName += '-' + langaugeDescription;
    }
    reviewRightsElementClassName += '-reviewer';

    var reviewRightsElement = element(by.css(reviewRightsElementClassName));
    waitFor.visibilityOf(
      reviewRightsElement,
      'Review right element ' + reviewCategory + ' is not visible');
  };

  this.expectUserToBeTranslationReviewer = function(langaugeDescription) {
    _expectUserToBeReviewer('translation', langaugeDescription);
  };

  this.expectUserToBeVoiceoverReviewer = function(langaugeDescription) {
    _expectUserToBeReviewer('voiceover', langaugeDescription);
  };

  this.expectUserToBeQuestionReviewer = function() {
    _expectUserToBeReviewer('question');
  };

  this.expectNumberOfOpportunitiesToBe = function(number) {
    opportunityListItems.then(function(items) {
      expect(items.length).toBe(number);
    });
  };

  this.expectEmptyOpportunityAvailabilityMessage = function() {
    waitFor.visibilityOf(
      opportunityListEmptyAvailabilityMessage,
      'Opportunity list is not empty');
  };

  this.expectOpportunityHeadingToBe = function(opportunityHeading) {
    opportunityListItemHeadings.map(function(headingElement) {
      return headingElement.getText();
    }).then(function(headings) {
      expect(headings).toContain(opportunityHeading);
    });
  };

  this.expectOpportunityListItemSubheadingToBe = function(subheading, index) {
    opportunityListItemSubheadings.then(function(subheadings) {
      expect(subheadings[index].getText()).toEqual(subheading);
    });
  };

  this.expectOpportunityListItemLabelToBe = function(label, index) {
    opportunityListItemLabels.then(function(labels) {
      expect(labels[index].getText()).toEqual(label);
    });
  };

  this.expectOpportunityListItemProgressPercentageToBe = function(
      percentage, index) {
    opportunityListItemProgressPercentages.then(function(percentages) {
      expect(percentages[index].getText()).toEqual(percentage);
    });
  };

  this.clickOpportunityListItemButton = function(index) {
    opportunityListItemButtons.then(function(buttons) {
      buttons[index].click();
    });
  };

  this.clickAcceptQuestionSuggestionButton = function() {
    acceptQuestionSuggestionButton.click();
  };

  this.clickRejectQuestionSuggestionButton = function() {
    rejectQuestionSuggestionButton.click();
  };

  this.setQuestionSuggestionReviewMessage = function(message) {
    waitFor.elementToBeClickable(
      questionSuggestionReviewMessageInput,
      'Question suggestion review message input field not visible');
    questionSuggestionReviewMessageInput.click();
    questionSuggestionReviewMessageInput.sendKeys(message);
  };

  this.navigateToTranslateTextTab = function() {
    waitFor.elementToBeClickable(
      navigateToTranslateTextTabButton, 'Translate text tab is not clickable');
    navigateToTranslateTextTabButton.click();
    waitFor.pageToFullyLoad();
  };

  this.navigateToSubmitQuestionTab = function() {
    waitFor.elementToBeClickable(
      submitQuestionTabButton, 'Submit Question tab is not clickable');
    submitQuestionTabButton.click();
    waitFor.pageToFullyLoad();
  };
};

exports.CommunityDashboardPage = CommunityDashboardPage;
