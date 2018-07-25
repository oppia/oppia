// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for mobile to login, load a
 * demo exploration and a demo collection, play around and then logout.
 */

var AdminPage = require('../protractor_utils/AdminPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');

describe('learner flow for mobile', function() {
  var adminPage = null;
  var libraryPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    var ADM_VISITOR = 'admVisitor';
    users.login('admVisitor@learner.com', true);
    users.completeSignup(ADM_VISITOR);
    // Load /explore/12
    adminPage.reloadExploration('protractor_test_1.yaml');
    // Load /collection/0
    adminPage.reloadCollection();
    users.logout();
    libraryPage = new LibraryPage.LibraryPage();
    libraryPage.get();
    var LEARNER_USERNAME = 'learnerMobile';
    users.createAndLoginUser('learnerMobile@learnerFlow.com', LEARNER_USERNAME);
  });

  it('visits the exploration player and plays the correct exploration',
    function() {
      browser.get('/explore/12');
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/explore/12');
    });

  it('visits the collection player and plays the correct collection',
    function() {
      browser.get('/collection/0');
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/collection/0');
    });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
