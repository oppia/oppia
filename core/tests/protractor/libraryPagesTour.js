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
 * @fileoverview End-to-end tests to check for console errors in
 * library related pages.
 */

var general = require('../protractor_utils/general.js');
var library = require('../protractor_utils/library.js');
var player = require('../protractor_utils/player.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Library pages tour', function() {
  var EXPLORATION_TITLE = 'Test Exploration';
  var EXPLORATION_OBJECTIVE = 'To learn testing';
  var EXPLORATION_CATEGORY = 'Random';
  var EXPLORATION_LANGUAGE = 'English';
  var EXPLORATION_RATING = 4;
  var SEARCH_TERM = 'python';
  var visitLibraryPage = function() {
    browser.get(general.LIBRARY_URL_SUFFIX);
  };

  it('visits the library index page', function() {
    visitLibraryPage();
  });

  it('visits the top rated page', function() {
    // To visit the top rated page, at least one
    // exploration has to be rated by the user
    users.createAndLoginAdminUser('random@gmail.com', 'random');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE
    );
    visitLibraryPage();
    library.playExploration(EXPLORATION_TITLE);

    player.submitAnswer('Continue');
    player.rateExploration(EXPLORATION_RATING);

    visitLibraryPage();
    element(by.css('.protractor-test-library-top-rated')).click();
    expect(browser.getCurrentUrl()).toContain('library/top_rated');
    users.logout();
  });

  it('visits the recent explorations page', function() {
    visitLibraryPage();
    element(by.css('.protractor-test-library-recently-published')).click();
    expect(browser.getCurrentUrl()).toContain('library/recently_published');
  });

  it('visits the search page', function() {
    visitLibraryPage();
    element(by.css('.protractor-test-search-input')).sendKeys(SEARCH_TERM);
    browser.driver.wait(function() {
      return browser.getCurrentUrl().then(function(url) {
        return /search/.test(url);
      });
    });
    expect(browser.getCurrentUrl()).toContain('search/find?q=python');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
