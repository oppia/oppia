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
 * @fileoverview End-to-end tests for the creator dashboard page.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');
var forms = require('../webdriverio_utils/forms.js');

var CreatorDashboardPage = require('../webdriverio_utils/CreatorDashboardPage.js');
var ExplorationPlayerPage = require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var SubscriptionDashboardPage = require('../webdriverio_utils/SubscriptionDashboardPage.js');

describe('Creator dashboard functionality', function () {
  var EXPLORATION_TITLE_1 = 'Exploration 1';
  var EXPLORATION_TITLE_2 = 'Exploration 2';
  var EXPLORATION_TITLE_3 = 'Exploration 3';
  var EXPLORATION_TITLE_4 = 'Exploration 4';
  var EXPLORATION_TITLE_5 = 'Exploration 5';
  var EXPLORATION_TITLE_6 = 'Exploration 6';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';

  var creatorDashboardPage = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var subscriptionDashboardPage = null;

  beforeAll(function () {
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  });

  it('should display correct stats on dashboard', async function () {
    var feedback = 'A good exploration. Would love to see a few more questions';
    // Create required users.
    await users.createUser(
      'user1@creatorDashboard.com',
      'creatorDashboardOwner'
    );
    await users.createUser('user2@creatorDashboard.com', 'learner2');
    await users.createUser('user3@creatorDashboard.com', 'learner3');
    await users.createUser('user4@creatorDashboard.com', 'learner4');

    await users.login('user1@creatorDashboard.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE_1,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      true
    );
    await creatorDashboardPage.get();
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE_2,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      false
    );
    await users.logout();

    await users.login('user2@creatorDashboard.com');
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creatorDashboardOwner'
    );
    await subscriptionDashboardPage.clickSubscribeButton();
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_1);
    await libraryPage.playExploration(EXPLORATION_TITLE_1);
    await explorationPlayerPage.rateExploration(3);
    await users.logout();

    await users.login('user3@creatorDashboard.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_1);
    await libraryPage.playExploration(EXPLORATION_TITLE_1);
    await explorationPlayerPage.rateExploration(5);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    await users.login('user1@creatorDashboard.com');
    await creatorDashboardPage.get();
    expect(await creatorDashboardPage.getAverageRating()).toEqual('4');
    expect(await creatorDashboardPage.getTotalPlays()).toEqual('2');
    expect(await creatorDashboardPage.getOpenFeedbacks()).toEqual('1');
    expect(await creatorDashboardPage.getSubscribers()).toEqual('1');
    await users.logout();

    await users.login('user4@creatorDashboard.com');
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creatorDashboardOwner'
    );
    await subscriptionDashboardPage.clickSubscribeButton();
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_2);
    await libraryPage.playExploration(EXPLORATION_TITLE_2);
    await explorationPlayerPage.rateExploration(4);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    await users.login('user1@creatorDashboard.com');
    await creatorDashboardPage.get();
    expect(await creatorDashboardPage.getAverageRating()).toEqual('4');
    expect(await creatorDashboardPage.getTotalPlays()).toEqual('3');
    expect(await creatorDashboardPage.getOpenFeedbacks()).toEqual('2');
    expect(await creatorDashboardPage.getSubscribers()).toEqual('2');
    await users.logout();
  });

  it('should work fine in grid view', async function () {
    var feedback = 'A good exploration. Would love to see a few more questions';
    // Create required users.
    await users.createUser('user5@creatorDashboard.com', 'creatorDashboard');
    await users.createUser('user6@creatorDashboard.com', 'learner6');
    await users.createUser('user7@creatorDashboard.com', 'learner7');

    await users.login('user5@creatorDashboard.com');
    await workflow.createAndPublishTwoCardExploration(
      EXPLORATION_TITLE_3,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      true
    );
    await creatorDashboardPage.get();
    await workflow.createAndPublishTwoCardExploration(
      EXPLORATION_TITLE_4,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      false
    );
    await users.logout();
    await users.login('user6@creatorDashboard.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_3);
    await libraryPage.playExploration(EXPLORATION_TITLE_3);
    await explorationPlayerPage.expectExplorationNameToBe(EXPLORATION_TITLE_3);
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 1')
    );
    await explorationPlayerPage.submitAnswer('Continue', null);
    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 2')
    );
    await explorationPlayerPage.rateExploration(3);
    await users.logout();

    await users.login('user7@creatorDashboard.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_4);
    await libraryPage.playExploration(EXPLORATION_TITLE_4);
    await explorationPlayerPage.expectExplorationNameToBe(EXPLORATION_TITLE_4);
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 1')
    );
    await explorationPlayerPage.submitAnswer('Continue', null);
    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 2')
    );
    await explorationPlayerPage.rateExploration(5);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    await users.login('user5@creatorDashboard.com');
    await creatorDashboardPage.get();
    var titles = await creatorDashboardPage.getExpSummaryTileTitles();
    expect(titles.length).toEqual(2);
    expect(await titles[0].getText()).toEqual(EXPLORATION_TITLE_4);
    expect(await titles[1].getText()).toEqual(EXPLORATION_TITLE_3);

    var ratings = await creatorDashboardPage.getExpSummaryTileRatings();
    expect(ratings.length).toEqual(2);
    expect(await ratings[0].getText()).toEqual('5.0');
    expect(await ratings[1].getText()).toEqual('3.0');

    var feedbackCount =
      await creatorDashboardPage.getExpSummaryTileOpenFeedbackCount();
    expect(feedbackCount.length).toEqual(2);
    expect(await feedbackCount[0].getText()).toEqual('1');
    expect(await feedbackCount[1].getText()).toEqual('0');

    var views = await creatorDashboardPage.getExpSummaryTileViewsCount();
    expect(views.length).toEqual(2);
    expect(await views[0].getText()).toEqual('1');
    expect(await views[1].getText()).toEqual('1');

    await users.logout();
  });

  it('should work fine in list view', async function () {
    var feedback = 'A good exploration. Would love to see a few more questions';
    // Create required users.
    await users.createUser('user8@creatorDashboard.com', 'newCreatorDashboard');
    await users.createUser('user9@creatorDashboard.com', 'learner9');
    await users.createUser('user10@creatorDashboard.com', 'learner10');

    await users.login('user8@creatorDashboard.com');
    await workflow.createAndPublishTwoCardExploration(
      EXPLORATION_TITLE_5,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      true
    );
    await creatorDashboardPage.get();
    await workflow.createAndPublishTwoCardExploration(
      EXPLORATION_TITLE_6,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE,
      false
    );
    await users.logout();
    await users.login('user9@creatorDashboard.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_5);
    await libraryPage.playExploration(EXPLORATION_TITLE_5);
    await explorationPlayerPage.expectExplorationNameToBe(EXPLORATION_TITLE_5);
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 1')
    );
    await explorationPlayerPage.submitAnswer('Continue', null);
    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 2')
    );
    await explorationPlayerPage.rateExploration(3);
    await users.logout();

    await users.login('user10@creatorDashboard.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_6);
    await libraryPage.playExploration(EXPLORATION_TITLE_6);
    await explorationPlayerPage.expectExplorationNameToBe(EXPLORATION_TITLE_6);
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 1')
    );
    await explorationPlayerPage.submitAnswer('Continue', null);
    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 2')
    );
    await explorationPlayerPage.rateExploration(5);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    await users.login('user8@creatorDashboard.com');
    await creatorDashboardPage.get();

    await creatorDashboardPage.getListView();

    var titles = await creatorDashboardPage.getExpSummaryRowTitles();
    expect(titles.length).toEqual(2);
    expect(await titles[0].getText()).toEqual(EXPLORATION_TITLE_6);
    expect(await titles[1].getText()).toEqual(EXPLORATION_TITLE_5);

    var ratings = await creatorDashboardPage.getExpSummaryRowRatings();
    expect(ratings.length).toEqual(2);
    expect(await ratings[0].getText()).toEqual('5.0');
    expect(await ratings[1].getText()).toEqual('3.0');

    var feedbackCount =
      await creatorDashboardPage.getExpSummaryRowOpenFeedbackCount();
    expect(feedbackCount.length).toEqual(2);
    expect(await feedbackCount[0].getText()).toEqual('1');
    expect(await feedbackCount[1].getText()).toEqual('0');

    var views = await creatorDashboardPage.getExpSummaryRowViewsCount();
    expect(views.length).toEqual(2);
    expect(await views[0].getText()).toEqual('1');
    expect(await views[1].getText()).toEqual('1');

    await users.logout();
  });

  afterEach(async function () {
    await general.checkForConsoleErrors([]);
  });
});
