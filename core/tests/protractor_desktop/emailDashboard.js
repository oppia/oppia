// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for email dashboard page.
 */

const { browser } = require('protractor');
var action = require('../protractor_utils/action.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');

var PreferencesPage = require('../protractor_utils/PreferencesPage.js');

describe('Email Dashboard', function() {
  var EMAIL_DASHBOARD_URL = '/emaildashboard';
  var preferencesPage = null;

  beforeAll(async function() {
    preferencesPage = new PreferencesPage.PreferencesPage();
    await users.createUser('userA@emaildashboard.com', 'userA');
    await users.login('userA@emaildashboard.com');
    await preferencesPage.get();
    await waitFor.pageToFullyLoad();
    await preferencesPage.toggleEmailUpdatesCheckbox();
    await users.logout();
    await users.createAndLoginAdminUser(
      'management@emaildashboard.com', 'management');
    await browser.get(EMAIL_DASHBOARD_URL);
    await waitFor.pageToFullyLoad();
  });

  it('should query for users', async function() {
    var schemaEditorElement = element(
      by.css('.protractor-test-email-dashboard-input-3'));
    var inputElement = schemaEditorElement.element(by.tagName('input'));
    var submitButton = element(by.css('.protractor-test-submit-query-button'));

    await waitFor.visibilityOf(inputElement, 'Input Element not displayed');
    await action.clear('Email dashboard input 3', inputElement);
    await action.sendKeys('Email dashboard input 3', inputElement, '1');
    await action.click('Submit Query button', submitButton);
    var checkStatusButton = element(
      by.css('.protractor-test-check-status-button-0'));
    while (true) {
      // eslint-disable-next-line oppia/protractor-practices
      await browser.sleep(1000);
      await action.click('Check Status Button', checkStatusButton);
      var statusElement = element(by.css('.protractor-test-status-0'));
      await waitFor.visibilityOf(statusElement, 'Status Text not displayed');
      if (await statusElement.getText() === 'completed') {
        break;
      }
    }
    var numberOfUsers = element(by.css('.protractor-test-number-of-users-0'));
    await waitFor.visibilityOf(
      numberOfUsers, 'Number of qualified users not displayed');
    expect(await numberOfUsers.getText()).toBe('1');
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
