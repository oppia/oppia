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
 * @fileoverview Page object for the learner dashboard, for use in Protractor
 * tests.
 */

var until = protractor.ExpectedConditions;

var LearnerDashboardPage = function() {
  var LEARNER_DASHBOARD_URL = '/learner_dashboard';
  var completedSection =
    element(by.css('.protractor-test-completed-section'));
  var incompleteSection =
    element(by.css('.protractor-test-incomplete-section'));
  var feedbackSection =
    element(by.css('.protractor-test-feedback-section'));
  var feedbackThread =
    element(by.css('.protractor-test-feedback-thread'));
  var completedCollectionsSection =
    element(by.css('.protractor-test-completed-collection-section'));
  var completedExplorationsSection =
    element(by.css('.protractor-test-completed-exp-section'));
  var incompleteCollectionsSection =
    element(by.css('.protractor-test-incomplete-collection-section'));
  var incompleteExplorationsSection =
    element(by.css('.protractor-test-incomplete-exp-section'));
  var subscriptionsSection =
    element(by.css('.protractor-test-subscriptions-section'));
  var subscriptionName =
    element.all(by.css('.protractor-test-subscription-name'));
  var titleOfExplorationSummaryTile =
    element.all(by.css('.protractor-test-exp-summary-tile-title'));
  var titleOfCollectionSummaryTile =
    element.all(by.css('.protractor-test-collection-summary-tile-title'));
  var feedbackExplorationTitle =
    element.all(by.css('.protractor-test-feedback-exploration'));
  var feedbackMessage =
    element.all(by.css('.protractor-test-feedback-message'));

  this.get = function() {
    return browser.get(LEARNER_DASHBOARD_URL);
  };

  this.navigateToCompletedSection = function() {
    browser.wait(until.elementToBeClickable(completedSection), 5000,
      'Completed tab takes too long to appear').then(function(isClickable) {
      if (isClickable) {
        completedSection.click();
      }
    });
  };

  this.navigateToInCompleteSection = function() {
    browser.wait(until.elementToBeClickable(incompleteSection), 5000,
      'In Progress tab takes too long to appear').then(function(isClickable) {
      if (isClickable) {
        incompleteSection.click();
      }
    });
  };

  this.navigateToIncompleteCollectionsSection = function() {
    browser.wait(until.elementToBeClickable(incompleteCollectionsSection), 5000,
      'Incomplete Collection Section tab takes too long to appear')
      .then(function(isClickable) {
        if (isClickable) {
          incompleteCollectionsSection.click();
        }
      });
  };

  this.navigateToIncompleteExplorationsSection = function() {
    browser.wait(until.elementToBeClickable(incompleteExplorationsSection),
      5000, 'Incomplete Collection Section tab takes too long to appear')
      .then(function(isClickable) {
        if (isClickable) {
          incompleteExplorationsSection.click();
        }
      });
  };

  this.navigateToCompletedCollectionsSection = function() {
    browser.wait(until.elementToBeClickable(completedCollectionsSection), 5000,
      'Completed Collection Section tab takes too long to appear')
      .then(function(isClickable) {
        if (isClickable) {
          completedCollectionsSection.click();
        }
      });
  };

  this.navigateToCompletedExplorationsSection = function() {
    browser.wait(until.elementToBeClickable(completedExplorationsSection), 5000,
      'Completed Collection Section tab takes too long to appear')
      .then(function(isClickable) {
        if (isClickable) {
          completedExplorationsSection.click();
        }
      });
  };

  this.navigateToFeedbackSection = function() {
    browser.wait(until.elementToBeClickable(feedbackSection), 5000,
      'Feedback Section tab takes too long to appear')
      .then(function(isClickable) {
        if (isClickable) {
          feedbackSection.click();
        }
      });
  };

  this.navigateToFeedbackThread = function() {
    browser.wait(until.elementToBeClickable(feedbackThread), 5000,
      'Feedback Thread tab takes too long to appear')
      .then(function(isClickable) {
        if (isClickable) {
          feedbackThread.click();
        }
      });
  };

  this.navigateToSubscriptionsSection = function() {
    browser.wait(until.elementToBeClickable(subscriptionsSection), 5000,
      'Subscriptions Section tab takes too long to appear')
      .then(function(isClickable) {
        if (isClickable) {
          subscriptionsSection.click();
        }
      });
  };

  this.expectTitleOfCollectionSummaryTileToBeHidden = function(title) {
    element.all(by.cssContainingText(
      '.protractor-test-collection-summary-tile-title', title))
      .then(function(items) {
        expect(items.length).toBe(0);
      });
  };

  this.expectTitleOfCollectionSummaryTileToMatch = function(title) {
    var collectionTitle = element(by.cssContainingText(
      '.protractor-test-collection-summary-tile-title', title));
    expect(collectionTitle.isDisplayed()).toBe(true);
  };

  this.expectTitleOfExplorationSummaryTileToBeHidden = function(title) {
    element.all(by.cssContainingText(
      '.protractor-test-exp-summary-tile-title', title)).then(function(items) {
      expect(items.length).toBe(0);
    });
  };

  this.expectTitleOfExplorationSummaryTileToMatch = function(title) {
    var explorationTitle = element(
      by.cssContainingText('.protractor-test-exp-summary-tile-title', title));
    expect(explorationTitle.isDisplayed()).toBe(true);
  };

  this.expectSubscriptionFirstNameToMatch = function(name) {
    browser.wait(until.visibilityOf(subscriptionName.first()), 5000,
      'Subscription First Name takes too long to appear')
      .then(function(isVisible) {
        if (isVisible) {
          expect(
            subscriptionName.first().getText()
          ).toMatch(name);
        }
      });
  };

  this.expectSubscriptionLastNameToMatch = function(name) {
    browser.wait(until.visibilityOf(subscriptionName.last()), 5000,
      'Subscription Last Name takes too long to appear')
      .then(function(isVisible) {
        if (isVisible) {
          expect(
            subscriptionName.last().getText()
          ).toMatch(name);
        }
      });
  };

  this.expectFeedbackExplorationTitleToMatch = function(title) {
    browser.wait(until.visibilityOf(feedbackExplorationTitle.first()), 5000,
      'Feedback Exploration Title takes too long to appear')
      .then(function(isVisible) {
        if (isVisible) {
          expect(
            feedbackExplorationTitle.first().getText()
          ).toMatch(title);
        }
      });
  };

  this.expectFeedbackMessageToMatch = function(message) {
    browser.wait(until.visibilityOf(feedbackMessage.first()), 5000,
      'Feedback Message takes too long to appear')
      .then(function(isVisible) {
        if (isVisible) {
          expect(
            feedbackMessage.first().getText()
          ).toMatch(message);
        }
      });
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
