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
var player = require('../protractor_utils/player.js');
<<<<<<< HEAD
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var users = require('../protractor_utils/users.js');
=======
var library = require('../protractor_utils/library.js');
var UsersPage = require('../protractor_utils/UsersPage.js');
>>>>>>> fix #3954 add UsersPage page object
var workflow = require('../protractor_utils/workflow.js');

var usersPage = new UsersPage.UsersPage()

describe('Suggestions on Explorations', function() {
  var EXPLORATION_TITLE = 'Sample Exploration';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_OBJECTIVE = 'To explore something new';
  var EXPLORATION_LANGUAGE = 'English';
  var creatorDashboardPage = null;
  var libraryPage = null;

  beforeEach(function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
  });

  beforeEach(function() {
    usersPage.createUser('user1@ExplorationSuggestions.com',
                     'authorExplorationSuggestions');
    usersPage.createUser('user2@ExplorationSuggestions.com',
                     'suggesterExplorationSuggestions');
    usersPage.createUser('user3@ExplorationSuggestions.com',
                     'studentExplorationSuggestions');
  });

  it('accepts a suggestion on a published exploration', function() {
    usersPage.login('user1@ExplorationSuggestions.com');
    workflow.createAndPublishExploration(EXPLORATION_TITLE,
                                         EXPLORATION_CATEGORY,
                                         EXPLORATION_OBJECTIVE,
                                         EXPLORATION_LANGUAGE);
    browser.get(general.SERVER_URL_PREFIX);
    usersPage.logout();

    // Suggester plays the exploration and suggests a change
<<<<<<< HEAD
    users.login('user2@ExplorationSuggestions.com');
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_TITLE);
=======
    usersPage.login('user2@ExplorationSuggestions.com');
    browser.get(general.LIBRARY_URL_SUFFIX);
    library.playExploration(EXPLORATION_TITLE);
>>>>>>> fix #3954 add UsersPage page object

    var suggestion = 'New Exploration';
    var suggestionDescription = 'Uppercased the first letter';

    player.submitSuggestion(suggestion, suggestionDescription);
    usersPage.logout();

    // Exploration author reviews the suggestion and accepts it
    usersPage.login('user1@ExplorationSuggestions.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    editor.getSuggestionThreads().then(function(threads) {
      expect(threads.length).toEqual(1);
      expect(threads[0]).toMatch(suggestionDescription);
    });
    editor.acceptSuggestion(suggestionDescription);

    editor.navigateToPreviewTab();
    player.expectContentToMatch(forms.toRichText(suggestion));
    usersPage.logout();

    // Student logs in and plays the exploration, finds the updated content
<<<<<<< HEAD
    users.login('user3@ExplorationSuggestions.com');
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_TITLE);
=======
    usersPage.login('user3@ExplorationSuggestions.com');
    browser.get(general.LIBRARY_URL_SUFFIX);
    library.playExploration(EXPLORATION_TITLE);
>>>>>>> fix #3954 add UsersPage page object
    player.expectContentToMatch(forms.toRichText(suggestion));
    usersPage.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
