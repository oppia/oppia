// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the functionality of the improvements tab
 *    of the exploration editor.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');


var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Exploration Improvements', function() {
  var EXPLORATION_TITLE = 'Exploration with Improvements';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var explorationEditorPage = null;
  var explorationEditorImprovementsTab = null;
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeAll(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorImprovementsTab =
      explorationEditorPage.getImprovementsTab();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    users.createUser(
      'user1@ExplorationImprovements.com',
      'creatorExplorationImprovements');
    users.createUser(
      'user2@ExplorationImprovements.com',
      'learnerExplorationImprovements');
    users.createUser(
      'user3@ExplorationImprovements.com',
      'suggesterExplorationImprovements');
  });

  describe('Feedback Improvements', function() {
    it('adds feedback to an exploration', function() {
      var feedback = 'A good exploration. Would love to see more questions';
      var feedbackResponse = 'Thanks for the feedback';

      // Creator creates and publishes an exploration.
      users.login('user1@ExplorationImprovements.com');
      workflow.createAndPublishExploration(
        EXPLORATION_TITLE,
        EXPLORATION_CATEGORY,
        EXPLORATION_OBJECTIVE,
        EXPLORATION_LANGUAGE);
      creatorDashboardPage.get();
      expect(creatorDashboardPage.getNumberOfFeedbackMessages()).toEqual(0);
      users.logout();

      // Learner plays the exploration and submits a feedback.
      users.login('user2@ExplorationImprovements.com');
      libraryPage.get();
      libraryPage.findExploration(EXPLORATION_TITLE);
      libraryPage.playExploration(EXPLORATION_TITLE);
      explorationPlayerPage.submitFeedback(feedback);
      users.logout();

      // Creator reads the feedback and responds.
      users.login('user1@ExplorationImprovements.com');
      creatorDashboardPage.get();
      expect(creatorDashboardPage.getNumberOfFeedbackMessages()).toEqual(1);
      creatorDashboardPage.navigateToExplorationEditor();

      explorationEditorPage.navigateToImprovementsTab();
      explorationEditorImprovementsTab.expectToHaveFeedbackThread();
      explorationEditorImprovementsTab.readFeedbackMessages()
        .then(function(messages) {
          expect(messages.length).toEqual(1);
          expect(messages[0]).toEqual(feedback);
        });
      explorationEditorPage.navigateToImprovementsTab();
      explorationEditorImprovementsTab.sendResponseToLatestImprovement(
        feedbackResponse);
      users.logout();
    });
  });

  describe('Suggestion Improvements', function() {
    it('accepts & rejects a suggestion on a published exploration', function() {
      users.login('user1@ExplorationImprovements.com');
      workflow.createAndPublishExploration(
        EXPLORATION_TITLE,
        EXPLORATION_CATEGORY,
        EXPLORATION_OBJECTIVE,
        EXPLORATION_LANGUAGE);
      users.logout();

      // Suggester plays the exploration and suggests a change.
      users.login('user2@ExplorationImprovements.com');
      libraryPage.get();
      libraryPage.findExploration(EXPLORATION_TITLE);
      libraryPage.playExploration(EXPLORATION_TITLE);

      var suggestion1 = 'New Exploration';
      var suggestionDescription1 = 'Uppercased the first letter';
      var suggestion2 = 'New exploration';
      var suggestionDescription2 = 'Changed';

      explorationPlayerPage.submitSuggestion(
        suggestion1, suggestionDescription1);
      explorationPlayerPage.clickOnCloseSuggestionModalButton();
      explorationPlayerPage.submitSuggestion(
        suggestion2, suggestionDescription2);
      users.logout();

      // Exploration author reviews the suggestion and accepts it.
      users.login('user1@ExplorationImprovements.com');
      creatorDashboardPage.get();
      creatorDashboardPage.navigateToExplorationEditor();

      explorationEditorPage.navigateToImprovementsTab();
      explorationEditorImprovementsTab.getSuggestionThreads()
        .then(function(threads) {
          expect(threads.length).toEqual(2);
          expect(threads[0]).toMatch(suggestionDescription2);
        });
      explorationEditorImprovementsTab.acceptSuggestion(suggestionDescription1);
      explorationEditorImprovementsTab.closeModal();
      explorationEditorImprovementsTab.rejectSuggestion(suggestionDescription2);

      explorationEditorPage.navigateToPreviewTab();
      explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion1));
      users.logout();

      // Student logs in and plays the exploration, finds the updated content.
      users.login('user3@ExplorationImprovements.com');
      libraryPage.get();
      libraryPage.findExploration(EXPLORATION_TITLE);
      libraryPage.playExploration(EXPLORATION_TITLE);
      explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion1));
      users.logout();
    });

    afterEach(function() {
      general.checkForConsoleErrors([]);
    });
  });
});
