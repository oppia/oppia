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
 * @fileoverview Page object for the subscription dashboard,
 * for use in WebdriverIO tests.
 */
var action = require('./action.js');
var waitFor = require('./waitFor.js');

var SubscriptionDashboardPage = function () {
  var subscriptionButton = $('.e2e-test-subscription-button');
  var subscribeLabel = $('.e2e-test-subscribe-label');
  var subscriptionNameElement = $('.e2e-test-subscription-name');
  var subscriptionNameSelector = function () {
    return $$('.e2e-test-subscription-name');
  };
  var unsubscribeLabel = $('.e2e-test-unsubscribe-label');

  this.navigateToUserSubscriptionPage = async function (userName) {
    await browser.url('/profile/' + userName);
    await waitFor.pageToFullyLoad();
  };

  this.expectSubscriptionFirstNameToMatch = async function (name) {
    await waitFor.visibilityOf(
      subscriptionNameElement,
      'First Subscriber Name is not visible'
    );
    var subscriptionName = await subscriptionNameSelector();
    var firstSubscriberNameElem = subscriptionName[0];
    expect(await firstSubscriberNameElem.getText()).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = async function (name) {
    await waitFor.visibilityOf(
      subscriptionNameElement,
      'Last Subscriber Name is not visible'
    );
    var subscriptionName = await subscriptionNameSelector();
    var lastElement = subscriptionName.length - 1;
    var lastSubscriberNameElem = subscriptionName[lastElement];
    expect(await lastSubscriberNameElem.getText()).toMatch(name);
  };

  this.expectSubscriptionCountToEqual = async function (value) {
    await waitFor.visibilityOf(
      subscriptionNameElement,
      'Subscriber Name Card takes too long to appear'
    );
    var subscriptionName = await subscriptionNameSelector();
    expect(subscriptionName.length).toEqual(value);
  };

  this.clickSubscribeButton = async function () {
    await waitFor.elementToBeClickable(
      subscriptionButton,
      'Subscription button is not clickable'
    );
    var subscribeButtonStatusBeforeClick = await subscriptionButton.getText();
    await action.click('Subscription Button', subscriptionButton);
    if (subscribeButtonStatusBeforeClick === 'SUBSCRIBE') {
      await waitFor.visibilityOf(
        unsubscribeLabel,
        'Unsubscribe button is not visible.'
      );
    } else {
      await waitFor.visibilityOf(
        subscribeLabel,
        'Subscribe button is not visible.'
      );
    }
  };
};

exports.SubscriptionDashboardPage = SubscriptionDashboardPage;
