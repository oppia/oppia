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
 * @fileoverview End-to-end tests for library flow.
 */

var AdminPage = require('../protractor_utils/AdminPage.js');
var ExplorationPlayerPage = require(
  '../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Library pages tour', function() {
  var EXPLORATION_TITLE = 'Test Exploration';
  var EXPLORATION_OBJECTIVE = 'To learn testing';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var EXPLORATION_RATING = 4;
  var SEARCH_TERM = 'python';
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  var visitRecentlyPublishedPage = function() {
    browser.get('library/recently_published');
    waitFor.pageToFullyLoad();
  };

  var rateExplorationInDesktop = function() {
    users.createUser('random@gmail.com', 'random');
    users.login('random@gmail.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE
    );
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
    explorationPlayerPage.rateExploration(EXPLORATION_RATING);
    users.logout();
  };

  var rateExplorationInMobile = function() {
    var adminPage = new AdminPage.AdminPage();
    var LIB_ADM_VISITOR = 'libAdmVisitor';
    // When logging-in on mobile devices, popups and suggestions
    // might block the login button.
    // See https://discuss.appium.io/t/how-to-disable-popups-on-android-chrome-browser-through-automation/5935
    // At the moment, there does not exist a reliable way to
    // disable them. Therefore the best
    // way to deal with them is to use an
    // entirely different email id.
    users.createAndLoginAdminUserMobile(
      'libAdmVisitor@library.com', LIB_ADM_VISITOR);
    // Load /explore/22
    adminPage.reloadExploration('protractor_mobile_test_exploration.yaml');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
    explorationPlayerPage.rateExploration(EXPLORATION_RATING);
    users.logout();
  };

  it('visits the search page', function() {
    libraryPage.get();
    libraryPage.findExploration(SEARCH_TERM);
    expect(browser.getCurrentUrl()).toContain('search/find?q=python');
  });

  it('visits the library index page', function() {
    libraryPage.get();
  });

  it('visits the top rated page', function() {
    // To visit the top rated page, at least one
    // exploration has to be rated by the user
    if (browser.isMobile) {
      rateExplorationInMobile();
    } else {
      rateExplorationInDesktop();
    }
    libraryPage.get();
    element(by.css('.protractor-test-library-top-rated')).click();
    waitFor.pageToFullyLoad();
    expect(browser.getCurrentUrl()).toContain('library/top_rated');
  });

  it('visits the recent explorations page', function() {
    visitRecentlyPublishedPage();
    expect(browser.getCurrentUrl()).toContain('library/recently_published');
  });

  afterEach(function() {
    if (browser.isMobile) {
      general.checkForConsoleErrors([
        // TODO(apb7): Remove these when https://github.com/oppia/oppia/issues/5363 is resolved.
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Test Exploration"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: python"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "'
      ]);
    } else {
      general.checkForConsoleErrors([]);
    }
  });
});
