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
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Subscriptions functionality', function() {
  var creatorDashboardPage = null;

  beforeEach(function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
  });

  it('handle subscriptions to creators correctly', function() {
    // Create two creators.
    users.createUser('creator1@subscriptions.com', 'creator1subscriptions');
    users.login('creator1@subscriptions.com');
    workflow.createExploration();
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
    element(by.css('.protractor-test-subscription-button')).click();
    browser.get('/profile/creator2subscriptions');
    browser.waitForAngular();
    element(by.css('.protractor-test-subscription-button')).click();
    browser.get(general.USER_PREFERENCES_URL);
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).first().getText()).toMatch(
      'creator...');
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).last().getText()).toMatch(
      'creator...');
    users.logout();

    // Create a learner who subscribes to one creator and unsubscribes from the
    // other.
    users.createUser('learner2@subscriptions.com', 'learner2subscriptions');
    users.login('learner2@subscriptions.com');
    browser.get('/profile/creator1subscriptions');
    browser.waitForAngular();
    element(by.css('.protractor-test-subscription-button')).click();
    browser.get('/profile/creator2subscriptions');
    browser.waitForAngular();
    // Subscribe and then unsubscribe from the same user.
    element(by.css('.protractor-test-subscription-button')).click();
    browser.waitForAngular();
    element(by.css('.protractor-test-subscription-button')).click();
    browser.get(general.USER_PREFERENCES_URL);
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).count()).toEqual(1);
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).first().getText()).toMatch(
      'creator...');
    users.logout();

    users.login('creator1@subscriptions.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    creatorDashboardPage.navigateToSubscriptionDashboard();
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).first().getText()).toMatch(
      'learner...');
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).last().getText()).toMatch(
      'learner...');
    users.logout();

    users.login('creator2@subscriptions.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    creatorDashboardPage.navigateToSubscriptionDashboard();
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).count()).toEqual(1);
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).last().getText()).toMatch(
      'learner...');
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
