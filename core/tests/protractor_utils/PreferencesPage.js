// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the preferences page, for use in Protractor
 * tests.
 */

var action = require('../protractor_utils/action.js');
var waitFor = require('./waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var PreferencesPage = function() {
  var USER_PREFERENCES_URL = '/preferences';
  var emailUpdatesCheckbox = element(
    by.css('.protractor-test-email-updates-checkbox'));
  var editorRoleEmailsCheckbox = element(
    by.css('.protractor-test-editor-role-email-checkbox'));
  var feedbackMessageEmailsCheckbox = element(
    by.css('.protractor-test-feedback-message-email-checkbox'));
  var navBar = element(by.css('.protractor-test-navbar-dropdown-toggle'));
  var pageHeader = element(by.css('.protractor-test-preferences-title'));
  var audioLanguageSelector = (
    element(by.css('.protractor-test-audio-language-selector')));
  var subscriptions = element.all(by.css('.protractor-test-subscription-name'));
  var userBioElement = element(by.css('.protractor-test-user-bio'));
  var userInterestsInput = element(
    by.css('.protractor-test-subject-interests-input'));
  var createrDashboardRadio = element(
    by.css('.protractor-test-creator-dashboard-radio'));
  var learnerDashboardRadio = element(
    by.css('.protractor-test-learner-dashboard-radio'));
  var profilePhotoClickable = element(
    by.css('.protractor-test-photo-clickable'));
  var customProfilePhoto = element(
    by.css('.protractor-test-custom-photo'));
  var profilePhotoCropper = element(
    by.css('.protractor-test-photo-crop .cropper-container'));
  var profilePhotoUploadError = element(
    by.css('.protractor-test-upload-error'));
  var deleteAccountButton = element(
    by.css('.protractor-test-delete-account-button'));
  var exportAccountButton = element(
    by.css('.protractor-test-export-account-button'));

  var saveNewChanges = async function(fieldName) {
    await action.click('Navbar Button', navBar);
    await waitFor.visibilityOfInfoToast(
      `Info toast for saving ${fieldName} takes too long to appear.`);
    await waitFor.invisibilityOfInfoToast(
      'Info toast takes too long to disappear.');
  };

  this.get = async function() {
    await browser.get(USER_PREFERENCES_URL);
    await waitFor.pageToFullyLoad();
  };

  this.expectUploadError = async function() {
    expect(await profilePhotoUploadError.isDisplayed()).toBe(true);
  };

  this.uploadProfilePhoto = async function(imgPath, resetExistingImage) {
    return await workflow.uploadImage(
      profilePhotoClickable, imgPath, resetExistingImage);
  };

  this.submitProfilePhoto = async function(imgPath, resetExistingImage) {
    return await workflow.submitImage(
      profilePhotoClickable, profilePhotoCropper, imgPath, resetExistingImage);
  };

  this.getProfilePhotoSource = async function() {
    return await workflow.getImageSource(customProfilePhoto);
  };

  this.editUserBio = async function(bio) {
    await action.sendKeys('User bio field', userBioElement, bio);
    await saveNewChanges('User Bio');
  };

  this.toggleEmailUpdatesCheckbox = async function() {
    await action.click('Email Updates checkbox', emailUpdatesCheckbox);
    await saveNewChanges('Email Updates');
  };

  this.toggleEditorRoleEmailsCheckbox = async function() {
    await action.click('Editor role emails checkbox', editorRoleEmailsCheckbox);
    await saveNewChanges('Editor Role Emails');
  };

  this.toggleFeedbackEmailsCheckbox = async function() {
    await action.click(
      'Feedback emails checkbox', feedbackMessageEmailsCheckbox);
    await saveNewChanges('Feedback Emails');
  };

  this.selectSystemLanguage = async function(language) {
    var languageSelector = element(
      by.css('.protractor-test-site-language-selector'));
    await action.click('system language selector', languageSelector);
    var dropdownOption = element(
      by.cssContainingText('mat-option .mat-option-text', language));
    await action.click('clickable', dropdownOption);
    await saveNewChanges('System Language');
  };

  this.selectPreferredAudioLanguage = async function(language) {
    await action.click('clickable', audioLanguageSelector);
    var dropdownOption = element(
      by.cssContainingText('mat-option .mat-option-text', language));
    await action.click('clickable', dropdownOption);
    await saveNewChanges('Preferred Audio Language');
  };

  this.setUserBio = async function(bio) {
    var inputFieldName = 'User bio input field';
    await action.clear(inputFieldName, userBioElement);
    await saveNewChanges('User Bio');
    await action.sendKeys(inputFieldName, userBioElement, bio);
    await saveNewChanges('User Bio');
  };

  // Here Newline Character is used as ENTER KEY.
  this.setUserInterests = async function(interests) {
    await action.click('User Interest Input', userInterestsInput);
    for (var i = 0; i < interests.length; i++) {
      await action.sendKeys(
        'User Interest Input', userInterestsInput, interests[i] + '\n');
      await saveNewChanges('User Interests');
    }
  };

  this.isFeedbackEmailsCheckboxSelected = async function() {
    return await feedbackMessageEmailsCheckbox.isSelected();
  };

  this.isEditorRoleEmailsCheckboxSelected = async function() {
    return await editorRoleEmailsCheckbox.isSelected();
  };

  // This function only compares the text displayed on the subscription (which
  // might be abbreviated), rather than the text on the popover that appears
  // when hovering over the tile.
  this.expectDisplayedFirstSubscriptionToBe = async function(name) {
    await waitFor.visibilityOf(
      subscriptions.first(),
      'subscriptions.first() taking too long to appear.');
    expect(await subscriptions.first().getText()).toMatch(name);
  };

  // This function only compares the text displayed on the subscription (which
  // might be abbreviated), rather than the text on the popover that appears
  // when hovering over the tile.
  this.expectDisplayedLastSubscriptionToBe = async function(name) {
    await waitFor.visibilityOf(
      subscriptions.last(),
      'subscriptions.last() taking too long to appear.');
    expect(await subscriptions.last().getText()).toMatch(name);
  };

  this.expectPageHeaderToBe = async function(text) {
    await waitFor.visibilityOf(
      pageHeader, 'pageHeader taking too long to appear.');
    expect(await pageHeader.getText()).toEqual(text);
  };

  this.expectPreferredSiteLanguageToBe = async function(language) {
    var selectedLanguageElement = element(
      by.css('.protractor-test-site-language-selector'));
    await waitFor.visibilityOf(
      selectedLanguageElement,
      'selectedLanguageElement taking too long to appear.');
    expect(await selectedLanguageElement.getText()).toEqual(language);
  };

  this.expectPreferredAudioLanguageToBe = async function(language) {
    await waitFor.visibilityOf(
      audioLanguageSelector,
      'audio language selector taking too long to appear.');
    expect(await audioLanguageSelector.getText()).toEqual(language);
  };

  this.expectPreferredAudioLanguageNotToBe = async function(language) {
    await waitFor.visibilityOf(
      audioLanguageSelector,
      'audio language selector taking too long to appear.');
    expect(await audioLanguageSelector.getText()).not.toEqual(language);
  };

  this.expectSubscriptionCountToEqual = async function(value) {
    expect(await subscriptions.count()).toEqual(value);
  };

  this.expectUserBioToBe = async function(bio) {
    await waitFor.visibilityOf(
      userBioElement, 'User bio field takes too long to appear.');
    expect(await userBioElement.getAttribute('value')).toMatch(bio);
  };

  this.selectCreatorDashboard = async function() {
    await action.click(
      'Creator Dashboard radio', createrDashboardRadio);
    await saveNewChanges('Creator Dashboard Option');
  };

  this.selectLearnerDashboard = async function() {
    await action.click(
      'Learner Dashboard radio', learnerDashboardRadio);
    await saveNewChanges('Learner Dashboard Option');
  };

  this.clickDeleteAccountButton = async function() {
    await action.click(
      'Delete Account button', deleteAccountButton);
  };

  this.clickExportAccountButton = async function() {
    await action.click(
      'Export Account button', exportAccountButton);
  };
};

exports.PreferencesPage = PreferencesPage;
