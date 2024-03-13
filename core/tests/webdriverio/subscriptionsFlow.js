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
 * @fileoverview End-to-end tests for the subscriptions functionality on desktop
 * and mobile.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');

var CreatorDashboardPage = require('../webdriverio_utils/CreatorDashboardPage.js');
var PreferencesPage = require('../webdriverio_utils/PreferencesPage.js');
var SubscriptionDashboardPage = require('../webdriverio_utils/SubscriptionDashboardPage.js');

describe('Subscriptions functionality', function () {
  var creatorDashboardPage = null;
  var preferencesPage = null;
  var subscriptionDashboardPage = null;

  beforeEach(function () {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    preferencesPage = new PreferencesPage.PreferencesPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  });

  it('should handle subscriptions to creators correctly', async function () {
    // Create two creators.
    await users.createUser(
      'creator1Id@subscriptions.com',
      'creator1Idsubscriptions'
    );
    await users.createUser(
      'creator2Id@subscriptions.com',
      'creator2Idsubscriptions'
    );

    // Create a learner who subscribes to both the creators.
    await users.createUser(
      'learner1@subscriptions.com',
      'learner1subscriptions'
    );
    await users.login('learner1@subscriptions.com');
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creator1Idsubscriptions'
    );
    await subscriptionDashboardPage.clickSubscribeButton();
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creator2Idsubscriptions'
    );
    await subscriptionDashboardPage.clickSubscribeButton();
    await preferencesPage.get();
    await preferencesPage.expectDisplayedFirstSubscriptionToBe('creator...');
    await preferencesPage.expectDisplayedLastSubscriptionToBe('creator...');
    await users.logout();

    // Create a learner who subscribes to creator1Id and unsubscribes from the
    // creator2Id.
    await users.createUser(
      'learner2@subscriptions.com',
      'learner2subscriptions'
    );
    await users.login('learner2@subscriptions.com');
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creator1Idsubscriptions'
    );
    await subscriptionDashboardPage.clickSubscribeButton();
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creator2Idsubscriptions'
    );

    // Subscribe and then unsubscribe from the same user.
    await subscriptionDashboardPage.clickSubscribeButton();
    await subscriptionDashboardPage.clickSubscribeButton();
    await preferencesPage.get();
    await preferencesPage.expectSubscriptionCountToEqual(1);
    await preferencesPage.expectDisplayedFirstSubscriptionToBe('creator...');
    await users.logout();

    // Verify there are 2 subscribers.
    await users.login('creator1Id@subscriptions.com');
    // Go to the creator_dashboard.
    await creatorDashboardPage.get();
    await creatorDashboardPage.clickCreateNewExplorationButton();
    await creatorDashboardPage.get();
    await creatorDashboardPage.navigateToSubscriptionDashboard();
    await subscriptionDashboardPage.expectSubscriptionFirstNameToMatch(
      'learner...'
    );
    await subscriptionDashboardPage.expectSubscriptionLastNameToMatch(
      'learner...'
    );
    await users.logout();

    // Verify there are 1 subscriber.
    await users.login('creator2Id@subscriptions.com');
    // Go to the creator_dashboard.
    await creatorDashboardPage.get();
    await creatorDashboardPage.clickCreateNewExplorationButton();
    await creatorDashboardPage.get();
    await creatorDashboardPage.navigateToSubscriptionDashboard();
    await subscriptionDashboardPage.expectSubscriptionCountToEqual(1);
    await subscriptionDashboardPage.expectSubscriptionLastNameToMatch(
      'learner...'
    );
    await users.logout();
  });

  afterEach(async function () {
    await general.checkForConsoleErrors([]);
  });
});
