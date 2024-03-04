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
 * @fileoverview Page object for the contributor dashboard admin page,
 * for use in Webdriverio tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');
var users = require('./users.js');

var ContributorDashboardAdminPage = function() {
  var CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION = 'REVIEW_TRANSLATION';
  var CD_USER_RIGHTS_CATEGORY_REVIEW_VOICEOVER = 'VOICEOVER';
  var CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION = 'REVIEW_QUESTION';
  var CATEGORY_SUBMIT_QUESTION = 'SUBMIT_QUESTION';

  var addContributionRightsForm = $('.e2e-test-add-contribution-rights-form');
  var viewContributionRightsForm = $(
    '.e2e-test-view-contribution-rights-form');
  var languageSelectCss = '.e2e-test-form-language-select';
  var contributorUsernameCss = '.e2e-test-form-contributor-username';
  var categorySelectCss = '.e2e-test-form-contribution-rights-category-select';
  var contributionRightsFormSubmitButtonCss = (
    '.e2e-test-contribution-rights-form-submit-button');
  var userTranslationReviewerLanguageCss = (
    '.e2e-test-translation-reviewer-language');
  var userVoiceoverReviewerLanguageCss = (
    '.e2e-test-voiceover-reviewer-language');
  var userQuestionReviewerCss = '.e2e-test-question-reviewer';
  var userQuestionContributorCss = '.e2e-test-question-contributor';
  var viewContributionRightsMethodInputCss = (
    '.e2e-test-view-contribution-rights-method');
  var statusMessage = $('.e2e-test-status-message');
  var statsListItemsSelector = function() {
    return $$('.e2e-test-stats-list-item');
  };
  var statsTable = $('.e2e-test-stats-table');
  var expandedRow = $('.e2e-test-expanded-row');
  var copyButton = $('.e2e-test-copy-button');
  var doneButton = $('.e2e-test-close-rich-text-component-editor');
  var saveButton = $('.e2e-test-save-button');
  var textbox = $('.e2e-test-description-box');
  var acceptButton = $('.e2e-test-translation-accept-button');
  var questionSubmitterTab = $('.e2e-test-question-submitters-tab');
  var questionReviewerTab = $('.e2e-test-question-reviewers-tab');
  var translationSubmitterTab = $('.e2e-test-translation-submitters-tab');
  var translationReviewerTab = $('.e2e-test-translation-reviewers-tab');
  var languageSelector = $('.e2e-test-language-selector');
  var noDataMessage = $('.e2e-test-no-data-message');
  var loadingMessage = $('.e2e-test-loading-message');
  var languageDropdown = $('.e2e-test-language-selector-dropdown');

  this.get = async function() {
    await browser.url('/contributor-admin-dashboard');
    await waitFor.pageToFullyLoad();
  };

  var _assignContributionRights = async function(
      username, category, languageDescription = null) {
    await waitFor.visibilityOf(
      addContributionRightsForm, 'Assign reviewer form is not visible');

    var usernameInputField = addContributionRightsForm.$(
      contributorUsernameCss);
    await action.setValue(
      'Username input field', usernameInputField, username);

    var categorySelectField = addContributionRightsForm.$(
      categorySelectCss);
    await action.select(
      'Review category selector', categorySelectField, category);

    if (languageDescription !== null) {
      var languageSelectField = addContributionRightsForm.$(
        languageSelectCss);
      await action.select(
        'Language selector', languageSelectField, languageDescription);
    }

    var submitButton = addContributionRightsForm.$(
      contributionRightsFormSubmitButtonCss);
    await action.click('Submit assign reviewer button', submitButton);

    await waitFor.textToBePresentInElement(
      statusMessage, 'Success', (
        'Status message for adding contribution rights takes too long to' +
        ' appear'));
  };

  var _getUserContributionRightsElement = async function(username, category) {
    await waitFor.visibilityOf(
      viewContributionRightsForm, 'View reviewer form is not visible');

    var viewMethodInput = viewContributionRightsForm.$(
      viewContributionRightsMethodInputCss);
    await action.select(
      'Reviewer view method dropdown', viewMethodInput, 'By Username');

    var usernameInputField = viewContributionRightsForm.$(
      contributorUsernameCss);
    await action.setValue(
      'Username input field', usernameInputField, username);

    var submitButton = viewContributionRightsForm.$(
      contributionRightsFormSubmitButtonCss);
    await action.click('View reviewer role button', submitButton);

    await waitFor.textToBePresentInElement(
      statusMessage, 'Success',
      'Could not view contribution rights successfully');

    if (category === CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION) {
      return $$(userTranslationReviewerLanguageCss);
    } else if (category === CD_USER_RIGHTS_CATEGORY_REVIEW_VOICEOVER) {
      return $$(userVoiceoverReviewerLanguageCss);
    } else if (category === CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION) {
      return $(userQuestionReviewerCss);
    } else if (category === CATEGORY_SUBMIT_QUESTION) {
      return $(userQuestionContributorCss);
    }
  };

  this.copyElementWithClassName = async function(
      elementDescription, elementClassName) {
    await action.click('Copy button', copyButton);
    await action.click(elementDescription, elementClassName);
    await action.setValue(
      'Set Image description', textbox, 'An example description');
    await action.click('Copy Done button', doneButton);
    await action.click('Save button', saveButton);
    await users.logout();
  };

  this.acceptTranslation = async function() {
    await action.click('Translation accept button', acceptButton);
  };

  this.navigateToQuestionSubmitterTab = async function() {
    await action.click('Question Submitter tab', questionSubmitterTab);
  };

  this.navigateToQuestionReviewerTab = async function() {
    await action.click('Question Reviewer tab', questionReviewerTab);
  };

  this.navigateToTranslationSubmitterTab = async function() {
    await action.click('Translation Submitter tab', translationSubmitterTab);
  };

  this.navigateToTranslationReviewerTab = async function() {
    await action.click('Translation Reviewer tab', translationReviewerTab);
  };

  this.assignTranslationReviewer = async function(
      username, languageDescription) {
    await _assignContributionRights(
      username,
      CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
      languageDescription);
  };

  this.assignVoiceoverReviewer = async function(username, languageDescription) {
    await _assignContributionRights(
      username,
      CD_USER_RIGHTS_CATEGORY_REVIEW_VOICEOVER,
      languageDescription);
  };

  this.assignQuestionReviewer = async function(username) {
    await _assignContributionRights(
      username, CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION);
  };

  this.assignQuestionContributor = async function(username) {
    await _assignContributionRights(username, CATEGORY_SUBMIT_QUESTION);
  };

  this.switchLanguage = async function(language) {
    await action.click('Language Selector', languageSelector);
    await waitFor.visibilityOf(
      languageDropdown, 'Language Dropdown not visible');
    var selectorOption = languageSelector.$(
      `.e2e-test-language-selector-option=${language}`);
    await action.click(`${language} option selector`, selectorOption);
    await action.click('Language Selector', languageSelector);
  };

  this.expectUserToBeTranslationReviewer = async function(
      username, languageDescription) {
    var contributionRights = await _getUserContributionRightsElement(
      username, CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION);
    var languageList = await Promise.all(
      contributionRights.map(function(languageElem) {
        return languageElem.getText();
      }));
    expect(languageList).toContain(languageDescription);
  };

  this.expectUserToBeVoiceoverReviewer = async function(
      username, languageDescription) {
    var contributionRights = await _getUserContributionRightsElement(
      username, CD_USER_RIGHTS_CATEGORY_REVIEW_VOICEOVER);
    var languageList = await Promise.all(contributionRights.map(
      function(languageElem) {
        return languageElem.getText();
      }));
    expect(languageList).toContain(languageDescription);
  };

  this.expectUserToBeQuestionReviewer = async function(username) {
    var contributionRights = await _getUserContributionRightsElement(
      username, CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION);
    await waitFor.visibilityOf(
      contributionRights,
      'Review Question Right Element taking too long to appear');
    expect(await contributionRights.getText()).toBe('Allowed');
  };

  this.expectUserToBeQuestionContributor = async function(username) {
    var contributionRights = await _getUserContributionRightsElement(
      username, CATEGORY_SUBMIT_QUESTION);
    await waitFor.visibilityOf(
      contributionRights,
      'Submit Question Right Element taking too long to appear');
    expect(await contributionRights.getText()).toBe('Allowed');
  };

  this.expectStatsElementCountToBe = async function(elementsCount) {
    await waitFor.invisibilityOf(
      loadingMessage, 'Loading message did not disappear');
    await waitFor.visibilityOf(statsTable, 'stats table is not visible');
    var statsListItems = await statsListItemsSelector();
    expect(statsListItems.length).toBe(elementsCount);
  };

  this.expectNoStatsElement = async function() {
    await waitFor.invisibilityOf(
      loadingMessage, 'Loading message did not disappear');
    await waitFor.visibilityOf(
      noDataMessage, 'No data message is not visible');
  };

  this.expectStatsRowsAreExpanded = async function() {
    await waitFor.visibilityOf(statsTable, 'Stats table was not visible');
    var statsListItems = await statsListItemsSelector();
    await action.click('Stats row', statsListItems[0]);
    await waitFor.visibilityOf(expandedRow, 'Expanded row not visible');
    await action.click('Stats row', statsListItems[0]);
    await waitFor.invisibilityOf(expandedRow, 'Expanded row still visible');
  };

  this.waitForLoadingMessageToDisappear = async function() {
    await waitFor.invisibilityOf(
      loadingMessage, 'Loading message did not disappear');
  };
};

exports.ContributorDashboardAdminPage = ContributorDashboardAdminPage;
