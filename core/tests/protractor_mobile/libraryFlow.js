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
 * @fileoverview End-to-end tests for library flow on mobile browser.
 */

var AdminPage = require('../protractor_utils/AdminPage.js');
var ExplorationPlayerPage = require(
  '../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');

describe('Library pages tour on mobile', function() {
  var EXPLORATION_TITLE = 'Mobile device testing';
  var EXPLORATION_RATING = 5;
  var adminPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    var library = new LibraryPage.LibraryPage();
    var explorationPlayer = (
      new ExplorationPlayerPage.ExplorationPlayerPage());
    var LIB_ADM_VISITOR = 'libAdmVisitor';
    // When logging-in on mobile devices, popups and suggestions
    // might block the login button.
    // See https://discuss.appium.io/t/how-to-disable-popups-on-android-chrome-browser-through-automation/5935
    // At the moment, there does not exist a reliable way to
    // disable them. Therefore the best
    // way to deal with them is to use an
    // entirely different email id.
    users.login('libAdmVisitor@library.com', true);
    users.completeSignup(LIB_ADM_VISITOR);
    // Load /explore/22
    adminPage.reloadExploration('protractor_mobile_test_exploration.yaml');
    library.get();
    library.findExploration(EXPLORATION_TITLE);
    library.playExploration(EXPLORATION_TITLE);
    explorationPlayer.rateExploration(EXPLORATION_RATING);
    users.logout();
  });

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  var visitRecentlyPublishedPage = function() {
    browser.get('library/recently_published');
    waitFor.pageToFullyLoad();
  };

  it('visits the library index page', function() {
    libraryPage.get();
  });

  it('visits the top rated page', function() {
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
    general.checkForConsoleErrors([
      // TODO(apb7): Remove these when https://github.com/oppia/oppia/issues/5363 is resolved.
      'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
      'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Mobile device testing"',
      'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "'
    ]);
  });
});
