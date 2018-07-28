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
var LearnerDashboardPage = require(
  '../protractor_utils/LearnerDashboardPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');

describe('player flow for mobile', function () {
  var adminPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();

    var ADM_PLAYER_VISITOR = 'admPlayerVisitor';
    users.createAndLoginAdminUserMobile(
      'admPlayerVisitor@player.com', ADM_PLAYER_VISITOR);
    // Load /explore/24
    adminPage.reloadExploration('learner_flow_test.yaml');
    // Load /collection/1
    adminPage.reloadCollection(1);
    users.logout();
    var PLAYER_USERNAME = 'playerMobile';
    users.createUser('playerMobile@playerFlow.com', PLAYER_USERNAME);
  });

  it('visits the exploration player and plays the correct exploration',
    function () {
      users.login('playerMobile@playerFlow.com');
      learnerDashboardPage.get();
      browser.get('/explore/24');
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/explore/24');
    });

  it('visits the collection player and plays the correct collection',
    function () {
      users.login('playerMobile@playerFlow.com');
      learnerDashboardPage.get();
      browser.get('/collection/1');
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/collection/1');
    });

  afterEach(function () {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
