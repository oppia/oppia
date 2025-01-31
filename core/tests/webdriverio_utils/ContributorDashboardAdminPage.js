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

var ContributorDashboardAdminPage = function () {
  var CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION = 'REVIEW_TRANSLATION';
  var CD_USER_RIGHTS_CATEGORY_REVIEW_VOICEOVER = 'VOICEOVER';
  var CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION = 'REVIEW_QUESTION';
  var CATEGORY_SUBMIT_QUESTION = 'SUBMIT_QUESTION';

  var addContributionRightsForm = $('.e2e-test-add-contribution-rights-form');
  var viewContributionRightsForm = $('.e2e-test-view-contribution-rights-form');
  var languageSelectCss = '.e2e-test-form-language-select';
  var contributorUsernameCss = '.e2e-test-form-contributor-username';
  var categorySelectCss = '.e2e-test-form-contribution-rights-category-select';
  var contributionRightsFormSubmitButtonCss =
    '.e2e-test-contribution-rights-form-submit-button';
  var userTranslationReviewerLanguageCss =
    '.e2e-test-translation-reviewer-language';
  var userVoiceoverReviewerLanguageCss =
    '.e2e-test-voiceover-reviewer-language';
  var userQuestionReviewerCss = '.e2e-test-question-reviewer';
  var userQuestionContributorCss = '.e2e-test-question-contributor';
  var viewContributionRightsMethodInputCss =
    '.e2e-test-view-contribution-rights-method';
  var statusMessage = $('.e2e-test-status-message');
  var statsListItemsSelector = function () {
    return $$('.e2e-test-stats-list-item');
  };
  var statsTable = $('.e2e-test-stats-table');
  var expandedRow = $('.e2e-test-expanded-row');
  var questionSubmitterTab = $('.e2e-test-question-submitters-tab');
  var questionReviewerTab = $('.e2e-test-question-reviewers-tab');
  var translationSubmitterTab = $('.e2e-test-translation-submitters-tab');
  var translationReviewerTab = $('.e2e-test-translation-reviewers-tab');
  var languageSelector = $('.e2e-test-language-selector');
  var lastDatePickerInput = $('.e2e-test-last-date-picker-input');
  var lastDatePickerToggle = $('.e2e-test-last-date-picker-toggle');
  var noDataMessage = $('.e2e-test-no-data-message');
  var loadingMessage = $('.e2e-test-loading-message');
  var languageDropdown = $('.e2e-test-language-selector-dropdown');

  this.get = async function () {
    await browser.url('/contributor-admin-dashboard');
    await waitFor.pageToFullyLoad();
  };

  var _assignContributionRights = async function (
    username,
    category,
    languageDescription = null
  ) {
    await waitFor.visibilityOf(
      addContributionRightsForm,
      'Assign reviewer form is not visible'
    );

    var usernameInputField = addContributionRightsForm.$(
      contributorUsernameCss
    );
    await action.setValue('Username input field', usernameInputField, username);

    var categorySelectField = addContributionRightsForm.$(categorySelectCss);
    await action.select(
      'Review category selector',
      categorySelectField,
      category
    );

    if (languageDescription !== null) {
      var languageSelectField = addContributionRightsForm.$(languageSelectCss);
      await action.select(
        'Language selector',
        languageSelectField,
        languageDescription
      );
    }

    var submitButton = addContributionRightsForm.$(
      contributionRightsFormSubmitButtonCss
    );
    await action.click('Submit assign reviewer button', submitButton);

    await waitFor.textToBePresentInElement(
      statusMessage,
      'Success',
      'Status message for adding contribution rights takes too long to' +
        ' appear'
    );
  };

  var _getUserContributionRightsElement = async function (username, category) {
    await waitFor.visibilityOf(
      viewContributionRightsForm,
      'View reviewer form is not visible'
    );

    var viewMethodInput = viewContributionRightsForm.$(
      viewContributionRightsMethodInputCss
    );
    await action.select(
      'Reviewer view method dropdown',
      viewMethodInput,
      'By Username'
    );

    var usernameInputField = viewContributionRightsForm.$(
      contributorUsernameCss
    );
    await action.setValue('Username input field', usernameInputField, username);

    var submitButton = viewContributionRightsForm.$(
      contributionRightsFormSubmitButtonCss
    );
    await action.click('View reviewer role button', submitButton);

    await waitFor.textToBePresentInElement(
      statusMessage,
      'Success',
      'Could not view contribution rights successfully'
    );

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

  this.navigateToQuestionSubmitterTab = async function () {
    await action.click('Question Submitter tab', questionSubmitterTab);
  };

  this.navigateToQuestionReviewerTab = async function () {
    await action.click('Question Reviewer tab', questionReviewerTab);
  };

  this.navigateToTranslationSubmitterTab = async function () {
    await action.click('Translation Submitter tab', translationSubmitterTab);
  };

  this.navigateToTranslationReviewerTab = async function () {
    await action.click('Translation Reviewer tab', translationReviewerTab);
  };

  this.assignTranslationReviewer = async function (
    username,
    languageDescription
  ) {
    await _assignContributionRights(
      username,
      CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
      languageDescription
    );
  };

  this.assignVoiceoverReviewer = async function (
    username,
    languageDescription
  ) {
    await _assignContributionRights(
      username,
      CD_USER_RIGHTS_CATEGORY_REVIEW_VOICEOVER,
      languageDescription
    );
  };

  this.assignQuestionReviewer = async function (username) {
    await _assignContributionRights(
      username,
      CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION
    );
  };

  this.assignQuestionContributor = async function (username) {
    await _assignContributionRights(username, CATEGORY_SUBMIT_QUESTION);
  };

  this.switchLanguage = async function (language) {
    await action.click('Language Selector', languageSelector);
    await waitFor.visibilityOf(
      languageDropdown,
      'Language Dropdown not visible'
    );
    var selectorOption = languageSelector.$(
      `.e2e-test-language-selector-option=${language}`
    );
    await action.click(`${language} option selector`, selectorOption);
  };

  this.waitForMonthToAppear = async function (monthCode) {
    /**
    We need to use element selector classes without the "e2e-" prefix
    because the mat-datepicker that we use here does not contain any
    such classes. Since the datepicker is a third-party dependency,
    we cannot edit it to add "e2e-" classes. We cannot use an ancestor
    element with the "e2e-" class because the datepicker's ancestor is
    the body tag.
    **/
    var monthCodeContainer = $('.mat-calendar-content')
      .$('.mat-calendar-table')
      .$('.mat-calendar-body')
      .$('tr')
      .$(`td=${monthCode}`);

    await waitFor.visibilityOf(
      monthCodeContainer,
      'Month code container is not visible'
    );
  };

  this.navigateThroughMonths = async function (numberOfMonths) {
    /**
    We need to use element selector classes without the "e2e-" prefix
    because the mat-datepicker that we use here does not contain any
    such classes. Since the datepicker is a third-party dependency,
    we cannot edit it to add "e2e-" classes. We cannot use an ancestor
    element with the "e2e-" class because the datepicker's ancestor is
    the body tag.
    **/
    var nextMonthButton = $('.mat-calendar-next-button');
    var prevMonthButton = $('.mat-calendar-previous-button');
    var calenderBody = $('.mat-calendar-content')
      .$('.mat-calendar-table')
      .$('.mat-calendar-body')
      .$('tr')
      .$('td');

    var monthCodes = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];

    var monthCode = await calenderBody.getText();
    var monthIndex;
    for (let i = 0; i < 12; i++) {
      if (monthCodes[i] === monthCode) {
        monthIndex = i;
      }
    }

    if (numberOfMonths > 0) {
      for (let i = 0; i < numberOfMonths; i++) {
        await action.click('Next Month Button', nextMonthButton);
        if (monthIndex === 11) {
          monthIndex = 0;
        } else {
          monthIndex++;
        }
        await this.waitForMonthToAppear(monthCodes[monthIndex]);
      }
    } else if (numberOfMonths < 0) {
      for (let i = 0; i < Math.abs(numberOfMonths); i++) {
        await action.click('Previous Month Button', prevMonthButton);
        if (monthIndex === 0) {
          monthIndex = 11;
        } else {
          monthIndex--;
        }
        await this.waitForMonthToAppear(monthCodes[monthIndex]);
      }
    }
  };

  this.selectDate = async function (
    datePickerToggle,
    datePickerInput,
    selectedDate
  ) {
    var initialValueOfDatePicker = await action.getValue(
      'Date Picker Input',
      datePickerInput
    );

    await action.click('Date Picker Toggle', datePickerToggle);

    // Here selectedDate is a Date object that is to be selected by date picker.
    var day = selectedDate.getDate();
    var month = selectedDate.getMonth() + 1;
    var year = selectedDate.getFullYear();

    var yearsToNavigate =
      year - new Date(initialValueOfDatePicker).getFullYear();
    var currentMonth = new Date(initialValueOfDatePicker).getMonth() + 1;
    var monthsToNavigate = month - currentMonth;
    await this.navigateThroughMonths(yearsToNavigate * 12 + monthsToNavigate);

    if (day) {
      /**
      We need to use element selector classes without the "e2e-" prefix
      because the mat-datepicker that we use here does not contain any
      such classes. Since the datepicker is a third-party dependency,
      we cannot edit it to add "e2e-" classes. We cannot use an ancestor
      element with the "e2e-" class because the datepicker's ancestor is
      the body tag.
      **/
      var daySelector = $('.mat-calendar-content')
        .$('.mat-calendar-table')
        .$('.mat-calendar-body')
        .$(`aria/${day}`);
      await waitFor.visibilityOf(daySelector, 'Date to select is not visible');
      await action.click('Day Selector', daySelector);
    }

    var formattedInputDate = `${new Date(selectedDate).toLocaleString('en-US', {
      day: '2-digit',
    })}-${new Date(selectedDate).toLocaleString('en-US', {
      month: 'short',
    })}-${new Date(selectedDate).toLocaleString('en-US', {year: 'numeric'})}`;

    var finalValueOfDatePicker = await action.getValue(
      'Date Picker Input',
      datePickerInput
    );

    expect(finalValueOfDatePicker).toBe(formattedInputDate);
  };

  this.setLastDatePickerValue = async function (selectedDate) {
    await this.selectDate(
      lastDatePickerToggle,
      lastDatePickerInput,
      selectedDate
    );
  };

  this.expectUserToBeTranslationReviewer = async function (
    username,
    languageDescription
  ) {
    var contributionRights = await _getUserContributionRightsElement(
      username,
      CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION
    );
    var languageList = await Promise.all(
      contributionRights.map(function (languageElem) {
        return languageElem.getText();
      })
    );
    expect(languageList).toContain(languageDescription);
  };

  this.expectUserToBeVoiceoverReviewer = async function (
    username,
    languageDescription
  ) {
    var contributionRights = await _getUserContributionRightsElement(
      username,
      CD_USER_RIGHTS_CATEGORY_REVIEW_VOICEOVER
    );
    var languageList = await Promise.all(
      contributionRights.map(function (languageElem) {
        return languageElem.getText();
      })
    );
    expect(languageList).toContain(languageDescription);
  };

  this.expectUserToBeQuestionReviewer = async function (username) {
    var contributionRights = await _getUserContributionRightsElement(
      username,
      CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION
    );
    await waitFor.visibilityOf(
      contributionRights,
      'Review Question Right Element taking too long to appear'
    );
    expect(await contributionRights.getText()).toBe('Allowed');
  };

  this.expectUserToBeQuestionContributor = async function (username) {
    var contributionRights = await _getUserContributionRightsElement(
      username,
      CATEGORY_SUBMIT_QUESTION
    );
    await waitFor.visibilityOf(
      contributionRights,
      'Submit Question Right Element taking too long to appear'
    );
    expect(await contributionRights.getText()).toBe('Allowed');
  };

  this.expectStatsElementCountToBe = async function (elementsCount) {
    await waitFor.invisibilityOf(
      loadingMessage,
      'Loading message did not disappear'
    );
    await waitFor.visibilityOf(statsTable, 'stats table is not visible');
    var statsListItems = await statsListItemsSelector();
    expect(statsListItems.length).toBe(elementsCount);
  };

  this.expectNoStatsElement = async function () {
    await waitFor.invisibilityOf(
      loadingMessage,
      'Loading message did not disappear'
    );
    await waitFor.visibilityOf(noDataMessage, 'No data message is not visible');
  };

  this.expectStatsRowsAreExpanded = async function () {
    await waitFor.visibilityOf(statsTable, 'Stats table was not visible');
    var statsListItems = await statsListItemsSelector();
    await action.click('Stats row', statsListItems[0]);
    await waitFor.visibilityOf(expandedRow, 'Expanded row not visible');
    await action.click('Stats row', statsListItems[0]);
    await waitFor.invisibilityOf(expandedRow, 'Expanded row still visible');
  };

  this.waitForLoadingMessageToDisappear = async function () {
    await waitFor.invisibilityOf(
      loadingMessage,
      'Loading message did not disappear'
    );
  };
};

exports.ContributorDashboardAdminPage = ContributorDashboardAdminPage;
