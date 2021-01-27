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
 * @fileoverview Page object for the contributor dashboard, for use in
 * Protractor tests.
 */
var waitFor = require('./waitFor.js');
var action = require('./action.js');

var ContributorDashboardTranslateTextTab = require(
  '../protractor_utils/ContributorDashboardTranslateTextTab.js');
var ContributorDashboardPage = function() {
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
  var opportunityHeadingCss = by.css(
    '.protractor-test-opportunity-list-item-heading');
  var opportunitySubheadingCss = by.css(
    '.protractor-test-opportunity-list-item-subheading');
  var opportunityActionButtonCss = by.css(
    '.protractor-test-opportunity-list-item-button');
  var opportunityLabelCss = by.css(
    '.protractor-test-opportunity-list-item-label');
  var opportunityProgressPercentageCss = by.css(
    '.protractor-test-opportunity-list-item-progress-percentage');
  var acceptQuestionSuggestionButton = element(
    by.css('.protractor-test-question-suggestion-review-accept-button'));
  var rejectQuestionSuggestionButton = element(
    by.css('.protractor-test-question-suggestion-review-reject-button'));
  var questionSuggestionReviewMessageInput = element(
    by.css('.protractor-test-suggestion-review-message'));
  var questionReviewModalHeader = element(by.css(
    '.protractor-test-question-suggestion-review-modal-header'));
  var usernameContainer = element(by.css('.protractor-test-username'));

  var reviewRightsDiv = element(by.css('.protractor-test-review-rights'));

  this.get = async function() {
    await browser.get('/contributor-dashboard');
    await waitFor.visibilityOf(
      usernameContainer, 'Username takes too much time to load');
  };

  this.getTranslateTextTab = function() {
    return new ContributorDashboardTranslateTextTab
      .ContributorDashboardTranslateTextTab();
  };

  this.waitForOpportunitiesToLoad = async function() {
    await waitFor.invisibilityOf(
      opportunityLoadingPlaceholder,
      'Opportunity placeholders take too long to become invisible.');
  };

  this.waitForQuestionSuggestionReviewModalToAppear = async function() {
    await waitFor.visibilityOf(
      questionReviewModalHeader,
      'Question suggestion review modal takes too long to appear');
  };

  this.expectUserToBeTranslationReviewer = async function(language) {
    await waitFor.visibilityOf(
      reviewRightsDiv, 'User does not have rights to review translation');

    var translationReviewRightsElement = element(by.css(
      '.protractor-test-translation-' + language + '-reviewer'));
    await waitFor.visibilityOf(
      translationReviewRightsElement,
      'User does not have rights to review translation in language: ' + language
    );
  };

  var _expectUserToBeReviewer = async function(
      reviewCategory, langaugeDescription = null) {
    await waitFor.visibilityOf(
      reviewRightsDiv,
      'Review rights div is not visible, so user does not have rights to ' +
      'review ' + reviewCategory);

    var reviewRightsElementClassName = ('.protractor-test-' + reviewCategory);
    if (langaugeDescription !== null) {
      reviewRightsElementClassName += '-' + langaugeDescription;
    }
    reviewRightsElementClassName += '-reviewer';

    var reviewRightsElement = element(by.css(reviewRightsElementClassName));
    await waitFor.visibilityOf(
      reviewRightsElement,
      'Review right element ' + reviewCategory + ' is not visible');
  };

  this.expectUserToBeTranslationReviewer = async function(langaugeDescription) {
    await _expectUserToBeReviewer('translation', langaugeDescription);
  };

  this.expectUserToBeVoiceoverReviewer = async function(langaugeDescription) {
    await _expectUserToBeReviewer('voiceover', langaugeDescription);
  };

  this.expectUserToBeQuestionReviewer = async function() {
    await _expectUserToBeReviewer('question');
  };

  this.expectNumberOfOpportunitiesToBe = async function(number) {
    var opportunityCount = (await _getOpportunityElements()).length;
    expect(opportunityCount).toBe(number);
  };

  this.expectEmptyOpportunityAvailabilityMessage = async function() {
    await waitFor.visibilityOf(
      opportunityListEmptyAvailabilityMessage,
      'Opportunity list is not empty');
  };

  var _getOpportunityElements = async function() {
    await waitFor.visibilityOf(
      element(opportunityHeadingCss),
      'Opportunity Heading takes too long to appear.');

    var opportunityCount = await opportunityListItems.count();
    var opportunityElements = [];
    for (var i = 0; i < opportunityCount; i++) {
      var opportunityElement = await opportunityListItems.get(i);
      if (await opportunityElement.isDisplayed()) {
        opportunityElements.push(opportunityElement);
      }
    }
    return opportunityElements;
  };

  var _getOpportunityWithHeadingAndSubheading = async function(
      expectedHeading, expectedSubheading) {
    var opportunityElements = await _getOpportunityElements();

    for (var i = 0; i < opportunityElements.length; i++) {
      var opportunity = opportunityElements[i];

      var headingElement = opportunity.element(opportunityHeadingCss);
      await waitFor.visibilityOf(
        headingElement,
        'Opportunity heading is taking too much time to appear');
      var heading = await headingElement.getText();

      var subheadingElement = opportunity.element(opportunitySubheadingCss);
      await waitFor.visibilityOf(
        subheadingElement,
        'Opportunity subheading is taking too much time to appear');
      var subheading = await subheadingElement.getText();

      if (expectedHeading === heading && expectedSubheading === subheading) {
        return opportunity;
      }
    }

    return null;
  };

  this.expectOpportunityWithPropertiesToExist = async function(
      expectedHeading, expectedSubheading, expectedLabel, expectedPercentage) {
    await this.waitForOpportunitiesToLoad();
    var opportunity = await _getOpportunityWithHeadingAndSubheading(
      expectedHeading, expectedSubheading);
    expect(opportunity).not.toBe(null);

    if (expectedLabel !== null) {
      var labelElement = opportunity.element(opportunityLabelCss);
      await waitFor.visibilityOf(
        labelElement, 'Opportunity label is taking too much time to appear');
      var label = await labelElement.getText();
      expect(expectedLabel).toBe(label);
    }

    if (expectedPercentage !== null) {
      var percentageElement = opportunity.element(
        opportunityProgressPercentageCss);
      await waitFor.visibilityOf(
        percentageElement,
        'Opportunity percentage is taking too much time to appear');
      percentage = await percentageElement.getText();
      expect(expectedPercentage).toBe(percentage);
    }
  };

  this.clickOpportunityActionButton = async function(
      opportunityHeading, opportunitySubheading) {
    await this.waitForOpportunitiesToLoad();
    var opportunity = await _getOpportunityWithHeadingAndSubheading(
      opportunityHeading, opportunitySubheading);
    await waitFor.visibilityOf(
      opportunity,
      'Opportunity taking too long to appear.');
    expect(opportunity).not.toBe(null);
    await action.click(
      'Opportunity action button',
      opportunity.element(opportunityActionButtonCss));
  };

  this.clickAcceptQuestionSuggestionButton = async function() {
    await action.click(
      'Question suggestion accept button', acceptQuestionSuggestionButton);
  };

  this.clickRejectQuestionSuggestionButton = async function() {
    await action.click(
      'Reject question suggestion button', rejectQuestionSuggestionButton);
  };

  this.setQuestionSuggestionReviewMessage = async function(message) {
    await action.sendKeys(
      'Question suggestion review message input field',
      questionSuggestionReviewMessageInput, message);
  };

  this.navigateToTranslateTextTab = async function() {
    await action.click(
      'Translate text tab button', navigateToTranslateTextTabButton);
    await this.waitForOpportunitiesToLoad();
  };

  this.navigateToSubmitQuestionTab = async function() {
    await action.click(
      'Submit question tab button', submitQuestionTabButton);
    await this.waitForOpportunitiesToLoad();
  };
};

exports.ContributorDashboardPage = ContributorDashboardPage;
