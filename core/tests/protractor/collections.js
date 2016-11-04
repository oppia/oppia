// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for collections.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var admin = require('../protractor_utils/admin.js');

describe('Collections', function() {
  beforeAll(function() {
    var USERNAME = 'aliceCollections';
    users.createAndLoginAdminUser('alice@collections.com', USERNAME);
    browser.get(general.ADMIN_URL_SUFFIX);
    element(by.css('.protractor-test-reload-all-collections-button')).click();
    browser.driver.switchTo().alert().accept();
    browser.waitForAngular();
    admin.editConfigProperty(
        'Names of users allowed to use the collection editor', 'List', function(listEditor) {
      listEditor.addItem('Unicode').setValue(USERNAME);
    });
  });
  it('should visit the collection editor', function() {
    browser.get('/collection_editor/create/0#/');
    browser.waitForAngular();
  });
  it('should visit the collection player', function() {
    browser.get('/collection/0');
    browser.waitForAngular();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
