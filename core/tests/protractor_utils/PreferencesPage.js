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

var path = require('path');
var action = require('../protractor_utils/action.js');
var workflow = require('../protractor_utils/workflow.js');
var waitFor = require('./waitFor.js');

var PreferencesPage = function() {
  var USER_PREFERENCES_URL = '/preferences';
  var editorRoleEmailsCheckbox = element(
    by.css('.protractor-test-editor-role-email-checkbox'));
  var feedbackMessageEmailsCheckbox = element(
    by.css('.protractor-test-feedback-message-email-checkbox'));
  var languageOptionsList = element.all(by.css('.select2-results'));
  var navBar = element(by.css('.oppia-navbar-dropdown-toggle'));
  var pageHeader = element(by.css('.protractor-test-preferences-title'));
  var preferredAudioLanguageSelector = element(
    by.css('.protractor-test-preferred-audio-language-selector'));
  var selectedAudioLanguageElement = preferredAudioLanguageSelector.element(
    by.css('.select2-selection__rendered'));
  var subscriptions = element.all(by.css('.protractor-test-subscription-name'));
  var systemLanguageSelector = element.all(
    by.css('.protractor-test-system-language-selector')).first();
  var userBioElement = element(by.css('.protractor-test-user-bio'));
  var userInterestsElement = element(
    by.css('.protractor-test-interests-dropdown'));
  var userInterestsInput = userInterestsElement.element(
    by.css('.select2-search__field'));
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

  var saveNewChanges = async function(fieldName) {
    await navBar.click();
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
    await action.select2(
      'System language selector', systemLanguageSelector, language);
    await saveNewChanges('System Language');
  };

  this.selectPreferredAudioLanguage = async function(language) {
    await action.select2(
      'Audio language selector', preferredAudioLanguageSelector, language);
    await saveNewChanges('Preferred Audio Language');
  };

  this.setUserBio = async function(bio) {
    var inputFieldName = 'User bio input field';
    await action.clear(inputFieldName, userBioElement);
    await saveNewChanges('User Bio');
    await action.sendKeys(inputFieldName, userBioElement, bio);
    await saveNewChanges('User Bio');
  };

  this.setUserInterests = async function(interests) {
    await userInterestsInput.click();
    for (var i = 0; i < interests.length; i++) {
      await userInterestsInput.sendKeys(interests[i], protractor.Key.RETURN);
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
    expect(await subscriptions.first().getText()).toMatch(name);
  };

  // This function only compares the text displayed on the subscription (which
  // might be abbreviated), rather than the text on the popover that appears
  // when hovering over the tile.
  this.expectDisplayedLastSubscriptionToBe = async function(name) {
    expect(await subscriptions.last().getText()).toMatch(name);
  };

  this.expectPageHeaderToBe = async function(text) {
    expect(await pageHeader.getText()).toEqual(text);
  };

  this.expectPreferredSiteLanguageToBe = async function(language) {
    var selectedLanguageElement = systemLanguageSelector.element(
      by.css('.select2-selection__rendered'));
    expect(await selectedLanguageElement.getText()).toEqual(language);
  };

  this.expectPreferredAudioLanguageToBe = async function(language) {
    expect(await selectedAudioLanguageElement.getText()).toEqual(language);
  };

  this.expectPreferredAudioLanguageNotToBe = async function(language) {
    expect(await selectedAudioLanguageElement.getText()).not.toEqual(language);
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
};

exports.PreferencesPage = PreferencesPage;
