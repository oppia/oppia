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
 * @fileoverview End-to-end tests for the learner flow.
 */

var action = require('../protractor_utils/action.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
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

describe('Learner dashboard functionality', function() {
  var adminPage = null;
  var creatorDashboardPage = null;
  var collectionEditorPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));
  var continueButton = element(by.css('.protractor-test-continue-button'));
  var clickContinueButton = async function() {
    await action.click('Continue button', continueButton);
    await waitFor.pageToFullyLoad();
  };

  var createDummyExplorationOnDesktopAsAdmin = async function(
      welcomeModalIsShown) {
    await creatorDashboardPage.get();
    await creatorDashboardPage.clickCreateActivityButton();
    await creatorDashboardPage.clickCreateExplorationButton();
    await waitFor.pageToFullyLoad();
    if (welcomeModalIsShown) {
      await explorationEditorMainTab.exitTutorial();
    }
    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'));
    await explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setDestination('Second', true, null);
    await explorationEditorMainTab.moveToState('Second');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'So what can I tell you?'));
    await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      await forms.toRichText('How do your explorations work?'),
      await forms.toRichText('What can you tell me about this website?'),
      await forms.toRichText('How can I contribute to Oppia?'),
      await forms.toRichText('Those were all the questions I had!')
    ]);
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', null, 'End Card', true, 'Equals',
      'Those were all the questions I had!');
    responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('I do not know!'));
    await explorationEditorMainTab.moveToState('End Card');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Congratulations, you have finished!'));
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('Dummy Exploration');
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();
  };

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    // The editor and player page objects are only required for desktop testing.
    if (!browser.isMobile) {
      collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
      creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
      explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
      explorationEditorMainTab = explorationEditorPage.getMainTab();
      explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
      explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    }
  });

  it('should visit the exploration player and play the correct exploration',
    async function() {
      await users.createAndLoginAdminUser(
        'expCreator@learnerDashboard.com', 'expCreator');
      // Create or load an exploration named 'Exploration Player Test'.
      if (browser.isMobile) {
        await adminPage.reloadExploration('exploration_player_test.yaml');
      } else {
        await workflow.createAndPublishExploration(
          'Exploration Player Test',
          'Astronomy',
          'To test the exploration player',
          'English',
          true
        );
      }
      await users.logout();
      var PLAYER_USERNAME = 'expPlayerDM';
      await users.createAndLoginUser(
        'expPlayerDesktopAndMobile@learnerFlow.com', PLAYER_USERNAME);
      await libraryPage.get();
      await libraryPage.findExploration('Exploration Player Test');
      await libraryPage.playExploration('Exploration Player Test');
    });

  it('should visit the collection player and play the correct collection',
    async function() {
      await users.createAndLoginAdminUser(
        'expOfCollectionCreator@learnerDashboard.com',
        'expOfCollectionCreator');
      // Create or load a collection named
      // 'Introduction to Collections in Oppia'.
      if (browser.isMobile) {
        await adminPage.reloadCollection(0);
      } else {
        await workflow.createAndPublishExploration(
          'Demo Exploration',
          'Algebra',
          'To test collection player',
          'English',
          true
        );
        // Update the role of the user to admin since only admin users
        // can create a collection.
        await adminPage.get();
        await adminPage.updateRole('expOfCollectionCreator', 'admin');
        await workflow.createCollectionAsAdmin();
        await collectionEditorPage.searchForAndAddExistingExploration(
          'Demo Exploration');
        await collectionEditorPage.saveDraft();
        await collectionEditorPage.closeSaveModal();
        await collectionEditorPage.publishCollection();
        await collectionEditorPage.setTitle(
          'Introduction to Collections in Oppia');
        await collectionEditorPage.setObjective(
          'This is a collection to test player.');
        await collectionEditorPage.setCategory('Algebra');
        await collectionEditorPage.saveChanges();
      }
      await users.logout();
      var PLAYER_USERNAME = 'collectionPlayerDM';
      await users.createAndLoginUser(
        'collectionPlayerDesktopAndMobile@learnerFlow.com', PLAYER_USERNAME);
      await libraryPage.get();
      await libraryPage.findCollection('Introduction to Collections in Oppia');
      await libraryPage.playCollection('Introduction to Collections in Oppia');
    });

  it('should display incomplete and completed explorations', async function() {
    await users.createAndLoginAdminUser(
      'originalCreator@learnerDashboard.com', 'originalCreator');
    // Create or load explorations.
    if (browser.isMobile) {
      await adminPage.reloadExploration('learner_flow_test.yaml');
      await adminPage.reloadExploration(
        'protractor_mobile_test_exploration.yaml');
    } else {
      // Create exploration 'Dummy Exploration'.
      await createDummyExplorationOnDesktopAsAdmin(true);
      // Create a second exploration named 'Test Exploration'.
      await workflow.createAndPublishExploration(
        'Test Exploration',
        'Astronomy',
        'To expand the horizon of the minds!',
        'English',
        false
      );
    }
    await users.logout();
    await users.createAndLoginUser(
      'learner@learnerDashboard.com', 'learnerlearnerDashboard');
    // Go to 'Dummy Exploration'.
    await libraryPage.get();
    await libraryPage.findExploration('Dummy Exploration');
    await libraryPage.playExploration('Dummy Exploration');
    await waitFor.pageToFullyLoad();
    // Leave this exploration incomplete.
    if (browser.isMobile) {
      await clickContinueButton();
    } else {
      // The exploration header is only visible in desktop browsers.
      await explorationPlayerPage.expectExplorationNameToBe(
        'Dummy Exploration');
      await explorationPlayerPage.submitAnswer('Continue', null);
      await explorationPlayerPage.expectExplorationToNotBeOver();
    }
    // User clicks on Oppia logo to leave exploration.
    await action.click('Oppia logo', oppiaLogo);
    await general.acceptAlert();

    // Go to 'Test Exploration'.
    await libraryPage.get();
    await libraryPage.findExploration('Test Exploration');
    await libraryPage.playExploration('Test Exploration');
    await waitFor.pageToFullyLoad();
    await action.click('Oppia logo', oppiaLogo);
    await waitFor.pageToFullyLoad();
    // Learner Dashboard should display 'Dummy Exploration'
    // as incomplete.
    await learnerDashboardPage.checkIncompleteExplorationSection(
      'Dummy Exploration');
    // Learner Dashboard should display 'Test Exploration'
    // exploration as complete.
    await learnerDashboardPage.checkCompleteExplorationSection(
      'Test Exploration');

    await libraryPage.get();
    await libraryPage.findExploration('Dummy Exploration');
    await libraryPage.playExploration('Dummy Exploration');
    await waitFor.pageToFullyLoad();
    // Now complete the 'Dummmy Exploration'.
    if (browser.isMobile) {
      await clickContinueButton();
      // Navigate to the second page.
      await clickContinueButton();
    } else {
      await explorationPlayerPage.expectExplorationNameToBe(
        'Dummy Exploration');
      await explorationPlayerPage.submitAnswer('Continue', null);
      await explorationPlayerPage.submitAnswer(
        'MultipleChoiceInput', 'Those were all the questions I had!');
    }
    // Both should be added to the completed section.
    await learnerDashboardPage.get();
    await learnerDashboardPage.checkCompleteExplorationSection(
      'Dummy Exploration');
    await learnerDashboardPage.checkCompleteExplorationSection(
      'Test Exploration');
    await users.logout();

    // For desktop, go to the exploration editor page and
    // delete 'Dummy Exploration'.
    if (!browser.isMobile) {
      // Login as Admin and delete exploration 'Dummy Exploration'.
      await users.createAndLoginAdminUser(
        'inspector@learnerDashboard.com', 'inspector');
      await libraryPage.get();
      await libraryPage.findExploration('Dummy Exploration');
      await libraryPage.playExploration('Dummy Exploration');
      // Wait for player page to completely load.
      await waitFor.pageToFullyLoad();
      var explorationId = await general.getExplorationIdFromPlayer();
      await general.openEditor(explorationId, true);
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.deleteExploration();
      await users.logout();

      // Verify exploration 'Dummy Exploration' is deleted
      // from learner dashboard.
      await users.login('learner@learnerDashboard.com');
      await learnerDashboardPage.get();
      await learnerDashboardPage.navigateToCompletedSection();
      await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
        'Test Exploration');
      await learnerDashboardPage.expectTitleOfExplorationSummaryTileToBeHidden(
        'Dummy Exploration');
    }
  });

  it('should display incomplete and completed collections', async function() {
    await users.createAndLoginAdminUser(
      'explorationCreator@learnerDashboard.com', 'explorationCreator');
    // Create or load a collection.
    if (browser.isMobile) {
      await adminPage.reloadCollection(1);
    } else {
      // Create first exploration named 'Dummy Exploration'.
      await createDummyExplorationOnDesktopAsAdmin(true);
      // Create a second exploration named 'Collection Exploration'.
      await workflow.createAndPublishExploration(
        'Collection Exploration',
        'Architect',
        'To be a part of a collection!',
        'English',
        false
      );
      // Update the role of the user to admin since only admin users
      // can create a collection.
      await adminPage.get();
      await adminPage.updateRole('explorationCreator', 'admin');
      // Create new 'Test Collection' containing
      // exploration 'Dummy Exploration'.
      await workflow.createCollectionAsAdmin();
      await collectionEditorPage.searchForAndAddExistingExploration(
        'Dummy Exploration');
      await collectionEditorPage.saveDraft();
      await collectionEditorPage.closeSaveModal();
      await collectionEditorPage.publishCollection();
      await collectionEditorPage.setTitle('Test Collection');
      await collectionEditorPage.setObjective('This is a test collection.');
      await collectionEditorPage.setCategory('Algebra');
      await collectionEditorPage.saveChanges();
    }
    await users.logout();
    await users.createAndLoginUser(
      'learner4@learnerDashboard.com', 'learner4learnerDashboard');

    // Go to 'Test Collection' and play it.
    await libraryPage.get();
    await libraryPage.findCollection('Test Collection');
    await libraryPage.playCollection('Test Collection');
    await waitFor.pageToFullyLoad();
    // The collection player has two sets of SVGs -- one which is
    // rendered for desktop and the other which is rendered for mobile.
    var firstExploration = browser.isMobile ? await element.all(
      by.css('.protractor-mobile-test-collection-exploration')).first() :
      await element.all(
        by.css('.protractor-test-collection-exploration')).first();
    // Click first exploration in collection.
    await action.click('First exploration', firstExploration);
    await waitFor.pageToFullyLoad();
    // Leave this collection incomplete.
    if (browser.isMobile) {
      // In mobile, 'Play Exploration' button also needs to be clicked
      // to begin an exploration which is a part of a collection.
      var playExploration = element(
        by.css('.protractor-test-play-exploration-button'));
      await action.click('Play exploration', playExploration);
      await waitFor.pageToFullyLoad();
      await clickContinueButton();
    } else {
      await explorationPlayerPage.submitAnswer('Continue', null);
      await explorationPlayerPage.expectExplorationToNotBeOver();
    }
    // User clicks on Oppia logo to leave collection.
    await action.click('Oppia logo', oppiaLogo);
    await general.acceptAlert();

    // Learner Dashboard should display
    // 'Test Collection' as incomplete.
    await learnerDashboardPage.checkIncompleteCollectionSection(
      'Test Collection');
    // Now find and play 'Test Collection' completely.
    await libraryPage.get();
    await libraryPage.findCollection('Test Collection');
    await libraryPage.playCollection('Test Collection');
    await waitFor.pageToFullyLoad();
    // The collection player has two sets of SVGs -- one which is
    // rendered for desktop and the other which is rendered for mobile.
    var firstExploration = browser.isMobile ? await element.all(
      by.css('.protractor-mobile-test-collection-exploration')).first() :
      await element.all(
        by.css('.protractor-test-collection-exploration')).first();
    // Click first exploration in collection.
    await action.click('First exploration', firstExploration);
    await waitFor.pageToFullyLoad();
    if (browser.isMobile) {
      var playExploration = element(
        by.css('.protractor-test-play-exploration-button'));
      await action.click('Play exploration', playExploration);
      await waitFor.pageToFullyLoad();
      await clickContinueButton();
      await waitFor.pageToFullyLoad();
      await clickContinueButton();
      await waitFor.pageToFullyLoad();
    } else {
      await explorationPlayerPage.expectExplorationNameToBe(
        'Dummy Exploration');
      await explorationPlayerPage.submitAnswer('Continue', null);
      await explorationPlayerPage.submitAnswer(
        'MultipleChoiceInput', 'Those were all the questions I had!');
    }
    // Learner Dashboard should display
    // 'Test Collection' as complete.
    await learnerDashboardPage.get();
    await learnerDashboardPage.checkCompleteCollectionSection(
      'Test Collection');
    await users.logout();

    // This part of the test is desktop-only for the following reasons:
    // 1. A user can only add an existing exploration to a collection it has
    //    created. For desktop tests, a user creates a collection and later on,
    //    it adds an existing exploration to the same collection. In case of
    //    mobile tests, a predefined collection is loaded and is not created by
    //    the user. Therefore, it cannot add an existing exploration to the
    //    predefined collection.
    // 2. This part involves the collection editor page, which has certain
    //    components that are not mobile-friendly.
    // 3. Creating and later on, editing a collection involves an admin user and
    //    not a super admin. For mobile tests, we sign-in as a super admin.
    // 4. The feature of adding an existing exploration to a collection using
    //    the collection editor page is in beta presently.
    if (!browser.isMobile) {
      // Add exploration 'Collection Exploration' to 'Test Collection'
      // and publish it.
      await users.login('explorationCreator@learnerDashboard.com');
      await creatorDashboardPage.get();
      await waitFor.pageToFullyLoad();
      // Click on 'Collections' tab.
      var collectionsTab = element(by.css('.protractor-test-collections-tab'));
      await action.click('Collections tab', collectionsTab);
      await creatorDashboardPage.navigateToCollectionEditor();
      await collectionEditorPage.searchForAndAddExistingExploration(
        'Collection Exploration');
      await collectionEditorPage.saveDraft();
      await collectionEditorPage.setCommitMessage('Add Collection Exploration');
      await collectionEditorPage.closeSaveModal();
      await users.logout();

      // Verify 'Test Collection' is now in the incomplete section.
      await users.login('learner4@learnerDashboard.com');
      await learnerDashboardPage.get();
      await learnerDashboardPage.checkIncompleteCollectionSection(
        'Test Collection');
    }
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
