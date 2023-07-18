// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the feedback Updates page.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');


var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var FeedbackUpdatesPage =
  require('../webdriverio_utils/FeedbackUpdatesPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');

describe('Learner dashboard functionality', function() {
  var explorationPlayerPage = null;
  var libraryPage = null;
  var feedbackUpdatesPage = null;

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    feedbackUpdatesPage = new FeedbackUpdatesPage.FeedbackUpdatesPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });


  it('should display learner feedback threads', async function() {
    await users.createUser(
      'learner2@feedbackUpdates.com', 'learner2feedbackUpdates');
    await users.createUser(
      'feedbackAdm@feedbackUpdates.com', 'feedbackAdmfeedbackUpdates');
    await users.login('feedbackAdm@feedbackUpdates.com');
    await workflow.createAndPublishExploration(
      'BUS101',
      'Business',
      'Learn about different business regulations around the world.',
      'English',
      true
    );
    await users.logout();

    await users.login('learner2@feedbackUpdates.com');
    var feedback = 'A good exploration. Would love to see a few ' +
      'more questions';
    await libraryPage.get();
    await libraryPage.findExploration('BUS101');
    await libraryPage.playExploration('BUS101');
    await explorationPlayerPage.submitFeedback(feedback);

    // Verify feedback thread is created.
    await feedbackUpdatesPage.get();
    await feedbackUpdatesPage.expectFeedbackExplorationTitleToMatch('BUS101');
    await feedbackUpdatesPage.navigateToFeedbackThread();
    await feedbackUpdatesPage.expectFeedbackMessageToMatch(feedback);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
