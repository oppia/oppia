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

var PreferencesPage = function() {
  var USER_PREFERENCES_URL = '/preferences';
  var editorRoleEmailsCheckBox = element(by.model('canReceiveEditorRoleEmail'));
  var feedbackMessageEmailsCheckBox = element(
    by.model('canReceiveFeedbackMessageEmail'));
  var subscriptions = element.all(by.css('.protractor-test-subscription-name'));

  this.get = function() {
    return browser.get(USER_PREFERENCES_URL);
  };

  this.toggleEditorRoleEmailsCheckBox = function() {
    editorRoleEmailsCheckBox.click();
  };
  
  this.toggleFeedbackEmailsCheckBox = function() {
    feedbackMessageEmailsCheckBox.click();
  };

  this.isFeedbackEmailsCheckboxSelected = function() {
    return feedbackMessageEmailsCheckBox.isSelected();
  };

  this.isEditorRoleEmailsCheckboxSelected = function() {
    return editorRoleEmailsCheckBox.isSelected();
  };

  this.expectDisplayedFirstSubscriptionToBe = function(name) {
    expect(subscriptions.first().getText()).toMatch(name);
  };

  this.expectDisplayedLastSubscriptionToBe = function(name) {
    expect(subscriptions.last().getText()).toMatch(name);
  };

  this.expectSubscriptionCountToEqual = function(value) {
    expect(subscriptions.count()).toEqual(value);
  };
};

exports.PreferencesPage = PreferencesPage;
