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

var users = require('../protractor_utils/users.js');

var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var SubscriptionDashboardPage = require(
  '../protractor_utils/SubscriptionDashboardPage.js');

describe('Profile Feature', function() {
  var preferencesPage = new PreferencesPage.PreferencesPage();
  var subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  it('should subscribe to a user', function() {
    var authorUsername = 'author';
    users.createUser('subscriber@profileFeature.com', 'subscriber');
    users.createUser('author@profileFeature.com', authorUsername);
    users.login('subscriber@profileFeature.com');
    preferencesPage.get();
    preferencesPage.expectSubscriptionCountToEqual(0);

    subscriptionDashboardPage.navigateToUserSubscriptionPage(authorUsername);
    subscriptionDashboardPage.navigateToSubscriptionButton();

    preferencesPage.get();
    preferencesPage.expectSubscriptionCountToEqual(1);
    preferencesPage.expectDisplayedFirstSubscriptionToBe(authorUsername);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
