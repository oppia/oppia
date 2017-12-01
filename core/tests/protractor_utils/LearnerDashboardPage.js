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

var collectionEditor = require('./collectionEditor.js');

var LearnerDashboardPage = function() {
  var LEARNER_DASHBOARD_URL = '/learner_dashboard';
  var dropdown = element(by.css('.protractor-test-profile-dropdown'));
  var subscriptionButton =
    element(by.css('.protractor-test-subscription-button'));
  var dashboardLink = element(by.css('.protractor-test-dashboard-link'));
  var createCollection = element(by.css('.protractor-test-create-collection'));

  this.get = function() {
    return browser.get(LEARNER_DASHBOARD_URL);
  };

  this.subscribeCreatorOne = function() {
    browser.get('/profile/creator1learnerDashboard');
    browser.waitForAngular();
    subscriptionButton.click();
  }

  this.subscribeCreatorTwo = function() {
    browser.get('/profile/creator2learnerDashboard');
    browser.waitForAngular();
    subscriptionButton.click();
  }

  this.selectDropdown = function() {
    browser.actions().mouseMove(dropdown).perform();
    dropdown.dashboardLink.click();
    browser.waitForAngular();
  }

  this.createExploration = function() {
    createCollection.click();
    browser.waitForAngular();
  }

  this.publishExploration = function() {
    collectionEditor.addExistingExploration('14');
    collectionEditor.saveDraft();
    collectionEditor.closeSaveModal();
    collectionEditor.publishCollection();
    collectionEditor.setTitle('Test Collection');
    collectionEditor.setObjective('This is a test collection.');
    collectionEditor.setCategory('Algebra');
    collectionEditor.saveChanges();
    browser.waitForAngular();
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
