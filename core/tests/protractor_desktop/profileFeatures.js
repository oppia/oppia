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
* @fileoverview End-to-end tests for user profile features.
*/

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');


var LearnerDashboardPage =
  require('../protractor_utils/LearnerDashboardPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var SubscriptionDashboardPage =
  require('../protractor_utils/SubscriptionDashboardPage.js');

describe('Profile Features functionality', function() {
  var libraryPage = null;
  var learnerDashboardPage = null;
  var subscriptionDashboardPage = null;

  var creator1Id = 'FirstCreator';
  var creator2Id = 'SecondCreator';
  users.createUser('FirstUser@profileFeatures.com',
    'FirstUserprofileFeatures');
  users.createUser('SecondUser@profileFeatures.com',
    'SecondUserprofileFeatures');
  users.createUser(creator1Id + '@profileFeatures.com',
    creator1Id);
  users.createUser(creator2Id + '@profileFeatures.com',
    creator2Id);

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  });

  it('View a particular exploration created by another User', function() {
    users.login(creator1Id + '@profileFeatures.com');
    workflow.createAndPublishExploration(
      'Activation',
      'Chemistry',
      'English'
    );
    users.logout();

    users.login('FirstUser@profileFeatures.com');
    // Subscribing to a User to get all his created explorations.
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();

    // finding a particular exploration on user's library and playing it.
    libraryPage.get();
    libraryPage.findExploration('Activations');
    libraryPage.playExploration('Activations');
    users.logout();
  });

  it('should subscribe to a particular user', function() {
    users.login('FirstUser@profileFeatures.com');

    // Subscribe to both the creators.
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator2Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();

    // Checking all the users subscribed present in user's dashboard.
    // Both creators should be present in the subscriptions section of the
    // dashboard.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToSubscriptionsSection();
    // The last user (SecondCreator) that learner subsribes to is placed first
    // in the list.
    learnerDashboardPage.expectSubscriptionFirstNameToMatch('Second...');
    // The first user (FirstCreator) that learner subscribes to is placed
    // last in the list.
    learnerDashboardPage.expectSubscriptionLastNameToMatch('First...');
    users.logout();
  });

  it('View number of explorations created by a User', function() {
    users.login('FirstUser@profileFeatures.com');

    // Creating some explorations.
    workflow.createAndPublishExploration(
      'Activation',
      'Chemistry',
      'Introduction',
      'English',
      'BUS101',
      'Business'
    );

    // Getting Number of explorations created by a User.
    LibraryPage.get();
    LibraryPage.getAllExplorationElements();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
