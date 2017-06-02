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
 * @fileoverview End-to-end tests for feedback on explorations
 * Tests the following sequence:
 * User 1 creates and publishes an exploration.
 * User 2 plays the exploration and leaves feedback on it
 * User 1 reads the feedback and responds to it.
 * Note: In production, after this sequence of events, the only notification
 * User 2 will receive is via email, and we can't easily test this
 * in an e2e test.
 */

var creatorDashboard = require('../protractor_utils/creatorDashboard.js');
var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var library = require('../protractor_utils/library.js');
var player = require('../protractor_utils/player.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('ExplorationFeedback', function() {
  var EXPLORATION_TITLE = 'Sample Exploration';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';

  beforeEach(function() {
    users.createUser('user1@ExplorationFeedback.com',
                     'creatorExplorationFeedback');
    users.createUser('user2@ExplorationFeedback.com',
                     'learnerExplorationFeedback');
  });

  it('adds feedback to an exploration', function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    // Creator creates and publishes an exploration
    users.login('user1@ExplorationFeedback.com');
    workflow.createAndPublishExploration(EXPLORATION_TITLE,
                                         EXPLORATION_CATEGORY,
                                         EXPLORATION_OBJECTIVE,
                                         EXPLORATION_LANGUAGE);
    browser.get(general.SERVER_URL_PREFIX);
    var numberOfFeedbackMessages = (
      creatorDashboard.getNumberOfFeedbackMessages());
    expect(numberOfFeedbackMessages).toEqual(0);
    users.logout();

    // Learner plays the exploration and submits a feedback
    users.login('user2@ExplorationFeedback.com');
    browser.get(general.LIBRARY_URL_SUFFIX);
    library.playExploration(EXPLORATION_TITLE);
    player.submitFeedback(feedback);
    users.logout();

    // Creator reads the feedback and responds
    users.login('user1@ExplorationFeedback.com');
    browser.get(general.SERVER_URL_PREFIX);
    numberOfFeedbackMessages = creatorDashboard.getNumberOfFeedbackMessages();
    expect(numberOfFeedbackMessages).toEqual(1);
    creatorDashboard.navigateToExplorationEditor();

    editor.readFeedbackMessages().then(function(messages) {
      expect(messages.length).toEqual(1);
      expect(messages[0]).toEqual(feedback);
    });
    editor.sendResponseToLatestFeedback(feedbackResponse);
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
