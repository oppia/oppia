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
 * @fileoverview End-to-end tests for the learner dashboard page.
 */

var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var collectionEditor = require('../protractor_utils/collectionEditor.js');
var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var player = require('../protractor_utils/player.js');
var UsersPage = require('../protractor_utils/UsersPage.js');

var usersPage = new UsersPage.UsersPage()

describe('Learner dashboard functionality', function() {
  var creatorDashboardPage = null;
  var adminPage = null;
  var libraryPage = null;
  
  beforeEach(function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
  });

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    // Create a new learner.
    usersPage.createUser('learner@learnerDashboard.com', 'learnerlearnerDashboard');
    usersPage.createUser(
      'creator2@learnerDashboard.com', 'creator2learnerDashboard');
    usersPage.createModerator(
      'creator3@learnerDashboard.com', 'creator3learnerDashboard');

    var USERNAME = 'creator1learnerDashboard';
    usersPage.createAndLoginAdminUser('creator1@learnerDashboard.com', USERNAME);
    adminPage.reloadAllExplorations();
    adminPage.updateRole(USERNAME, 'collection editor');
    browser.get(general.SERVER_URL_PREFIX);
    var dropdown = element(by.css('.protractor-test-profile-dropdown'));
    browser.actions().mouseMove(dropdown).perform();
    dropdown.element(by.css('.protractor-test-dashboard-link')).click();
    browser.waitForAngular();
    element(by.css('.protractor-test-create-activity')).click();
    // Create new collection.
    element(by.css('.protractor-test-create-collection')).click();
    browser.waitForAngular();
    collectionEditor.addExistingExploration('14');
    collectionEditor.saveDraft();
    collectionEditor.closeSaveModal();
    collectionEditor.publishCollection();
    collectionEditor.setTitle('Test Collection');
    collectionEditor.setObjective('This is a test collection.');
    collectionEditor.setCategory('Algebra');
    collectionEditor.saveChanges();
    browser.waitForAngular();
    usersPage.logout();
  });

  it('displays incomplete and completed explorations', function() {
    usersPage.login('learner@learnerDashboard.com');

    // Play an exploration and leave it in between. It should be added to the
    // 'In Progress' section.
    general.openPlayer('3');
    player.submitAnswer('Continue', null);
    browser.ignoreSynchronization = true;
    browser.get(general.LEARNER_DASHBOARD_URL);
    general.acceptAlert();
    browser.ignoreSynchronization = false;
    browser.waitForAngular();
    libraryPage.expectExplorationToBeVisible('Root Linear Coefficient Theorem');

    // Play an exploration completely. It should be added to the 'Completed'
    // section.
    general.openPlayer('14');
    player.submitAnswer('Continue', null);
    player.submitAnswer(
      'MultipleChoiceInput', 'Those were all the questions I had!');
    player.submitAnswer('Continue', null);
    browser.get(general.LEARNER_DASHBOARD_URL);
    browser.waitForAngular();
    element(by.css('.protractor-test-completed-section')).click();
    browser.waitForAngular();
    libraryPage.expectExplorationToBeVisible('About Oppia');
    usersPage.logout();
    library.expectExplorationToBeVisible('About Oppia');
    usersPage.logout();

    usersPage.login('creator3@learnerDashboard.com');
    general.openEditor('3');
    editor.navigateToSettingsTab();
    element(by.css('.protractor-test-delete-exploration-button')).click();
    element(by.css(
      '.protractor-test-really-delete-exploration-button')).click();
    browser.waitForAngular();
    usersPage.logout();

    usersPage.login('learner@learnerDashboard.com');
    browser.get(general.LEARNER_DASHBOARD_URL);
    browser.waitForAngular();
    libraryPage.expectExplorationToBeHidden('Root Linear Coefficient Theorem');
    usersPage.logout();
    library.expectExplorationToBeHidden('Root Linear Coefficient Theorem');
    usersPage.logout();
  });

  it('displays incomplete and completed collections', function() {
    usersPage.login('learner@learnerDashboard.com');

    // Go to the test collection.
    browser.get('/search/find?q=');
    browser.waitForAngular();
    element.all(by.css(
      '.protractor-test-collection-summary-tile-title')).first().click();
    // Go to the first and only exploration.
    element.all(by.css(
      '.protractor-test-collection-node')).first().click();
    // Leave the exploration inbetween. The collection should be found in the
    // 'In Progress' section.
    player.submitAnswer('Continue', null);
    browser.ignoreSynchronization = true;
    browser.get(general.LEARNER_DASHBOARD_URL);
    general.acceptAlert();
    browser.waitForAngular();
    general.waitForSystem();
    browser.ignoreSynchronization = false;
    element(by.css('.protractor-test-incomplete-collection-section')).click();
    browser.waitForAngular();
    general.waitForSystem();
    expect(element.all(by.css(
      '.protractor-test-collection-summary-tile-title')).first(
    ).getText()).toMatch('Test Collection');

    // Go to the test collection.
    browser.get('/search/find?q=');
    browser.waitForAngular();
    general.waitForSystem();
    element.all(by.css(
      '.protractor-test-collection-summary-tile-title')).first().click();
    general.waitForSystem();
    // Go to the first and only exploration.
    element.all(by.css(
      '.protractor-test-collection-node')).first().click();
    // Complete the exploration. The collection should be found in the
    // 'Completed' section as the collection is also completed.
    player.submitAnswer('Continue', null);
    player.submitAnswer(
      'MultipleChoiceInput', 'Those were all the questions I had!');
    player.submitAnswer('Continue', null);
    browser.get(general.LEARNER_DASHBOARD_URL);
    browser.waitForAngular();
    general.waitForSystem();
    element(by.css('.protractor-test-completed-section')).click();
    browser.waitForAngular();
    general.waitForSystem();
    element(by.css('.protractor-test-completed-collection-section')).click();
    browser.waitForAngular();
    general.waitForSystem();
    expect(element.all(by.css(
      '.protractor-test-collection-summary-tile-title')).first(
    ).getText()).toMatch('Test Collection');
    usersPage.logout();

    usersPage.login('creator1@learnerDashboard.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    general.waitForSystem();
    creatorDashboardPage.navigateToCollectionEditor();
    browser.waitForAngular();
    general.waitForSystem();
    collectionEditor.addExistingExploration('0');
    browser.waitForAngular();
    general.waitForSystem();
    collectionEditor.saveDraft();
    browser.waitForAngular();
    general.waitForSystem();
    element(by.css('.protractor-test-commit-message-input')).sendKeys('Update');
    browser.driver.sleep(300);
    collectionEditor.closeSaveModal();
    general.waitForSystem();
    browser.driver.sleep(300);
    usersPage.logout();

    usersPage.login('learner@learnerDashboard.com');
    browser.get(general.LEARNER_DASHBOARD_URL);
    browser.waitForAngular();
    general.waitForSystem();
    element(by.css('.protractor-test-incomplete-collection-section')).click();
    browser.waitForAngular();
    general.waitForSystem();
    expect(element.all(by.css(
      '.protractor-test-collection-summary-tile-title')).first(
    ).getText()).toMatch('Test Collection');
    usersPage.logout();
  });

  it('displays learners subscriptions', function() {
    usersPage.login('learner@learnerDashboard.com');

    // Subscribe to both the creators.
    browser.get('/profile/creator1learnerDashboard');
    browser.waitForAngular();
    element(by.css('.protractor-test-subscription-button')).click();
    browser.get('/profile/creator2learnerDashboard');
    browser.waitForAngular();
    element(by.css('.protractor-test-subscription-button')).click();

    // Both creators should be present in the subscriptions section of the
    // dashboard.
    browser.get(general.LEARNER_DASHBOARD_URL);
    browser.waitForAngular();
    general.waitForSystem();
    element(by.css('.protractor-test-subscriptions-section')).click();
    browser.waitForAngular();
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).first().getText()).toMatch(
      'creator...');
    expect(element.all(by.css(
      '.protractor-test-subscription-name')).last().getText()).toMatch(
      'creator...');
    usersPage.logout();
  });

  it('displays learner feedback threads', function() {
    usersPage.login('learner@learnerDashboard.com');
    var feedback = 'A good exploration. Would love to see a few more questions';

    libraryPage.get();
    general.openPlayer('14');
    player.submitAnswer('Continue', null);
    player.submitAnswer(
      'MultipleChoiceInput', 'Those were all the questions I had!');
    player.submitAnswer('Continue', null);
    player.submitFeedback(feedback);
    browser.get(general.LEARNER_DASHBOARD_URL);
    browser.waitForAngular();
    element(by.css('.protractor-test-feedback-section')).click();
    browser.waitForAngular();
    expect(element.all(by.css(
      '.protractor-test-feedback-exploration')).first().getText()).toMatch(
      'About Oppia');
    element(by.css('.protractor-test-feedback-thread')).click();
    browser.waitForAngular();
    expect(element.all(by.css(
      '.protractor-test-feedback-message')).first().getText()).toMatch(
      feedback);
    usersPage.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
