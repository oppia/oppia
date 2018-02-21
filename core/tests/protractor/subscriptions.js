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
 * @fileoverview End-to-end tests for entire subscriptions functionality.
 */

var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var SubscriptionDashboardPage =
  require('../protractor_utils/SubscriptionDashboardPage.js');

describe('Subscriptions functionality', function() {
  var creatorDashboardPage = null;
  var preferencesPage = null;
  var subscriptionDashboardPage = null;

  beforeEach(function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    preferencesPage = new PreferencesPage.PreferencesPage();
    subscriptionDashboardPage = (
      new SubscriptionDashboardPage.SubscriptionDashboardPage());
  });

  it('handle subscriptions to creators correctly', function() {
    // Create two creators.
    users.createUser('creator1@subscriptions.com', 'creator1subscriptions');
    users.login('creator1@subscriptions.com');
    workflow.createExploration();
    general.waitForSystem();
    general.waitForSystem();
    users.logout();

    users.createUser('creator2@subscriptions.com', 'creator2subscriptions');
    users.login('creator2@subscriptions.com');
    workflow.createExploration();
    users.logout();

    // Create a learner who subscribes to both the creators.
    users.createUser('learner1@subscriptions.com', 'learner1subscriptions');
    users.login('learner1@subscriptions.com');
    browser.get('/profile/creator1subscriptions');
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    browser.get('/profile/creator2subscriptions');
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    preferencesPage.get();
    preferencesPage.expectDisplayedFirstSubscriptionToBe('creator...');
    preferencesPage.expectDisplayedLastSubscriptionToBe('creator...');
    users.logout();

    // Create a learner who subscribes to one creator and unsubscribes from the
    // other.
    users.createUser('learner2@subscriptions.com', 'learner2subscriptions');
    users.login('learner2@subscriptions.com');
    browser.get('/profile/creator1subscriptions');
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    browser.get('/profile/creator2subscriptions');
    browser.waitForAngular();
    // Subscribe and then unsubscribe from the same user.
    subscriptionDashboardPage.navigateToSubscriptionButton();
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    preferencesPage.get();
    preferencesPage.expectSubscriptionCountToEqual(1);
    preferencesPage.expectDisplayedFirstSubscriptionToBe('creator...');
    users.logout();

    users.login('creator1@subscriptions.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    creatorDashboardPage.navigateToSubscriptionDashboard();
    subscriptionDashboardPage.expectSubscriptionFirstNameToMatch('learner...');
    subscriptionDashboardPage.expectSubscriptionLastNameToMatch('learner...');
    users.logout();

    users.login('creator2@subscriptions.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    creatorDashboardPage.navigateToSubscriptionDashboard();
    subscriptionDashboardPage.expectSubscriptionCountToEqual(1);
    subscriptionDashboardPage.expectSubscriptionLastNameToMatch('learner...');
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
