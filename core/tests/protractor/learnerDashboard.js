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
 * @fileoverview End-to-end tests for the learner dashboard page and
 * subscriptions functionality.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var until = protractor.ExpectedConditions;
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
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;
  var subscriptionDashboardPage = null;

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  });

  var createAboutOppiaExploration = function() {
    workflow.createExploration();
    general.waitForLoadingMessage();
    explorationEditorMainTab.setStateName('First');
    explorationEditorMainTab.setContent(forms.toRichText(
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'));
    explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setDestination('Second', true, null);
    explorationEditorMainTab.moveToState('Second');
    explorationEditorMainTab.setContent(forms.toRichText(
      'So what can I tell you?'));
    explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      forms.toRichText('How do your explorations work?'),
      forms.toRichText('What can you tell me about this website?'),
      forms.toRichText('How can I contribute to Oppia?'),
      forms.toRichText('Those were all the questions I had!')
    ]);
    explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', null, 'End Card', true, 'Equals',
      'Those were all the questions I had!');
    responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('I do not know!'));
    explorationEditorMainTab.moveToState('End Card');
    explorationEditorMainTab.setContent(
      forms.toRichText('Congratulations, you have finished!'));
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('About Oppia');
    explorationEditorSettingsTab.setCategory('Algorithm');
    explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    explorationEditorSettingsTab.setLanguage('English');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();
  };

  it('displays incomplete and completed explorations', function() {
    users.createUser('originalCreator@learnerDashboard.com',
      'originalCreator');
    users.createUser('learner@learnerDashboard.com',
      'learnerlearnerDashboard');
    users.createAdmin('inspector@learnerDashboard.com', 'inspector');
    users.login('originalCreator@learnerDashboard.com');
    // Create exploration 'About Oppia'
    createAboutOppiaExploration();
    // Create a second exploration named 'Dummy Exploration'.
    users.logout();

    users.login('learner@learnerDashboard.com');
    // Play exploration 'About Oppia'.
    libraryPage.get();
    libraryPage.findExploration('About Oppia');
    libraryPage.playExploration('About Oppia');
    explorationPlayerPage.expectExplorationNameToBe('About Oppia');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.expectExplorationToNotBeOver();

    // Disable waiting for Angular to accept alert.
    browser.waitForAngularEnabled(false);
    // Refresh page to simulate user leaving.
    browser.navigate().refresh().then(function() {
      browser.wait(until.alertIsPresent(), 5000);
      return browser.switchTo().alert().then(function (alert) {
        alert.accept().then(function() {
          // Re-enable waiting for Angular.
          return browser.waitForAngularEnabled(true);
        });
      });
    });

    general.waitForLoadingMessage();
    // Learner Dashboard should display 'About Oppia' as incomplete.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToInCompleteSection();
    learnerDashboardPage.navigateToIncompleteExplorationsSection();
    learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      'About Oppia');

    // Now play exploration 'About Oppia' completely.
    libraryPage.get();
    libraryPage.findExploration('About Oppia');
    libraryPage.playExploration('About Oppia');
    general.waitForLoadingMessage();
    explorationPlayerPage.expectExplorationNameToBe('About Oppia');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.submitAnswer(
      'MultipleChoiceInput', 'Those were all the questions I had!');

    // Both should be added to the completed section.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToCompletedSection();
    learnerDashboardPage.navigateToCompletedExplorationsSection();
    learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      'About Oppia');
    users.logout();

    // Login as Admin and delete exploration 'About Oppia'.
    users.login('inspector@learnerDashboard.com', true);
    libraryPage.get();
    libraryPage.findExploration('About Oppia');
    libraryPage.playExploration('About Oppia');
    // Wait for player page to completely load
    general.waitForLoadingMessage();
    general.getExplorationIdFromPlayer().then(function(explorationId) {
      general.openEditor(explorationId);
    });
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.deleteExploration();
    users.logout();

    // Verify exploration 'About Oppia' is deleted from learner dashboard.
    users.login('learner@learnerDashboard.com');
    learnerDashboardPage.get();
    // Learner Dashboard should be the default empty page.
    learnerDashboardPage.expectTitleOfExplorationSummaryTileToBeHidden(
      'About Oppia');
    users.logout();
  });

  it('displays incomplete and completed collections', function() {
    users.createUser('learner4@learnerDashboard.com',
      'learner4learnerDashboard');
    // Login to admin account
    users.createAdmin(
      'testCollectionAdm@learnerDashboard.com',
      'testcollectionAdmlearnerDashboard');
    users.createUser('explorationCreator@learnerDashboard.com',
      'explorationCreator');

    users.login('explorationCreator@learnerDashboard.com');
    // Create first exploration named 'Head of Collection'
    createAboutOppiaExploration();
    // Create a second exploration named 'Collection Exploration'.
    workflow.createAndPublishExploration(
      'Collection Exploration',
      'Architect',
      'To be a part of a collection!',
      'English'
    );
    users.logout();

    // Create new 'Test Collection' containing exploration 'Head of Collection'.
    users.login('testCollectionAdm@learnerDashboard.com', true);
    workflow.createCollectionAsAdmin();
    collectionEditorPage.searchForAndAddExistingExploration(
      'About Oppia');
    collectionEditorPage.saveDraft();
    collectionEditorPage.closeSaveModal();
    collectionEditorPage.publishCollection();
    collectionEditorPage.setTitle('Test Collection');
    collectionEditorPage.setObjective('This is a test collection.');
    collectionEditorPage.setCategory('Algebra');
    collectionEditorPage.saveChanges();
    users.logout();

    users.login('learner4@learnerDashboard.com');
    // Go to 'Test Collection' and play it.
    libraryPage.get();
    libraryPage.findExploration('Test Collection');
    libraryPage.playCollection('Test Collection');
    var firstExploration = element.all(
      by.css('.protractor-test-collection-exploration')).first();
    // Click first exploration in collection.
    browser.wait(until.elementToBeClickable(firstExploration), 10000,
      'Could not click first exploration in collection')
      .then(function(isClickable) {
        if (isClickable) {
          firstExploration.click();
        }
      });
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.expectExplorationToNotBeOver();

    // Disable waiting for Angular to accept alert.
    browser.waitForAngularEnabled(false);
    // Refresh page to simulate user leaving.
    browser.navigate().refresh().then(function() {
      browser.wait(until.alertIsPresent(), 5000);
      return browser.switchTo().alert().then(function (alert) {
        alert.accept().then(function() {
          // Re-enable waiting for Angular
          return browser.waitForAngularEnabled(true);
        });
      });
    });

    general.waitForLoadingMessage();
    // Learner Dashboard should display 'Test Collection' as incomplete.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToInCompleteSection();
    learnerDashboardPage.navigateToIncompleteCollectionsSection();
    learnerDashboardPage.expectTitleOfCollectionSummaryTileToMatch(
      'Test Collection');

    libraryPage.get();
    libraryPage.findExploration('Test Collection');
    libraryPage.playCollection('Test Collection');
    var firstExploration = element.all(
      by.css('.protractor-test-collection-exploration')).first();
      // Click first exploration in collection.
    browser.wait(until.elementToBeClickable(firstExploration), 10000,
      'Could not click first exploration in collection')
      .then(function(isClickable) {
        if (isClickable) {
          firstExploration.click();
        }
      });

    // Complete the exploration and rate it 5 stars!
    explorationPlayerPage.expectExplorationNameToBe('About Oppia');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.submitAnswer(
      'MultipleChoiceInput', 'Those were all the questions I had!');
    explorationPlayerPage.rateExploration(5);

    // The collection should be found in the 'Completed' section.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToCompletedSection();
    learnerDashboardPage.navigateToCompletedCollectionsSection();
    learnerDashboardPage.expectTitleOfCollectionSummaryTileToMatch(
      'Test Collection');
    users.logout();

    // Add exploration 'Collection Exploration' to 'Test Collection'
    // and publish it
    users.login('testCollectionAdm@learnerDashboard.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToCollectionEditor();
    collectionEditorPage.searchForAndAddExistingExploration(
      'Collection Exploration');
    collectionEditorPage.saveDraft();
    collectionEditorPage.setCommitMessage('Add Collection Exploration');
    collectionEditorPage.closeSaveModal();
    users.logout();

    // Verify 'Test Collection' is now in the incomplete section.
    users.login('learner4@learnerDashboard.com');
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToIncompleteCollectionsSection();
    learnerDashboardPage.expectTitleOfCollectionSummaryTileToMatch(
      'Test Collection');
    users.logout();
  });

  it('displays learners subscriptions', function() {
    users.createUser('learner1@learnerDashboard.com',
      'learner1learnerDashboard');
    var creator1Id = 'creatorName';
    users.createUser(creator1Id + '@learnerDashboard.com', creator1Id);
    var creator2Id = 'collectionAdm';
    users.createUser(creator2Id + '@learnerDashboard.com',
      creator2Id);
    users.login(creator1Id + '@learnerDashboard.com');
    workflow.createAndPublishExploration(
      'Activations',
      'Chemistry',
      'Learn about different types of chemistry activations.',
      'English'
    );
    users.logout();

    users.login('learner1@learnerDashboard.com');
    // Subscribe to both the creators.
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator2Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();

    // Completing exploration 'Activations' to activate /learner_dashboard
    libraryPage.get();
    libraryPage.findExploration('Activations');
    libraryPage.playExploration('Activations');
    explorationPlayerPage.expectExplorationNameToBe('Activations');
    explorationPlayerPage.rateExploration(4);

    // Both creators should be present in the subscriptions section of the
    // dashboard.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToSubscriptionsSection();
    // The last user (collectionAdm) that learner subsribes to is placed first
    // in the list.
    learnerDashboardPage.expectSubscriptionFirstNameToMatch('collect...');
    // The first user (creatorName) that learner subscribes to is placed
    // last in the list.
    learnerDashboardPage.expectSubscriptionLastNameToMatch('creator...');
    users.logout();
  });

  it('displays learner feedback threads', function() {
    users.createUser('learner2@learnerDashboard.com',
      'learner2learnerDashboard');
    users.createUser(
      'feedbackAdm@learnerDashboard.com', 'feedbackAdmlearnerDashboard');
    users.login('feedbackAdm@learnerDashboard.com');
    workflow.createAndPublishExploration(
      'BUS101',
      'Business',
      'Learn about different business regulations around the world.',
      'English'
    );
    users.logout();

    users.login('learner2@learnerDashboard.com');
    var feedback = 'A good exploration. Would love to see a few more questions';
    libraryPage.get();
    libraryPage.findExploration('BUS101');
    libraryPage.playExploration('BUS101');
    explorationPlayerPage.submitFeedback(feedback);

    // Verify feedback thread is created.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToFeedbackSection();
    learnerDashboardPage.expectFeedbackExplorationTitleToMatch('BUS101');
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
    users.createUser('creator1Id@subscriptions.com', 'creator1Idsubscriptions');
    users.createUser('creator2Id@subscriptions.com', 'creator2Idsubscriptions');

    // Create a learner who subscribes to both the creators.
    users.createUser('learner1@subscriptions.com', 'learner1subscriptions');
    users.login('learner1@subscriptions.com');
    subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creator1Idsubscriptions');
    subscriptionDashboardPage.navigateToSubscriptionButton();
    subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creator2Idsubscriptions');
    subscriptionDashboardPage.navigateToSubscriptionButton();
    preferencesPage.get();
    preferencesPage.expectDisplayedFirstSubscriptionToBe('creator...');
    preferencesPage.expectDisplayedLastSubscriptionToBe('creator...');
    users.logout();

    // Create a learner who subscribes to creator1Id and unsubscribes from the
    // creator2Id.
    users.createUser('learner2@subscriptions.com', 'learner2subscriptions');
    users.login('learner2@subscriptions.com');
    subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creator1Idsubscriptions');
    subscriptionDashboardPage.navigateToSubscriptionButton();
    subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creator2Idsubscriptions');

    // Subscribe and then unsubscribe from the same user.
    subscriptionDashboardPage.navigateToSubscriptionButton();
    subscriptionDashboardPage.navigateToSubscriptionButton();
    preferencesPage.get();
    preferencesPage.expectSubscriptionCountToEqual(1);
    preferencesPage.expectDisplayedFirstSubscriptionToBe('creator...');
    users.logout();

    // Verify there are 2 subscribers.
    users.login('creator1Id@subscriptions.com');
    // Need to go exploration editor to activate /creator_dashboard
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToSubscriptionDashboard();
    subscriptionDashboardPage.expectSubscriptionFirstNameToMatch('learner...');
    subscriptionDashboardPage.expectSubscriptionLastNameToMatch('learner...');
    users.logout();

    // Verify there are 1 subscriber.
    users.login('creator2Id@subscriptions.com');
    // Need to go exploration editor to activate /creator_dashboard
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToSubscriptionDashboard();
    subscriptionDashboardPage.expectSubscriptionCountToEqual(1);
    subscriptionDashboardPage.expectSubscriptionLastNameToMatch('learner...');
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
