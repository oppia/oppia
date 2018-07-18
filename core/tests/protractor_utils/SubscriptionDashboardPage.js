// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the subscription dashboard,
 * for use in Protractor tests.
 */
var waitFor = require('./waitFor.js');

var SubscriptionDashboardPage = function() {
  var subscriptionButton = element(
    by.css('.protractor-test-subscription-button'));
  var subscriptionName = element.all(
    by.css('.protractor-test-subscription-name'));

  this.navigateToUserSubscriptionPage = function(userName) {
    browser.get('/profile/' + userName);
    return waitFor.pageToFullyLoad();
  };

  this.expectSubscriptionFirstNameToMatch = function(name) {
    waitFor.visibilityOf(
      subscriptionName.first(), 'First Subscriber Name is not visible');
    expect(subscriptionName.first().getText()).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = function(name) {
    waitFor.visibilityOf(
      subscriptionName.last(), 'Last Subscriber Name is not visible');
    expect(subscriptionName.last().getText()).toMatch(name);
  };

  this.expectSubscriptionCountToEqual = function(value) {
    waitFor.visibilityOf(
      subscriptionName.first(),
      'Subscriber Name Card takes too long to appear');
    expect(subscriptionName.count()).toEqual(value);
  };

  this.navigateToSubscriptionButton = function() {
    waitFor.elementToBeClickable(
      subscriptionButton, 'Subscription button is not clickable');
    subscriptionButton.click();
  };
};

exports.SubscriptionDashboardPage = SubscriptionDashboardPage;
