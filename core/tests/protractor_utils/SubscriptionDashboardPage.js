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

var until = protractor.ExpectedConditions;

var SubscriptionDashboardPage = function() {
  var subscriptionButton = element(
    by.css('.protractor-test-subscription-button'));
  var subscriptionName = element.all(
    by.css('.protractor-test-subscription-name'));

  this.navigateToUserSubscriptionPage = function(userName) {
    browser.get('/profile/' + userName);
  };

  this.expectSubscriptionFirstNameToMatch = function(name) {
    browser.wait(until.visibilityOf(subscriptionName.first()), 5000,
      'First Subscriber Name is not visible').then(function(isVisible) {
      if (isVisible) {
        expect(subscriptionName.first().getText()).toMatch(name);
      }
    });
  };

  this.expectSubscriptionLastNameToMatch = function(name) {
    browser.wait(until.visibilityOf(subscriptionName.last()), 5000,
      'Last Subscriber Name is not visible').then(function(isVisible) {
      if (isVisible) {
        expect(subscriptionName.last().getText()).toMatch(name);
      }
    });
  };

  this.expectSubscriptionCountToEqual = function(value) {
    browser.wait(until.visibilityOf(subscriptionName.first()), 5000,
      'Subscriber Name Card takes too long to appear')
      .then(function(isVisible) {
        if (isVisible) {
          expect(subscriptionName.count()).toEqual(value);
        }
      });
  };

  this.navigateToSubscriptionButton = function() {
    browser.wait(until.elementToBeClickable(subscriptionButton), 5000,
      'Subscription button is not clickable').then(function(isClickable) {
      if (isClickable) {
        subscriptionButton.click();
      }
    });
  };
};

exports.SubscriptionDashboardPage = SubscriptionDashboardPage;
