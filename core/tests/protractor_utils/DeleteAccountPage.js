// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the delete account page, for use in Protractor
 * tests.
 */

var action = require('../protractor_utils/action.js');
var waitFor = require('./waitFor.js');
var pendingAccountDeletionHeading =
  element(by.css('.e2e-test-pending-account-deletion'));

var DeleteAccountPage = function() {
  var DELETE_ACCOUNT_PAGE_URL = '/delete-account';
  var deleteMyAccountButton = element(
    by.css('.e2e-test-delete-my-account-button'));
  var confirmDeletionUsernameField = element(
    by.css('.e2e-test-confirm-username-field'));
  var confirmDeletionButton = element(
    by.css('.e2e-test-confirm-deletion-button'));

  this.get = async function() {
    await browser.get(DELETE_ACCOUNT_PAGE_URL);
    await waitFor.elementToBeClickable(deleteMyAccountButton);
  };

  this.requestAccountDeletion = async function(username) {
    await action.click('Delete Account button', deleteMyAccountButton);
    await waitFor.modalPopupToAppear();
    await action.sendKeys(
      'Fill username', confirmDeletionUsernameField, username);
    await waitFor.clientSideRedirection(async() => {
      await action.click('Confirm deletion button', confirmDeletionButton);
    }, (url) => {
      return url === 'http://localhost:9001/pending-account-deletion';
    }, async() => {
      await waitFor.visibilityOf(
        pendingAccountDeletionHeading,
        'Pending Account Deletion Page takes too long to appear');
    });
  };
};

exports.DeleteAccountPage = DeleteAccountPage;
