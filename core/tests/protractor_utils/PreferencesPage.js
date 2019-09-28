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

var waitFor = require('./waitFor.js');
var path = require('path');

var PreferencesPage = function() {
  var USER_PREFERENCES_URL = '/preferences';
  var editorRoleEmailsCheckbox = element(
    by.css('.protractor-test-editor-role-email-checkbox'));
  var feedbackMessageEmailsCheckbox = element(
    by.css('.protractor-test-feedback-message-email-checkbox'));
  var languageOptionsList = element.all(by.css('.select2-results'));
  var navBar = element(by.css('.oppia-navbar-dropdown-toggle'));
  var pageHeader = element(by.css('.protractor-test-preferences-title'));
  var preferencesLink = element(by.css('.protractor-test-preferences-link'));
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
  var profilePhotoUploadInput = element(
    by.css('.protractor-test-photo-upload-input'));
  var profilePhotoSubmitButton = element(
    by.css('.protractor-test-photo-upload-submit'));
  var customProfilePhoto = element(
    by.css('.protractor-test-custom-photo'));
  var profilePhotoCropper = element(
    by.css('.protractor-test-photo-crop'));
  var profilePhotoUploadError = element(
    by.css('.protractor-test-upload-error'));

  this.expectUploadError = function() {
    expect(profilePhotoUploadError.isDisplayed()).toBe(true);
  };

  this.uploadProfilePhoto = function(imgPath) {
    profilePhotoClickable.click();
    absPath = path.resolve(__dirname, imgPath);
    return profilePhotoUploadInput.sendKeys(absPath);
  };

  this.submitProfilePhoto = function(imgPath) {
    return this.uploadProfilePhoto(imgPath).then(function() {
      waitFor.visibilityOf(
        profilePhotoCropper, 'Photo cropper is taking too long to appear');
    }).then(function() {
      profilePhotoSubmitButton.click();
    }).then(function() {
      return waitFor.invisibilityOf(
        profilePhotoUploadInput,
        'Photo uploader is taking too long to disappear');
    });
  };

  this.getProfilePhotoSource = function() {
    return customProfilePhoto.getAttribute('src');
  };

  this.editUserBio = function(bio) {
    userBioElement.sendKeys(bio);
    navBar.click();
    preferencesLink.click();
  };

  this.get = function() {
    browser.get(USER_PREFERENCES_URL);
    return waitFor.pageToFullyLoad();
  };

  this.toggleEditorRoleEmailsCheckbox = function() {
    editorRoleEmailsCheckbox.click();
  };

  this.toggleFeedbackEmailsCheckbox = function() {
    feedbackMessageEmailsCheckbox.click();
  };

  this.selectSystemLanguage = function(language) {
    systemLanguageSelector.click();
    var options = element.all(by.css('.select2-dropdown li')).filter(
      function(elem) {
        return elem.getText().then(function(text) {
          return text === language;
        });
      });
    options.first().click();
  };

  this.selectPreferredAudioLanguage = function(language) {
    preferredAudioLanguageSelector.click();
    var correctOptions = languageOptionsList.all(by.tagName('li')).filter(
      function(elem) {
        return elem.getText().then(function(text) {
          return text === language;
        });
      });
    correctOptions.first().click();
  };

  this.setUserBio = function(bio) {
    userBioElement.clear();
    userBioElement.sendKeys(bio);
    navBar.click();
    preferencesLink.click();
  };

  this.setUserInterests = function(interests) {
    userInterestsInput.click();
    interests.forEach(function(interest) {
      userInterestsInput.sendKeys(interest);
      userInterestsInput.sendKeys(protractor.Key.RETURN);
    });
  };

  this.isFeedbackEmailsCheckboxSelected = function() {
    return feedbackMessageEmailsCheckbox.isSelected();
  };

  this.isEditorRoleEmailsCheckboxSelected = function() {
    return editorRoleEmailsCheckbox.isSelected();
  };

  // This function only compares the text displayed on the subscription (which
  // might be abbreviated), rather than the text on the popover that appears
  // when hovering over the tile.
  this.expectDisplayedFirstSubscriptionToBe = function(name) {
    expect(subscriptions.first().getText()).toMatch(name);
  };

  // This function only compares the text displayed on the subscription (which
  // might be abbreviated), rather than the text on the popover that appears
  // when hovering over the tile.
  this.expectDisplayedLastSubscriptionToBe = function(name) {
    expect(subscriptions.last().getText()).toMatch(name);
  };

  this.expectPageHeaderToBe = function(text) {
    expect(pageHeader.getText()).toEqual(text);
  };

  this.expectPreferredSiteLanguageToBe = function(language) {
    var selectedLanguageElement = systemLanguageSelector.element(
      by.css('.select2-selection__rendered'));
    expect(selectedLanguageElement.getText()).toEqual(language);
  };

  this.expectPreferredAudioLanguageToBe = function(language) {
    expect(selectedAudioLanguageElement.getText()).toEqual(language);
  };

  this.expectPreferredAudioLanguageNotToBe = function(language) {
    expect(selectedAudioLanguageElement.getText()).not.toEqual(language);
  };

  this.expectSubscriptionCountToEqual = function(value) {
    expect(subscriptions.count()).toEqual(value);
  };

  this.expectUserBioToBe = function(bio) {
    expect(userBioElement.getAttribute('value')).toMatch(bio);
  };

  this.selectCreatorDashboard = function() {
    createrDashboardRadio.click();
  };

  this.selectLearnerDashboard = function() {
    learnerDashboardRadio.click();
  };
};

exports.PreferencesPage = PreferencesPage;
