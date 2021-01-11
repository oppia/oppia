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
var action = require('./action.js');
var waitFor = require('./waitFor.js');

var SubscriptionDashboardPage = function() {
  var subscriptionButton = element(
    by.css('.protractor-test-subscription-button'));
  var subscriptionName = element.all(
    by.css('.protractor-test-subscription-name'));
  var subscribeLabel = element(by.css('.protractor-test-subscribe-label'));
  var unsubscribeLabel = element(by.css('.protractor-test-unsubscribe-label'));

  this.navigateToUserSubscriptionPage = async function(userName) {
    await browser.get('/profile/' + userName);
    await waitFor.pageToFullyLoad();
  };

  this.expectSubscriptionFirstNameToMatch = async function(name) {
    var firstSubscriberNameElem = await subscriptionName.first();
    await waitFor.visibilityOf(
      firstSubscriberNameElem, 'First Subscriber Name is not visible');
    expect(await firstSubscriberNameElem.getText()).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = async function(name) {
    var lastSubscriberNameElem = await subscriptionName.last();
    await waitFor.visibilityOf(
      lastSubscriberNameElem, 'Last Subscriber Name is not visible');
    expect(await lastSubscriberNameElem.getText()).toMatch(name);
  };

  this.expectSubscriptionCountToEqual = async function(value) {
    await waitFor.visibilityOf(
      await subscriptionName.first(),
      'Subscriber Name Card takes too long to appear');
    expect(await subscriptionName.count()).toEqual(value);
  };

  this.navigateToSubscriptionButton = async function() {
    await waitFor.elementToBeClickable(
      subscriptionButton, 'Subscription button is not clickable');
    var subscribeButtonStatusBeforeClick = await subscriptionButton.getText();
    await action.click('Subscription Button', subscriptionButton);
    if (subscribeButtonStatusBeforeClick === 'SUBSCRIBE') {
      await waitFor.visibilityOf(
        unsubscribeLabel,
        'Unsubscribe button is not visible.');
    } else {
      await waitFor.visibilityOf(
        subscribeLabel,
        'Subscribe button is not visible.');
    }
  };
};

exports.SubscriptionDashboardPage = SubscriptionDashboardPage;
