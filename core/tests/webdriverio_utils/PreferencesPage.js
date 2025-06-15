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
 * @fileoverview Page object for the preferences page, for use in WebdriverIO
 * tests.
 */

var action = require('../webdriverio_utils/action.js');
var waitFor = require('./waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var PreferencesPage = function () {
  var USER_PREFERENCES_URL = '/preferences';
  var audioLanguageSelector = $('.e2e-test-audio-language-selector');
  var customProfilePhoto = $('.e2e-test-custom-photo');
  var editorRoleEmailsCheckbox = $('.e2e-test-editor-role-email-checkbox');
  var emailUpdatesCheckbox = $('.e2e-test-email-updates-checkbox');
  var feedbackMessageEmailsCheckbox = $(
    '.e2e-test-feedback-message-email-checkbox'
  );
  var languageSelector = $('.e2e-test-site-language-selector');
  var navBar = $('.e2e-test-navbar-dropdown-toggle');
  var pageHeader = $('.e2e-test-preferences-title');
  var profilePhotoClickable = $('.e2e-test-photo-clickable');
  var profilePhotoCropper = $('.e2e-test-photo-crop .cropper-container');
  var profilePhotoUploadError = $('.e2e-test-upload-error');
  var saveChangesButton = $('.e2e-test-save-changes-button');
  var subscription = $('.e2e-test-subscription-name');
  var subscriptionsSelector = function () {
    return $$('.e2e-test-subscription-name');
  };
  var userBioElement = $('.e2e-test-user-bio');
  var userInterestsInput = $('.e2e-test-subject-interests-input');

  var saveNewChanges = async function (fieldName) {
    // If the following click event is omitted, the '(change)' event
    // won't be triggered for language-selector, failing to register changes.
    await action.click('Navbar Button', navBar);
    await clickSaveChangesButton();
    // Due to screen dimensions in e2e tests, the Info toast overlaps
    // with the 'Save Changes' button. To avoid this collision, we click
    // on a neutral element to move the cursor away.
    await action.click('Navbar Button', navBar);
    await waitFor.visibilityOfInfoToast(
      `Info toast for saving ${fieldName} takes too long to appear.`
    );
    await waitFor.invisibilityOfInfoToast(
      'Info toast takes too long to disappear.'
    );
  };

  var clickSaveChangesButton = async function () {
    await action.click('Save Changes button', saveChangesButton);
  };

  this.get = async function () {
    await browser.url(USER_PREFERENCES_URL);
    await waitFor.pageToFullyLoad();
    // Click on a neutral element.
    await action.click('Preferences page header', pageHeader);
  };

  this.expectUploadError = async function () {
    expect(await profilePhotoUploadError.isDisplayed()).toBe(true);
  };

  this.uploadProfilePhoto = async function (imgPath, resetExistingImage) {
    return await workflow.uploadImage(
      profilePhotoClickable,
      imgPath,
      resetExistingImage
    );
  };

  this.submitProfilePhoto = async function (imgPath, resetExistingImage) {
    await workflow.submitImage(
      profilePhotoClickable,
      profilePhotoCropper,
      imgPath,
      resetExistingImage
    );
    await clickSaveChangesButton();
    await waitFor.pageToFullyLoad();
    // Click on a neutral element.
    await action.click('Preferences page header', pageHeader);
  };

  this.getProfilePhotoSource = async function () {
    return await workflow.getImageSource(customProfilePhoto);
  };

  /**
   * Appends given text to the existing user bio in the preferences page.
   *
   * @param {string} bio - The text to append to the existing user bio.
   */
  this.editUserBio = async function (bio) {
    await action.addValue('User bio field', userBioElement, bio);
    await saveNewChanges('User Bio');
  };

  this.toggleEmailUpdatesCheckbox = async function () {
    await action.click('Email Updates checkbox', emailUpdatesCheckbox);
    await saveNewChanges('Email Updates');
  };

  this.toggleEditorRoleEmailsCheckbox = async function () {
    await action.click('Editor role emails checkbox', editorRoleEmailsCheckbox);
    await saveNewChanges('Editor Role Emails');
  };

  this.toggleFeedbackEmailsCheckbox = async function () {
    await action.click(
      'Feedback emails checkbox',
      feedbackMessageEmailsCheckbox
    );
    await saveNewChanges('Feedback Emails');
  };

  this.selectSystemLanguage = async function (language) {
    await action.click('system language selector', languageSelector);
    var dropdownSelectorString = '#mat-select-0-panel';
    var dropdownOption = $(`.mat-option-text=${language}`);

    /*
      The 'click' method of WebDriverIO sometimes fails to click the elements
      which are not 'fully' visible in the viewport. Refer http://v4.webdriver.io/api/action/click.html.
      In our case 'English' option might be partially hidden under the 'Search'
      input field in the mat-select component as WebdriverIO doesn't scroll the
      required dropdown 'fully' into the viewport before clicking it.
      Note: the 'Search' input field is sticky to the top of the dropdown.
      Refer the Known Problems section in the link https://www.npmjs.com/package/ngx-mat-select-search#known-problems

      To ensure that options like 'English' are correctly clicked at all times,
      we scroll the dropdown  programmatically until the required option is
      fully displayed in the viewport unlike in the other cases.
    */

    await browser.execute(selector => {
      var element = document.querySelector(`${selector}`);
      element.scrollTop = 0;
    }, dropdownSelectorString);

    while (true) {
      if (await dropdownOption.isDisplayedInViewport()) {
        break;
      }
      await browser.execute(selector => {
        var element = document.querySelector(`${selector}`);
        element.scrollTop += 100;
      }, dropdownSelectorString);
    }

    await dropdownOption.waitForDisplayed({timeout: 5000});
    await dropdownOption.waitForClickable({timeout: 5000});
    await action.click('clickable', dropdownOption);
    await saveNewChanges('System Language');
  };

  this.selectPreferredAudioLanguage = async function (language) {
    await action.click('clickable', audioLanguageSelector);
    var dropdownOption = $(`.mat-option-text=${language}`);
    await action.click('clickable', dropdownOption);
    await saveNewChanges('Preferred Audio Language');
  };

  /**
   * Replaces the existing user bio with the given text in the preferences page.
   *
   * @param {string} bio - The new bio text to set for the user.
   */
  this.setUserBio = async function (bio) {
    var inputFieldName = 'User bio input field';
    await action.clear(inputFieldName, userBioElement);
    await action.setValue(inputFieldName, userBioElement, bio);
    await saveNewChanges('User Bio');
  };

  // Here Newline Character is used as ENTER KEY.
  this.setUserInterests = async function (interests) {
    await action.click('User Interest Input', userInterestsInput);
    for (var i = 0; i < interests.length; i++) {
      await action.setValue(
        'User Interest Input',
        userInterestsInput,
        interests[i] + '\n'
      );
      await saveNewChanges('User Interests');
    }
  };

  // This function only compares the text displayed on the subscription (which
  // might be abbreviated), rather than the text on the popover that appears
  // when hovering over the tile.
  this.expectDisplayedFirstSubscriptionToBe = async function (name) {
    await waitFor.visibilityOf(
      subscription,
      'subscription taking too long to appear.'
    );
    var subscriptions = await subscriptionsSelector();
    expect(await subscriptions[0].getText()).toMatch(name);
  };

  // This function only compares the text displayed on the subscription (which
  // might be abbreviated), rather than the text on the popover that appears
  // when hovering over the tile.
  this.expectDisplayedLastSubscriptionToBe = async function (name) {
    var subscriptions = await subscriptionsSelector();
    var last = subscriptions.length - 1;
    await waitFor.visibilityOf(
      subscriptions[last],
      'subscriptions[last] taking too long to appear.'
    );
    expect(await subscriptions[last].getText()).toMatch(name);
  };

  this.expectPageHeaderToBe = async function (text) {
    await waitFor.visibilityOf(
      pageHeader,
      'pageHeader taking too long to appear.'
    );
    expect(await pageHeader.getText()).toEqual(text);
  };

  this.expectPreferredSiteLanguageToBe = async function (language) {
    await waitFor.visibilityOf(
      languageSelector,
      'languageSelector taking too long to appear.'
    );
    expect(await languageSelector.getText()).toEqual(language);
  };

  this.expectPreferredAudioLanguageToBe = async function (language) {
    await waitFor.visibilityOf(
      audioLanguageSelector,
      'audio language selector taking too long to appear.'
    );
    expect(await audioLanguageSelector.getText()).toEqual(language);
  };

  this.expectPreferredAudioLanguageNotToBe = async function (language) {
    await waitFor.visibilityOf(
      audioLanguageSelector,
      'audio language selector taking too long to appear.'
    );
    expect(await audioLanguageSelector.getText()).not.toEqual(language);
  };

  this.expectSubscriptionCountToEqual = async function (expectedCount) {
    if (expectedCount > 0) {
      await waitFor.visibilityOf(
        subscription,
        'Subscription tile is not visible'
      );
    }
    let actualCount = await subscriptionsSelector().length;
    expect(actualCount).toEqual(expectedCount);
  };
};

exports.PreferencesPage = PreferencesPage;
