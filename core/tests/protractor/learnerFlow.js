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
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));
  var continueButton = element(by.css('.protractor-test-continue-button'));
  var clickContinueButton = function() {
    waitFor.elementToBeClickable(
      continueButton, 'Could not click continue button');
    continueButton.click();
    waitFor.pageToFullyLoad();
  };

  var createDummyExplorationOnDesktop = function() {
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    waitFor.pageToFullyLoad();
    explorationEditorMainTab.exitTutorial();
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
    explorationEditorSettingsTab.setTitle('Dummy Exploration');
    explorationEditorSettingsTab.setCategory('Algorithm');
    explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    explorationEditorSettingsTab.setLanguage('English');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();
  };

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();

    if (browser.isMobile) {
      var ADM_VISITOR = 'admVisitor';
      users.createAndLoginAdminUserMobile(
        'admVisitor@learner.com', ADM_VISITOR);
      // Load /explore/22
      adminPage.reloadExploration('protractor_mobile_test_exploration.yaml');
      // Load /explore/24
      adminPage.reloadExploration('learner_flow_test.yaml');
      // Load /explore/25
      adminPage.reloadExploration('exploration_player_test.yaml');
      // Load /collection/0
      adminPage.reloadCollection(0);
      // Load /collection/1
      adminPage.reloadCollection(1);
      users.logout();
    } else {
      collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
      creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
      explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
      explorationEditorMainTab = explorationEditorPage.getMainTab();
      explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
      explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    }
  });

  it('visits the exploration player and plays the correct exploration',
    function() {
      if (!browser.isMobile) {
        users.createAndLoginUser('expCreator@learnerDashboard.com',
          'expCreator');
        // Create an exploration named 'Exploration Player Test'.
        workflow.createAndPublishExploration(
          'Exploration Player Test',
          'Astronomy',
          'To test the exploration player',
          'English'
        );
        users.logout();
      }
      var PLAYER_USERNAME = 'expPlayerDesktopAndMobile';
      users.createAndLoginUser(
        'expPlayerDesktopAndMobile@learnerFlow.com', PLAYER_USERNAME);
      libraryPage.get();
      libraryPage.findExploration('Exploration Player Test');
      libraryPage.playExploration('Exploration Player Test');
    });

  it('visits the collection player and plays the correct collection',
    function() {
      if (!browser.isMobile) {
        users.createAndLoginUser('expOfCollectionCreator@learnerDashboard.com',
          'expOfCollectionCreator');
        workflow.createAndPublishExploration(
          'Demo Exploration',
          'Algebra',
          'To test collection player',
          'English'
        );
        users.logout();

        // Login to admin account
        users.createAndLoginAdminUser(
          'collectionPlayerTestAdm@learnerDashboard.com',
          'collectionPlayerTestAdm');
        workflow.createCollectionAsAdmin();
        collectionEditorPage.searchForAndAddExistingExploration(
          'Demo Exploration');
        collectionEditorPage.saveDraft();
        collectionEditorPage.closeSaveModal();
        collectionEditorPage.publishCollection();
        collectionEditorPage.setTitle('Introduction to Collections in Oppia');
        collectionEditorPage.setObjective(
          'This is a collection to test player.');
        collectionEditorPage.setCategory('Algebra');
        collectionEditorPage.saveChanges();
        users.logout();
      }
      var PLAYER_USERNAME = 'collectionPlayerDesktopAndMobile';
      users.createAndLoginUser(
        'collectionPlayerDesktopAndMobile@learnerFlow.com', PLAYER_USERNAME);
      libraryPage.get();
      libraryPage.findCollection('Introduction to Collections in Oppia');
      libraryPage.playCollection('Introduction to Collections in Oppia');
    });

  it('displays incomplete and completed explorations', function() {
    // Create explorations for desktop testing.
    if (!browser.isMobile) {
      users.createAndLoginUser('originalCreator@learnerDashboard.com',
        'originalCreator');
      // Create exploration 'Dummy Exploration'
      createDummyExplorationOnDesktop();
      // Create a second exploration named 'Test Exploration'.
      workflow.createAndPublishExploration(
        'Test Exploration',
        'Astronomy',
        'To expand the horizon of the minds!',
        'English'
      );
      users.logout();
    }
    users.createAndLoginUser('learner@learnerDashboard.com',
      'learnerlearnerDashboard');
    // Go to 'Dummy Exploration'.
    libraryPage.get();
    libraryPage.findExploration('Dummy Exploration');
    libraryPage.playExploration('Dummy Exploration');
    waitFor.pageToFullyLoad();
    // Leave this exploration incomplete.
    if (browser.isMobile) {
      clickContinueButton();
    } else {
      // The exploration header is only visible in desktop browsers.
      explorationPlayerPage.expectExplorationNameToBe('Dummy Exploration');
      explorationPlayerPage.submitAnswer('Continue', null);
      explorationPlayerPage.expectExplorationToNotBeOver();
    }
    // User clicks on Oppia logo to leave exploration.
    oppiaLogo.click();
    general.acceptAlert();
    // Wait for /learner_dashboard to load.
    waitFor.pageToFullyLoad();

    // Go to 'Test Exploration'.
    libraryPage.get();
    libraryPage.findExploration('Test Exploration');
    libraryPage.playExploration('Test Exploration');
    waitFor.pageToFullyLoad();
    oppiaLogo.click();
    waitFor.pageToFullyLoad();
    // Learner Dashboard should display 'Dummy Exploration'
    // as incomplete.
    learnerDashboardPage.checkIncompleteExplorationSection('Dummy Exploration');
    // Learner Dashboard should display 'Test Exploration'
    // exploration as complete.
    learnerDashboardPage.checkCompleteExplorationSection('Test Exploration');

    libraryPage.get();
    libraryPage.findExploration('Dummy Exploration');
    libraryPage.playExploration('Dummy Exploration');
    waitFor.pageToFullyLoad();
    // Now complete the 'Dummmy Exploration'.
    if (browser.isMobile) {
      clickContinueButton();
      // Navigate to the second page.
      clickContinueButton();
    } else {
      explorationPlayerPage.expectExplorationNameToBe('Dummy Exploration');
      explorationPlayerPage.submitAnswer('Continue', null);
      explorationPlayerPage.submitAnswer(
        'MultipleChoiceInput', 'Those were all the questions I had!');
    }
    // Both should be added to the completed section.
    learnerDashboardPage.get();
    learnerDashboardPage.checkCompleteExplorationSection('Dummy Exploration');
    learnerDashboardPage.checkCompleteExplorationSection('Test Exploration');
    users.logout();

    // For desktop, go to the exploration editor page and
    // delete 'Dummy Exploration'.
    if (!browser.isMobile) {
      // Login as Admin and delete exploration 'Dummy Exploration'.
      users.createAndLoginAdminUser('inspector@learnerDashboard.com',
        'inspector');
      libraryPage.get();
      libraryPage.findExploration('Dummy Exploration');
      libraryPage.playExploration('Dummy Exploration');
      // Wait for player page to completely load
      waitFor.pageToFullyLoad();
      general.getExplorationIdFromPlayer().then(function(explorationId) {
        general.openEditor(explorationId);
      });
      explorationEditorPage.navigateToSettingsTab();
      explorationEditorSettingsTab.deleteExploration();
      users.logout();

      // Verify exploration 'Dummy Exploration' is deleted
      // from learner dashboard.
      users.login('learner@learnerDashboard.com');
      learnerDashboardPage.get();
      learnerDashboardPage.navigateToCompletedSection();
      learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
        'Test Exploration');
      learnerDashboardPage.expectTitleOfExplorationSummaryTileToBeHidden(
        'Dummy Exploration');
    }
  });

  it('displays incomplete and completed collections', function() {
    // Create a collection for desktop testing.
    if (!browser.isMobile) {
      users.createAndLoginUser('explorationCreator@learnerDashboard.com',
        'explorationCreator');
      // Create first exploration named 'Dummy Exploration'.
      createDummyExplorationOnDesktop();
      // Create a second exploration named 'Collection Exploration'.
      workflow.createAndPublishExploration(
        'Collection Exploration',
        'Architect',
        'To be a part of a collection!',
        'English'
      );
      users.logout();

      // Login to admin account
      users.createAndLoginAdminUser(
        'testCollectionAdm@learnerDashboard.com',
        'testcollectionAdmlearnerDashboard');
      // Create new 'Test Collection' containing
      // exploration 'Dummy Exploration'.
      workflow.createCollectionAsAdmin();
      collectionEditorPage.searchForAndAddExistingExploration(
        'Dummy Exploration');
      collectionEditorPage.saveDraft();
      collectionEditorPage.closeSaveModal();
      collectionEditorPage.publishCollection();
      collectionEditorPage.setTitle('Test Collection');
      collectionEditorPage.setObjective('This is a test collection.');
      collectionEditorPage.setCategory('Algebra');
      collectionEditorPage.saveChanges();
      users.logout();
    }
    users.createAndLoginUser(
      'learner4@learnerDashboard.com', 'learner4learnerDashboard');

    // Go to 'Test Collection' and play it.
    libraryPage.get();
    libraryPage.findCollection('Test Collection');
    libraryPage.playCollection('Test Collection');
    waitFor.pageToFullyLoad();
    // Click on the first exploration of the collection.
    var firstExploration = element.all(
      by.css('.protractor-test-collection-exploration')).first();
    // Click first exploration in collection.
    waitFor.elementToBeClickable(
      firstExploration, 'Could not click first exploration in collection');
    firstExploration.click();
    waitFor.pageToFullyLoad();
    // Leave this collection incomplete.
    if (browser.isMobile) {
      // In mobile, 'Play Exploration' button also needs to be clicked
      // to begin an exploration which is a part of a collection.
      var playExploration = element(
        by.css('.protractor-test-play-exploration-button'));
      waitFor.elementToBeClickable(
        playExploration, 'Could not click play exploration button');
      playExploration.click();
      waitFor.pageToFullyLoad();
      clickContinueButton();
    } else {
      explorationPlayerPage.submitAnswer('Continue', null);
      explorationPlayerPage.expectExplorationToNotBeOver();
    }
    // User clicks on Oppia logo to leave collection.
    oppiaLogo.click();
    general.acceptAlert();
    // Wait for /learner_dashboard to load.
    waitFor.pageToFullyLoad();

    // Learner Dashboard should display
    // 'Test Collection' as incomplete.
    learnerDashboardPage.checkIncompleteCollectionSection('Test Collection');
    // Now find and play 'Test Collection' completely.
    libraryPage.get();
    libraryPage.findCollection('Test Collection');
    libraryPage.playCollection('Test Collection');
    waitFor.pageToFullyLoad();
    var firstExploration = element.all(
      by.css('.protractor-test-collection-exploration')).first();
      // Click first exploration in collection.
    waitFor.elementToBeClickable(
      firstExploration, 'Could not click first exploration in collection');
    firstExploration.click();
    waitFor.pageToFullyLoad();
    if (browser.isMobile) {
      var playExploration = element(
        by.css('.protractor-test-play-exploration-button'));
      waitFor.elementToBeClickable(
        playExploration, 'Could not click play exploration button');
      playExploration.click();
      waitFor.pageToFullyLoad();
      clickContinueButton();
      waitFor.pageToFullyLoad();
      clickContinueButton();
      waitFor.pageToFullyLoad();
    } else {
      explorationPlayerPage.expectExplorationNameToBe('Dummy Exploration');
      explorationPlayerPage.submitAnswer('Continue', null);
      explorationPlayerPage.submitAnswer(
        'MultipleChoiceInput', 'Those were all the questions I had!');
    }
    // Learner Dashboard should display
    // 'Test Collection' as complete.
    learnerDashboardPage.get();
    learnerDashboardPage.checkCompleteCollectionSection('Test Collection');
    users.logout();

    // For desktop, create another exploration and add it to
    // 'Test Collection'.
    if (!browser.isMobile) {
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
      learnerDashboardPage.checkIncompleteCollectionSection('Test Collection');
    }
  });

  afterEach(function() {
    if (browser.isMobile) {
      general.checkForConsoleErrors([
        // TODO(apb7): Remove these when https://github.com/oppia/oppia/issues/5363 is resolved.
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Exploration Player Test"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Introduction to Collections in Oppia"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Dummy Exploration"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Test Exploration"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Dummy Exploration"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Test Collection"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: Test Collection"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "'
      ]);
    } else {
      general.checkForConsoleErrors([]);
    }
    users.logout();
  });
});
