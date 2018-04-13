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

var SubscriptionDashboardPage = function() {
  var subscriptionButton = element(
    by.css('.protractor-test-subscription-button'));
  var subscriptionName = element.all(
    by.css('.protractor-test-subscription-name'));

  this.expectSubscriptionFirstNameToMatch = function(name) {
    expect(
      subscriptionName.first().getText()
    ).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = function(name) {
    expect(
      subscriptionName.last().getText()
    ).toMatch(name);
  };

  this.expectSubscriptionCountToEqual = function(value) {
    expect(
      subscriptionName.count()
    ).toEqual(value);
  };

  this.navigateToSubscriptionButton = function(name) {
    subscriptionButton.click();
  };
};

exports.SubscriptionDashboardPage = SubscriptionDashboardPage;
