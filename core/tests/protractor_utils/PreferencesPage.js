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

var PreferencesPage = function() {
  var USER_PREFERENCES_URL = '/preferences';
  var editorRoleEmailsCheckbox = element(
    by.css('.protractor-test-editor-role-email-checkbox'));
  var feedbackMessageEmailsCheckbox = element(
    by.css('.protractor-test-feedback-message-email-checkbox'));
  var pageHeader = element(by.css('.protractor-test-preferences-title'));
  var subscriptions = element.all(by.css('.protractor-test-subscription-name'));
  var systemLanguageSelector = element.all(
    by.css('.protractor-test-system-language-selector')).first();

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
    expect(pageHeader
      .getText()).toEqual(text);
  };

  this.expectPreferredSiteLanguageToBe = function(language) {
    var selectedLanguageElement = systemLanguageSelector.element(
      by.css('.select2-selection__rendered'));
    expect(selectedLanguageElement.getText()).toEqual(language);
  };

  this.expectSubscriptionCountToEqual = function(value) {
    expect(subscriptions.count()).toEqual(value);
  };
};

exports.PreferencesPage = PreferencesPage;
