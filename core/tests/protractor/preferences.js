// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for user preferences.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Preferences', function() {
  it('should change editor role email checkbox value', function() {
    users.createUser('alice@preferences.com', 'alicePreferences');
    users.login('alice@preferences.com');
    browser.get('/preferences');
    var checkbox = element(by.model('canReceiveEditorRoleEmail'));
    expect(checkbox.isSelected()).toBe(true);
    checkbox.click();
    expect(checkbox.isSelected()).toBe(false);
    browser.refresh();
    expect(checkbox.isSelected()).toBe(false);
  });

  it('should change feedback message email checkbox value', function() {
    users.createUser('bob@preferences.com', 'bobPreferences');
    users.login('bob@preferences.com');
    browser.get('/preferences');
    var checkbox = element(by.model('canReceiveFeedbackMessageEmail'));
    expect(checkbox.isSelected()).toBe(true);
    checkbox.click();
    expect(checkbox.isSelected()).toBe(false);
    browser.refresh();
    expect(checkbox.isSelected()).toBe(false);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
