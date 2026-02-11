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
 * @fileoverview Page object for the contributor dashboard, for use in
 * Webdriverio tests.
 */
var waitFor = require('./waitFor.js');
var action = require('./action.js');
var forms = require('./forms.js');

var ContributorDashboardTranslateTextTab = require('../webdriverio_utils/ContributorDashboardTranslateTextTab.js');

var ContributorDashboardPage = function () {
  var navigateToTranslateTextTabButton = $('.e2e-test-translateTextTab');
  var submitQuestionTabButton = $('.e2e-test-submitQuestionTab');
  var myContributionTabButton = $('.e2e-test-myContributionTab');
  var availableTaskLabel = $('.e2e-test-available-task-label');
  var opportunityLoadingPlaceholder = $(
    '.e2e-test-opportunity-loading-placeholder'
  );
  var opportunityListEmptyAvailabilityMessage = $(
    '.e2e-test-opportunity-list-empty-availability-message'
  );
  var opportunityListItemsSelector = function () {
    return $$('.e2e-test-opportunity-list-item');
  };
  var reviewButtonsSelector = function () {
    return $$('.e2e-test-review-buttons');
  };
  var opportunityHeadingCss = '.e2e-test-opportunity-list-item-heading';
  var opportunitySubheadingCss = '.e2e-test-opportunity-list-item-subheading';
  var opportunityActionButtonCss = '.e2e-test-opportunity-list-item-button';
  var opportunityLabelCss = '.e2e-test-opportunity-list-item-label';
  var opportunityProgressPercentageCss =
    '.e2e-test-opportunity-list-item-progress-percentage';
  var acceptTranslationSuggestionButton = $(
    '.e2e-test-translation-accept-button'
  );
  var acceptQuestionSuggestionButton = $(
    '.e2e-test-question-suggestion-review-accept-button'
  );
  var rejectQuestionSuggestionButton = $(
    '.e2e-test-question-suggestion-review-reject-button'
  );
  var questionSuggestionReviewMessageInput = $(
    '.e2e-test-suggestion-review-message'
  );
  var questionReviewModalHeader = $(
    '.e2e-test-question-suggestion-review-modal-header'
  );
  var translationRichTextEditorTag = $('.e2e-test-state-translation-editor');
  var saveTranslationButton = $('.e2e-test-save-button');
  var usernameContainer = $('.e2e-test-username');
  var reviewRightsDiv = $('.e2e-test-review-rights');
  var selectorContainer = $('.e2e-test-language-selector');
  var selectorDropdownContainer = $('.e2e-test-language-selector-dropdown');

  var _openLanguageSelector = async function () {
    await action.click('Language Selector Container', selectorContainer);
    await waitFor.visibilityOf(
      selectorDropdownContainer,
      'Language selector dropdown takes too long to appear'
    );
  };

  var _selectLanguage = async function (language) {
    await _openLanguageSelector();
    var selectorOption = selectorContainer.$(
      `.e2e-test-language-selector-option=${language}`
    );
    await action.click(`Language ${language} option`, selectorOption);
  };

  this.get = async function () {
    let width = (await browser.getWindowSize()).width;
    await browser.url('/contributor-dashboard');
    if (width > 700) {
      await waitFor.pageToFullyLoad();
      await waitFor.visibilityOf(
        usernameContainer,
        'Username takes too much time to load'
      );
    }
  };

  this.getTranslateTextTab = function () {
    return new ContributorDashboardTranslateTextTab.ContributorDashboardTranslateTextTab();
  };

  this.waitForOpportunitiesToLoad = async function () {
    await waitFor.invisibilityOf(
      opportunityLoadingPlaceholder,
      'Opportunity placeholders take too long to become invisible.'
    );
  };

  this.waitForQuestionSuggestionReviewModalToAppear = async function () {
    await waitFor.visibilityOf(
      questionReviewModalHeader,
      'Question suggestion review modal takes too long to appear'
    );
  };

  this.expectUserToBeTranslationReviewer = async function (language) {
    await waitFor.visibilityOf(
      reviewRightsDiv,
      'User does not have rights to review translation'
    );

    var translationReviewRightsElement = $(
      `.e2e-test-translation-${_convertlanguageToKebabCase(language)}-reviewer`
    );
    await waitFor.visibilityOf(
      translationReviewRightsElement,
      'User does not have rights to review translation in language: ' + language
    );
  };

  var _convertlanguageToKebabCase = function (languageDescription) {
    let lang = languageDescription.replaceAll(' ', '-').toLowerCase();
    return lang.replace(/\(?\)?/g, '');
  };

  var _expectUserToBeReviewer = async function (
    reviewCategory,
    langaugeDescription = null
  ) {
    await waitFor.visibilityOf(
      reviewRightsDiv,
      'Review rights div is not visible, so user does not have rights to ' +
        'review ' +
        reviewCategory
    );
    var reviewRightsElementClassName = `.e2e-test-${reviewCategory}`;
    if (langaugeDescription !== null) {
      let language = _convertlanguageToKebabCase(langaugeDescription);
      reviewRightsElementClassName += '-' + language;
    }
    reviewRightsElementClassName += '-reviewer';

    var reviewRightsElement = $(reviewRightsElementClassName);
    await waitFor.visibilityOf(
      reviewRightsElement,
      'Review right element ' + reviewCategory + ' is not visible'
    );
  };

  this.expectUserToBeTranslationReviewer = async function (
    langaugeDescription
  ) {
    await _expectUserToBeReviewer('translation', langaugeDescription);
  };

  this.expectUserToBeVoiceoverReviewer = async function (langaugeDescription) {
    await _expectUserToBeReviewer('voiceover', langaugeDescription);
  };

  this.expectUserToBeQuestionReviewer = async function () {
    await _expectUserToBeReviewer('question');
  };

  this.expectNumberOfOpportunitiesToBe = async function (number) {
    var opportunityCount = (await _getOpportunityElements()).length;
    expect(opportunityCount).toBe(number);
  };

  this.expectEmptyOpportunityAvailabilityMessage = async function () {
    await waitFor.visibilityOf(
      opportunityListEmptyAvailabilityMessage,
      'Opportunity list is not empty'
    );
  };

  var _getOpportunityElements = async function () {
    await waitFor.visibilityOf(
      $(opportunityHeadingCss),
      'Opportunity Heading takes too long to appear.'
    );

    var opportunityListItems = await opportunityListItemsSelector();
    var opportunityCount = opportunityListItems.length;
    var opportunityElements = [];
    for (var i = 0; i < opportunityCount; i++) {
      var opportunityElement = opportunityListItems[i];
      if (await opportunityElement.isDisplayed()) {
        opportunityElements.push(opportunityElement);
      }
    }
    return opportunityElements;
  };

  var _getOpportunityWithHeadingAndSubheading = async function (
    expectedHeading,
    expectedSubheading
  ) {
    var opportunityElements = await _getOpportunityElements();

    for (var i = 0; i < opportunityElements.length; i++) {
      var opportunity = opportunityElements[i];

      var headingElement = opportunity.$(opportunityHeadingCss);
      await waitFor.visibilityOf(
        headingElement,
        'Opportunity heading ' + i + ' is taking too much time to ' + 'appear'
      );
      var heading = await headingElement.getText();

      var subheadingElement = opportunity.$(opportunitySubheadingCss);
      await waitFor.visibilityOf(
        subheadingElement,
        'Opportunity subheading ' + i + ' is taking too much time to appear'
      );
      var subheading = await subheadingElement.getText();

      if (expectedHeading === heading && expectedSubheading === subheading) {
        return opportunity;
      }
    }

    return null;
  };

  this.expectOpportunityWithPropertiesToExist = async function (
    expectedHeading,
    expectedSubheading,
    expectedLabel,
    expectedPercentage
  ) {
    await this.waitForOpportunitiesToLoad();
    var opportunity = await _getOpportunityWithHeadingAndSubheading(
      expectedHeading,
      expectedSubheading
    );
    expect(opportunity === null).toBeFalse();

    if (expectedLabel !== null) {
      var labelElement = opportunity.$(opportunityLabelCss);
      await waitFor.visibilityOf(
        labelElement,
        'Opportunity label is taking too much time to appear'
      );
      var label = await labelElement.getText();
      expect(expectedLabel).toBe(label);
    }

    if (expectedPercentage !== null) {
      var percentageElement = opportunity.$(opportunityProgressPercentageCss);
      await waitFor.visibilityOf(
        percentageElement,
        'Opportunity percentage is taking too much time to appear'
      );
      percentage = await percentageElement.getText();
      expect(expectedPercentage).toBe(percentage);
    }
  };

  this.clickOpportunityActionButton = async function (
    opportunityHeading,
    opportunitySubheading
  ) {
    await this.waitForOpportunitiesToLoad();
    var opportunity = await _getOpportunityWithHeadingAndSubheading(
      opportunityHeading,
      opportunitySubheading
    );
    await waitFor.visibilityOf(
      opportunity,
      'Opportunity taking too long to appear.'
    );
    expect(opportunity === null).toBeFalse();
    await action.click(
      'Opportunity action button',
      opportunity.$(opportunityActionButtonCss)
    );
  };

  this.setTranslation = async function (richTextInstructions) {
    var richTextEditor = await forms.RichTextEditor(
      translationRichTextEditorTag
    );
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    await action.click('Save Translation button', saveTranslationButton);
  };

  this.clickAcceptTranslationSuggestionButton = async function () {
    await action.click(
      'Translation accept button',
      acceptTranslationSuggestionButton
    );
  };

  this.clickAcceptQuestionSuggestionButton = async function () {
    await action.click(
      'Question suggestion accept button',
      acceptQuestionSuggestionButton
    );
  };

  this.clickRejectQuestionSuggestionButton = async function () {
    await action.click(
      'Reject question suggestion button',
      rejectQuestionSuggestionButton
    );
  };

  this.setQuestionSuggestionReviewMessage = async function (message) {
    await action.setValue(
      'Question suggestion review message input field',
      questionSuggestionReviewMessageInput,
      message
    );
  };

  this.navigateToTranslateTextTab = async function () {
    await action.click(
      'Translate text tab button',
      navigateToTranslateTextTabButton
    );
    await this.waitForOpportunitiesToLoad();
  };

  this.navigateToSubmitQuestionTab = async function () {
    await action.click('Submit question tab button', submitQuestionTabButton);
    await this.waitForOpportunitiesToLoad();
  };

  this.navigateToMyContributionTab = async function () {
    await action.click('My Contribution tab button', myContributionTabButton);
    await this.waitForOpportunitiesToLoad();
  };

  this.waitForAvailableTaskLabelToAppear = async function () {
    await waitFor.visibilityOf(
      availableTaskLabel,
      'Opportunity taking too long to appear.'
    );
  };

  this.selectTranslationReviewButton = async function () {
    var reviewButtons = await reviewButtonsSelector();
    await action.click('Translation Review Button', reviewButtons[1]);
  };

  this.selectReviewLanguage = async function (language) {
    await _selectLanguage(language);
  };
};

exports.ContributorDashboardPage = ContributorDashboardPage;
