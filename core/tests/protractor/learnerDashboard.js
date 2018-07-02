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
 * @fileoverview End-to-end tests for the learner dashboard page and
 * subscriptions functionality.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LearnerDashboardPage =
  require('../protractor_utils/LearnerDashboardPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var SubscriptionDashboardPage =
  require('../protractor_utils/SubscriptionDashboardPage.js');

describe('Learner dashboard functionality', function() {
  var creatorDashboardPage = null;
  var adminPage = null;
  var explorationEditorPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;
  var explorationPlayerPage = null;
  var subscriptionDashboardPage = null;

  beforeEach(function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    subscriptionDashboardPage = (
      new SubscriptionDashboardPage.SubscriptionDashboardPage());
  });

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    // Create a new learner.
    users.createUser('learner@learnerDashboard.com', 'learnerlearnerDashboard');
    users.createUser(
      'creator2@learnerDashboard.com', 'creator2learnerDashboard');
    users.createModerator(
      'creator3@learnerDashboard.com', 'creator3learnerDashboard');

    var USERNAME = 'creator1learnerDashboard';
    users.createAndLoginAdminUser('creator1@learnerDashboard.com', USERNAME);
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
    collectionEditorPage.addExistingExploration('14');
    collectionEditorPage.saveDraft();
    collectionEditorPage.closeSaveModal();
    collectionEditorPage.publishCollection();
    collectionEditorPage.setTitle('Test Collection');
    collectionEditorPage.setObjective('This is a test collection.');
    collectionEditorPage.setCategory('Algebra');
    collectionEditorPage.saveChanges();
    browser.waitForAngular();
    users.logout();
  });

  it('displays incomplete and completed explorations', function() {
    users.login('learner@learnerDashboard.com');

    // Play an exploration and leave it in between. It should be added to the
    // 'In Progress' section.
    general.openPlayer('3');
    explorationPlayerPage.submitAnswer('Continue', null);
    browser.ignoreSynchronization = true;
    learnerDashboardPage.get();
    general.acceptAlert();
    browser.ignoreSynchronization = false;
    browser.waitForAngular();
    libraryPage.expectExplorationToBeVisible('Root Linear Coefficient Theorem');

    // Play an exploration completely. It should be added to the 'Completed'
    // section.
    general.openPlayer('14');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.submitAnswer(
      'MultipleChoiceInput', 'Those were all the questions I had!');
    explorationPlayerPage.submitAnswer('Continue', null);
    learnerDashboardPage.get();
    browser.waitForAngular();
    learnerDashboardPage.navigateToCompletedSection();
    libraryPage.expectExplorationToBeVisible('About Oppia');
    users.logout();

    users.login('creator3@learnerDashboard.com');
    general.openEditor('3');
    explorationEditorPage.navigateToSettingsTab();
    element(by.css('.protractor-test-delete-exploration-button')).click();
    element(by.css(
      '.protractor-test-really-delete-exploration-button')).click();
    browser.waitForAngular();
    users.logout();

    users.login('learner@learnerDashboard.com');
    learnerDashboardPage.get();
    browser.waitForAngular();
    libraryPage.expectExplorationToBeHidden('Root Linear Coefficient Theorem');
    users.logout();
  });

  it('displays incomplete and completed collections', function() {
    users.login('learner@learnerDashboard.com');

    // Go to the test collection.
    browser.get('/search/find?q=');
    browser.waitForAngular();
    element.all(by.css(
      '.protractor-test-collection-summary-tile-title')).first().click();
    // Go to the first and only exploration.
    element.all(by.css(
      '.protractor-test-collection-exploration')).first().click();
    // Leave the exploration inbetween. The collection should be found in the
    // 'In Progress' section.
    explorationPlayerPage.submitAnswer('Continue', null);
    browser.ignoreSynchronization = true;
    learnerDashboardPage.get();
    general.acceptAlert();
    browser.waitForAngular();
    general.waitForSystem();
    browser.ignoreSynchronization = false;
    learnerDashboardPage.navigateToIncompleteCollectionsSection();
    learnerDashboardPage.expectTitleOfSummaryTileToMatch('Test Collection');

    // Go to the test collection.
    browser.get('/search/find?q=');
    browser.waitForAngular();
    general.waitForSystem();
    element.all(by.css(
      '.protractor-test-collection-summary-tile-title')).first().click();
    general.waitForSystem();
    // Go to the first and only exploration.
    element.all(by.css(
      '.protractor-test-collection-exploration')).first().click();
    // Complete the exploration. The collection should be found in the
    // 'Completed' section as the collection is also completed.
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.submitAnswer(
      'MultipleChoiceInput', 'Those were all the questions I had!');
    explorationPlayerPage.submitAnswer('Continue', null);
    learnerDashboardPage.get();
    browser.waitForAngular();
    general.waitForSystem();
    learnerDashboardPage.navigateToCompletedSection();
    general.waitForSystem();
    learnerDashboardPage.navigateToCompletedCollectionsSection();
    learnerDashboardPage.expectTitleOfSummaryTileToMatch('Test Collection');
    users.logout();

    users.login('creator1@learnerDashboard.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    general.waitForSystem();
    creatorDashboardPage.navigateToCollectionEditor();
    browser.waitForAngular();
    general.waitForSystem();
    collectionEditorPage.addExistingExploration('0');
    browser.waitForAngular();
    general.waitForSystem();
    collectionEditorPage.saveDraft();
    browser.waitForAngular();
    general.waitForSystem();
    element(by.css('.protractor-test-commit-message-input')).sendKeys('Update');
    browser.driver.sleep(300);
    collectionEditorPage.closeSaveModal();
    general.waitForSystem();
    browser.driver.sleep(300);
    users.logout();

    users.login('learner@learnerDashboard.com');
    learnerDashboardPage.get();
    browser.waitForAngular();
    general.waitForSystem();
    learnerDashboardPage.navigateToIncompleteCollectionsSection();
    learnerDashboardPage.expectTitleOfSummaryTileToMatch('Test Collection');
    users.logout();
  });

  it('displays learners subscriptions', function() {
    users.login('learner@learnerDashboard.com');

    // Subscribe to both the creators.
    browser.get('/profile/creator1learnerDashboard');
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    browser.get('/profile/creator2learnerDashboard');
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();

    // Both creators should be present in the subscriptions section of the
    // dashboard.
    learnerDashboardPage.get();
    browser.waitForAngular();
    general.waitForSystem();
    learnerDashboardPage.navigateToSubscriptionsSection();
    learnerDashboardPage.expectSubscriptionFirstNameToMatch('creator...');
    learnerDashboardPage.expectSubscriptionLastNameToMatch('creator...');
    users.logout();
  });

  it('displays learner feedback threads', function() {
    users.login('learner@learnerDashboard.com');
    var feedback = 'A good exploration. Would love to see a few more questions';

    libraryPage.get();
    general.openPlayer('14');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.submitAnswer(
      'MultipleChoiceInput', 'Those were all the questions I had!');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.submitFeedback(feedback);
    learnerDashboardPage.get();
    browser.waitForAngular();
    learnerDashboardPage.navigateToFeedbackSection();
    learnerDashboardPage.expectFeedbackExplorationTitleToMatch('About Oppia');
    learnerDashboardPage.navigateToFeedbackThread();
    learnerDashboardPage.expectFeedbackMessageToMatch(feedback);
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('Subscriptions functionality', function() {
  var creatorDashboardPage = null;
  var preferencesPage = null;
  var subscriptionDashboardPage = null;

  beforeEach(function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    preferencesPage = new PreferencesPage.PreferencesPage();
    subscriptionDashboardPage = (
      new SubscriptionDashboardPage.SubscriptionDashboardPage());
  });

  it('handle subscriptions to creators correctly', function() {
    // Create two creators.
    users.createUser('creator1@subscriptions.com', 'creator1subscriptions');
    users.login('creator1@subscriptions.com');
    workflow.createExploration();
    general.waitForSystem();
    general.waitForSystem();
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
    subscriptionDashboardPage.navigateToSubscriptionButton();
    browser.get('/profile/creator2subscriptions');
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    preferencesPage.get();
    preferencesPage.expectDisplayedFirstSubscriptionToBe('creator...');
    preferencesPage.expectDisplayedLastSubscriptionToBe('creator...');
    users.logout();

    // Create a learner who subscribes to one creator and unsubscribes from the
    // other.
    users.createUser('learner2@subscriptions.com', 'learner2subscriptions');
    users.login('learner2@subscriptions.com');
    browser.get('/profile/creator1subscriptions');
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    browser.get('/profile/creator2subscriptions');
    browser.waitForAngular();
    // Subscribe and then unsubscribe from the same user.
    subscriptionDashboardPage.navigateToSubscriptionButton();
    browser.waitForAngular();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    preferencesPage.get();
    preferencesPage.expectSubscriptionCountToEqual(1);
    preferencesPage.expectDisplayedFirstSubscriptionToBe('creator...');
    users.logout();

    users.login('creator1@subscriptions.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    creatorDashboardPage.navigateToSubscriptionDashboard();
    subscriptionDashboardPage.expectSubscriptionFirstNameToMatch('learner...');
    subscriptionDashboardPage.expectSubscriptionLastNameToMatch('learner...');
    users.logout();

    users.login('creator2@subscriptions.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    creatorDashboardPage.navigateToSubscriptionDashboard();
    subscriptionDashboardPage.expectSubscriptionCountToEqual(1);
    subscriptionDashboardPage.expectSubscriptionLastNameToMatch('learner...');
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
