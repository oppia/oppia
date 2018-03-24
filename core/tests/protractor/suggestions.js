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
 * @fileoverview End-to-end tests for suggestions on explorations
 */

var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Suggestions on Explorations', function() {
  var EXPLORATION_TITLE = 'Sample Exploration';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_OBJECTIVE = 'To explore something new';
  var EXPLORATION_LANGUAGE = 'English';
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
  });

  beforeEach(function() {
    users.createUser(
      'user1@ExplorationSuggestions.com',
      'authorExplorationSuggestions');
    users.createUser(
      'user2@ExplorationSuggestions.com',
      'suggesterExplorationSuggestions');
    users.createUser(
      'user3@ExplorationSuggestions.com',
      'studentExplorationSuggestions');
  });

  it('accepts a suggestion on a published exploration', function() {
    users.login('user1@ExplorationSuggestions.com');
    workflow.createAndPublishExploration(EXPLORATION_TITLE,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    browser.get(general.SERVER_URL_PREFIX);
    users.logout();

    // Suggester plays the exploration and suggests a change
    users.login('user2@ExplorationSuggestions.com');
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_TITLE);

    var suggestion = 'New Exploration';
    var suggestionDescription = 'Uppercased the first letter';

    explorationPlayerPage.submitSuggestion(suggestion, suggestionDescription);
    users.logout();

    // Exploration author reviews the suggestion and accepts it
    users.login('user1@ExplorationSuggestions.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    editor.getSuggestionThreads().then(function(threads) {
      expect(threads.length).toEqual(1);
      expect(threads[0]).toMatch(suggestionDescription);
      editor.acceptSuggestion(suggestionDescription);

      editor.navigateToPreviewTab();
      explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion));
      users.logout();

      // Student logs in and plays the exploration, finds the updated content
      users.login('user3@ExplorationSuggestions.com');
      libraryPage.get();
      libraryPage.playExploration(EXPLORATION_TITLE);
      explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion));
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
