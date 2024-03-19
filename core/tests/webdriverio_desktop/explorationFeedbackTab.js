// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the functionality of the feedback tab of
 * the exploration editor.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var CreatorDashboardPage = require('../webdriverio_utils/CreatorDashboardPage.js');
var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');

describe('ExplorationFeedback', function () {
  var EXPLORATION_TITLE_1 = 'Exploration with Feedback';
  var EXPLORATION_TITLE_2 = 'Exploration to test feedback status';
  var EXPLORATION_TITLE_3 = 'Exploration to test feedback message';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var explorationEditorPage = null;
  var explorationEditorFeedbackTab = null;
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeAll(async function () {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorFeedbackTab = explorationEditorPage.getFeedbackTab();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    await users.createUser(
      'user1@ExplorationFeedback.com',
      'creatorExplorationFeedback'
    );
    await users.createUser(
      'user2@ExplorationFeedback.com',
      'learnerExplorationFeedback'
    );
    await users.createUser(
      'user3@ExplorationFeedback.com',
      'creatorExplorationFBStatChange'
    );
    await users.createUser(
      'user4@ExplorationFeedback.com',
      'learnerExplorationFBStatChange'
    );
    await users.createUser('user5@ExplorationFeedback.com', 'creatorFeedback');
    await users.createUser('user6@ExplorationFeedback.com', 'learnerFeedback');
    await users.createAdmin(
      'user7@ExplorationFeedback.com',
      'superUserExplorationFeedback'
    );
  });

  it('should add feedback to an exploration', async function () {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    // Creator creates and publishes an exploration.
    await users.login('user1@ExplorationFeedback.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE_1,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      true
    );
    await creatorDashboardPage.get();
    expect(await creatorDashboardPage.getNumberOfFeedbackMessages()).toEqual(0);
    await users.logout();

    // Learner plays the exploration and submits a feedback.
    await users.login('user2@ExplorationFeedback.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_1);
    await libraryPage.playExploration(EXPLORATION_TITLE_1);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    // Creator reads the feedback and responds.
    await users.login('user1@ExplorationFeedback.com');
    await creatorDashboardPage.get();
    expect(await creatorDashboardPage.getNumberOfFeedbackMessages()).toEqual(1);
    await creatorDashboardPage.navigateToExplorationEditor();

    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    var messages = await explorationEditorFeedbackTab.readFeedbackMessages();
    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual(feedback);
    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.sendResponseToLatestFeedback(
      feedbackResponse
    );
    await users.logout();
  });

  it('should change status of feedback thread', async function () {
    var feedback = 'Hey! This exploration looks awesome';
    var feedbackResponse = 'Thanks for the feedback!';

    // Creator creates and publishes an exploration.
    await users.login('user3@ExplorationFeedback.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE_2,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      true
    );
    await creatorDashboardPage.get();
    expect(await creatorDashboardPage.getNumberOfFeedbackMessages()).toEqual(0);
    await users.logout();

    // Learner plays the exploration and submits a feedback.
    await users.login('user4@ExplorationFeedback.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_2);
    await libraryPage.playExploration(EXPLORATION_TITLE_2);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    // Creator reads the feedback and responds.
    await users.login('user3@ExplorationFeedback.com');
    await creatorDashboardPage.get();
    expect(await creatorDashboardPage.getNumberOfFeedbackMessages()).toEqual(1);
    await creatorDashboardPage.navigateToExplorationEditor();

    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    var messages = await explorationEditorFeedbackTab.readFeedbackMessages();
    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual(feedback);
    await explorationEditorFeedbackTab.selectLatestFeedbackThread();
    await explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Open');
    await explorationEditorFeedbackTab.changeFeedbackStatus(
      'Fixed',
      feedbackResponse
    );
    await explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Fixed');
    await browser.refresh();
    await explorationEditorFeedbackTab.selectLatestFeedbackThread();
    await explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Fixed');
    await explorationEditorFeedbackTab.changeFeedbackStatus(
      'Open',
      feedbackResponse
    );
    await explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Open');

    await users.logout();
  });

  it('should send message to feedback thread', async function () {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    // Creator creates and publishes an exploration.
    await users.login('user5@ExplorationFeedback.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE_3,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      true
    );
    await creatorDashboardPage.get();
    expect(await creatorDashboardPage.getNumberOfFeedbackMessages()).toEqual(0);
    await users.logout();

    // Learner plays the exploration and submits a feedback.
    await users.login('user6@ExplorationFeedback.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_3);
    await libraryPage.playExploration(EXPLORATION_TITLE_3);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    // Creator reads the feedback and responds.
    await users.login('user5@ExplorationFeedback.com');
    await creatorDashboardPage.get();
    expect(await creatorDashboardPage.getNumberOfFeedbackMessages()).toEqual(1);
    await creatorDashboardPage.navigateToExplorationEditor();

    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    var messages = await explorationEditorFeedbackTab.readFeedbackMessages();
    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual(feedback);
    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.sendResponseToLatestFeedback(
      feedbackResponse
    );
    await explorationEditorFeedbackTab.expectNumberOfFeedbackMessagesToBe(2);
    messages =
      await explorationEditorFeedbackTab.readFeedbackMessagesFromThread();
    expect(messages.length).toEqual(2);
    expect(await messages[0].getText()).toEqual(feedback);
    expect(await messages[1].getText()).toEqual(feedbackResponse);
    await browser.refresh();
    await explorationEditorFeedbackTab.selectLatestFeedbackThread();
    await explorationEditorFeedbackTab.expectNumberOfFeedbackMessagesToBe(2);
    messages =
      await explorationEditorFeedbackTab.readFeedbackMessagesFromThread();
    expect(messages.length).toEqual(2);
    expect(await messages[0].getText()).toEqual(feedback);
    expect(await messages[1].getText()).toEqual(feedbackResponse);
    await users.logout();
  });

  afterEach(async function () {
    await general.checkForConsoleErrors([]);
  });
});
