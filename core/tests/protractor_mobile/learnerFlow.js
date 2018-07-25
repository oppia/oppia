// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for mobile to login, load a
 * demo exploration and a demo collection, play around and then logout.
 */

var AdminPage = require('../protractor_utils/AdminPage.js');
var LearnerDashboardPage = require(
  '../protractor_utils/LearnerDashboardPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');

describe('learner flow for mobile', function () {
  var adminPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));
  var continueButton = element(by.css('.protractor-test-continue-button'));
  var clickContinueButton = function () {
    waitFor.elementToBeClickable(
      continueButton, 'Could not click continue button');
    continueButton.click();
    waitFor.pageToFullyLoad();
  };

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();

    var ADM_VISITOR = 'admVisitor';
    users.login('admVisitor@learner.com', true);
    users.completeSignup(ADM_VISITOR);
    // Load /explore/24
    adminPage.reloadExploration('learner_flow_test.yaml');
    // Load /explore/22
    adminPage.reloadExploration('protractor_mobile_test_exploration.yaml');
    // Load /collection/1
    adminPage.reloadCollection(1);
    users.logout();
    var LEARNER_USERNAME = 'learnerMobile';
    users.createUser('learnerMobile@learnerFlow.com', LEARNER_USERNAME);
  });

  it('visits the exploration player and plays the correct exploration',
    function () {
      users.login('learnerMobile@learnerFlow.com');
      learnerDashboardPage.get();
      browser.get('/explore/24');
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/explore/24');
    });

  it('visits the collection player and plays the correct collection',
    function () {
      users.login('learnerMobile@learnerFlow.com');
      learnerDashboardPage.get();
      browser.get('/collection/1');
      waitFor.pageToFullyLoad();
      expect(browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/collection/1');
    });

  it('displays incomplete and completed explorations', function () {
    users.login('learnerMobile@learnerFlow.com');
    learnerDashboardPage.get();

    // Go to the first test exploration.
    // Leave this exploration incomplete.
    browser.get('/explore/24');
    waitFor.pageToFullyLoad();
    clickContinueButton();
    // User clicks on Oppia logo to leave exploration.
    oppiaLogo.click();
    general.acceptAlert();
    // Wait for /learner_dashboard to load.
    waitFor.pageToFullyLoad();

    // Go to the second test exploration.
    // Complete this exploration.
    browser.get('/explore/22');
    waitFor.pageToFullyLoad();
    oppiaLogo.click();
    waitFor.pageToFullyLoad();

    // Learner Dashboard should display 'Dummy Exploration'
    // as incomplete.
    learnerDashboardPage.navigateToInCompleteSection();
    learnerDashboardPage.navigateToIncompleteExplorationsSection();
    learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      'Dummy Exploration');

    // Learner Dashboard should display 'Mobile device testing'
    // exploration as complete.
    learnerDashboardPage.navigateToCompletedSection();
    learnerDashboardPage.navigateToCompletedExplorationsSection();
    learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      'Mobile device testing');

    // Now complete the 'Dummmy Exploration'.
    browser.get('/explore/24');
    waitFor.pageToFullyLoad();
    clickContinueButton();
    // Navigate to the second page.
    clickContinueButton();

    // Both should be added to the completed section.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToCompletedSection();
    learnerDashboardPage.navigateToCompletedExplorationsSection();
    learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      'Dummy Exploration');
    learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      'Mobile device testing');
  });

  it('displays incomplete and completed collections', function () {
    users.login('learnerMobile@learnerFlow.com');
    learnerDashboardPage.get();
    // Go to the test collection.
    // Leave this collection incomplete.
    // Navigate to the first exploration of the collection
    // and leave it incomplete.
    browser.get('/explore/19?collection_id=1');
    waitFor.pageToFullyLoad();
    clickContinueButton();
    // User clicks on Oppia logo to leave collection.
    oppiaLogo.click();
    // Wait for /learner_dashboard to load.
    waitFor.pageToFullyLoad();

    // Learner Dashboard should display 'Introductions to Collections in Oppia'
    // as incomplete.
    learnerDashboardPage.navigateToInCompleteSection();
    learnerDashboardPage.navigateToIncompleteCollectionsSection();
    learnerDashboardPage.expectTitleOfCollectionSummaryTileToMatch(
      'Test Collection');

    // Complete all remaining explorations of the collection.
    // The first exploration is already completed.
    // Second exploration.
    browser.get('/explore/20?collection_id=1');
    waitFor.pageToFullyLoad();
    clickContinueButton();
    // Third exploration.
    browser.get('/explore/21?collection_id=1');
    waitFor.pageToFullyLoad();
    clickContinueButton();

    // Learner Dashboard should display 'Introductions to Collections in Oppia'
    // as complete.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToCompletedSection();
    learnerDashboardPage.navigateToCompletedCollectionsSection();
    learnerDashboardPage.expectTitleOfCollectionSummaryTileToMatch(
      'Test Collection');
  });

  afterEach(function () {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
