// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for collections.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');


describe('Collections', function() {
  var adminPage = null;
  var creatorDashboardPage = null;
  var collectionEditorPage = null;
  var collectionId = null;
  var firstExplorationId = null;
  var secondExplorationId = null;
  var thirdExplorationId = null;
  var fourthExplorationId = null;
  var libraryPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    libraryPage = new LibraryPage.LibraryPage();
    var EDITOR_USERNAME = 'aliceCollections';
    var PLAYER_USERNAME = 'playerCollections';
    var CREATOR_USERNAME = 'creatorExplorations';
    await users.createUser('creator@explorations.com', CREATOR_USERNAME);
    await users.createUser('player@collections.com', PLAYER_USERNAME);
    await users.createUser('alice@collections.com', EDITOR_USERNAME);
    await users.createAndLoginAdminUser('testadm@collections.com', 'testadm');
    await adminPage.get();
    await adminPage.updateRole(EDITOR_USERNAME, 'collection editor');
    await adminPage.updateRole(PLAYER_USERNAME, 'collection editor');
    await users.logout();

    await users.login('creator@explorations.com');
    // Create four test explorations.
    await workflow.createAndPublishExploration(
      'First Exploration',
      'Languages',
      'First Test Exploration.',
      'English',
      true
    );
    firstExplorationId = await general.getExplorationIdFromEditor();
    await workflow.createAndPublishExploration(
      'Second Exploration',
      'Languages',
      'Second Test Exploration.',
      'English',
      false
    );
    secondExplorationId = await general.getExplorationIdFromEditor();
    await workflow.createAndPublishExploration(
      'Third Exploration',
      'Languages',
      'Third Test Exploration.',
      'English',
      false
    );
    thirdExplorationId = await general.getExplorationIdFromEditor();
    await workflow.createAndPublishExploration(
      'Fourth Exploration',
      'Languages',
      'Fourth Test Exploration.',
      'English',
      false
    );
    fourthExplorationId = await general.getExplorationIdFromEditor();
    // Create searchable explorations.
    await workflow.createAndPublishExploration(
      'The Lazy Magician for CollectionSuiteTest',
      'Algorithms',
      'discover the binary search algorithm',
      'English',
      false
    );
    await workflow.createAndPublishExploration(
      'Root Linear Coefficient Theorem for CollectionSuiteTest',
      'Algebra',
      'discover the Root Linear Coefficient Theorem',
      'English',
      false
    );
    await workflow.createAndPublishExploration(
      'Test Exploration for CollectionSuiteTest',
      'Languages',
      'discover the Protractor Testing',
      'English',
      false
    );
    await users.logout();
    await users.login('player@collections.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.clickCreateActivityButton();
    await creatorDashboardPage.clickCreateCollectionButton();
    // Add existing explorations.
    await collectionEditorPage.addExistingExploration(firstExplorationId);
    await collectionEditorPage.saveDraft();
    await collectionEditorPage.closeSaveModal();
    await collectionEditorPage.publishCollection();
    await collectionEditorPage.setTitle('Test Collection 2');
    await collectionEditorPage.setObjective(
      'This is the second test collection.');
    await collectionEditorPage.setCategory('Algebra');
    await collectionEditorPage.saveChanges();
    var url = await browser.getCurrentUrl();
    var pathname = url.split('/');
    // In the url a # is added at the end that is not part of collection ID.
    collectionId = pathname[5].slice(0, -1);
    await users.logout();
  });

  it('should visit the collection editor', async function() {
    await users.login('alice@collections.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.clickCreateActivityButton();
    await creatorDashboardPage.clickCreateCollectionButton();
    // Add existing explorations.
    await collectionEditorPage.addExistingExploration(firstExplorationId);
    await collectionEditorPage.addExistingExploration(secondExplorationId);
    await collectionEditorPage.addExistingExploration(thirdExplorationId);
    // Search and add existing explorations.
    await collectionEditorPage.searchForAndAddExistingExploration('Lazy');
    await collectionEditorPage.searchForAndAddExistingExploration('Linear');
    await collectionEditorPage.searchForAndAddExistingExploration('Test');
    // Shifting nodes in the node graph.
    await collectionEditorPage.shiftNodeLeft(1);
    await collectionEditorPage.shiftNodeRight(1);
    // Delete node in the node graph.
    await collectionEditorPage.deleteNode(1);
    // Publish the collection.
    await collectionEditorPage.saveDraft();
    await collectionEditorPage.closeSaveModal();
    await collectionEditorPage.publishCollection();
    await collectionEditorPage.setTitle('Test Collection');
    await collectionEditorPage.setObjective('This is a test collection.');
    await collectionEditorPage.setCategory('Algebra');
    await collectionEditorPage.saveChanges();
    await users.logout();
  });

  it('should visit the collection player', async function() {
    await users.login('alice@collections.com');
    await libraryPage.get();
    await libraryPage.findCollection('Test Collection');
    await libraryPage.playCollection('Test Collection');
    await users.logout();
  });

  it('should check for errors in a collection with varying node count',
    async function() {
    // Checking in a collection with one node.
      await users.login('player@collections.com');
      await browser.get('/collection/' + collectionId);
      await waitFor.pageToFullyLoad();
      await general.checkForConsoleErrors([]);

      // Checking in a collection with two nodes.
      await browser.get('/collection_editor/create/' + collectionId);
      await waitFor.pageToFullyLoad();
      await collectionEditorPage.addExistingExploration(secondExplorationId);
      await collectionEditorPage.saveDraft();
      await collectionEditorPage.setCommitMessage('Add Exploration');
      await collectionEditorPage.closeSaveModal();
      await browser.get('/collection/' + collectionId);
      await waitFor.pageToFullyLoad();
      await general.checkForConsoleErrors([]);

      // Checking in a collection with three nodes.
      await browser.get('/collection_editor/create/' + collectionId);
      await waitFor.pageToFullyLoad();
      await collectionEditorPage.addExistingExploration(thirdExplorationId);
      await collectionEditorPage.saveDraft();
      await collectionEditorPage.setCommitMessage('Add Exploration');
      await collectionEditorPage.closeSaveModal();
      await browser.get('/collection/' + collectionId);
      await waitFor.pageToFullyLoad();
      await general.checkForConsoleErrors([]);

      // Checking in a collection with four nodes.
      await browser.get('/collection_editor/create/' + collectionId);
      await waitFor.pageToFullyLoad();
      await collectionEditorPage.addExistingExploration(fourthExplorationId);
      await collectionEditorPage.saveDraft();
      await collectionEditorPage.setCommitMessage('Add Exploration');
      await collectionEditorPage.closeSaveModal();
      await browser.get('/collection/' + collectionId);
      await waitFor.pageToFullyLoad();
      await general.checkForConsoleErrors([]);
      await users.logout();
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
