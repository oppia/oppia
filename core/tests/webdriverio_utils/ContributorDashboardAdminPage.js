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

var ContributorDashboardAdminPage = function() {
  var CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION = 'REVIEW_TRANSLATION';
  var CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER = 'VOICEOVER';
  var CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION = 'REVIEW_QUESTION';
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

  this.get = async function() {
    await browser.url('/contributor-dashboard-admin');
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

    if (category === CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION) {
      return $$(userTranslationReviewerLanguageCss);
    } else if (category === CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER) {
      return $$(userVoiceoverReviewerLanguageCss);
    } else if (category === CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION) {
      return $(userQuestionReviewerCss);
    } else if (category === CATEGORY_SUBMIT_QUESTION) {
      return $(userQuestionContributorCss);
    }
  };

  this.assignTranslationReviewer = async function(
      username, languageDescription) {
    await _assignContributionRights(
      username,
      CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
      languageDescription);
  };

  this.assignVoiceoverReviewer = async function(username, languageDescription) {
    await _assignContributionRights(
      username,
      CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
      languageDescription);
  };

  this.assignQuestionReviewer = async function(username) {
    await _assignContributionRights(
      username, CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION);
  };

  this.assignQuestionContributor = async function(username) {
    await _assignContributionRights(username, CATEGORY_SUBMIT_QUESTION);
  };

  this.expectUserToBeTranslationReviewer = async function(
      username, languageDescription) {
    var contributionRights = await _getUserContributionRightsElement(
      username, CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION);
    var languageList = await Promise.all(
      contributionRights.map(function(languageElem) {
        return languageElem.getText();
      }));
    expect(languageList).toContain(languageDescription);
  };

  this.expectUserToBeVoiceoverReviewer = async function(
      username, languageDescription) {
    var contributionRights = await _getUserContributionRightsElement(
      username, CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER);
    var languageList = await Promise.all(contributionRights.map(
      function(languageElem) {
        return languageElem.getText();
      }));
    expect(languageList).toContain(languageDescription);
  };

  this.expectUserToBeQuestionReviewer = async function(username) {
    var contributionRights = await _getUserContributionRightsElement(
      username, CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION);
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
};

exports.ContributorDashboardAdminPage = ContributorDashboardAdminPage;
