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
    adminPage.get();
    adminPage.updateRole(EDITOR_USERNAME, 'collection editor');
    adminPage.updateRole(PLAYER_USERNAME, 'collection editor');
    await users.logout();

    await users.login('creator@explorations.com');
    // Create four test explorations.
    workflow.createAndPublishExploration(
      'First Exploration',
      'Languages',
      'First Test Exploration.'
    );
    firstExplorationId = await general.getExplorationIdFromEditor();

    workflow.createAndPublishExploration(
      'Second Exploration',
      'Languages',
      'Second Test Exploration.'
    );
    secondExplorationId = await general.getExplorationIdFromEditor();

    workflow.createAndPublishExploration(
      'Third Exploration',
      'Languages',
      'Third Test Exploration.'
    );
    thirdExplorationId = await general.getExplorationIdFromEditor();

    workflow.createAndPublishExploration(
      'Fourth Exploration',
      'Languages',
      'Fourth Test Exploration.'
    );
    fourthExplorationId = await general.getExplorationIdFromEditor();
    // Create searchable explorations.
    workflow.createAndPublishExploration(
      'The Lazy Magician',
      'Algorithms',
      'discover the binary search algorithm'
    );
    workflow.createAndPublishExploration(
      'Root Linear Coefficient Theorem',
      'Algebra',
      'discover the Root Linear Coefficient Theorem'
    );
    workflow.createAndPublishExploration(
      'Test Exploration',
      'Languages',
      'discover the Protractor Testing'
    );
    await users.logout();

    await users.login('player@collections.com');
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateCollectionButton();
    var url = await browser.getCurrentUrl();
    var pathname = url.split('/');
    // In the url a # is added at the end that is not part of collection ID.
    collectionId = pathname[5].slice(0, -1);
    // Add existing explorations.
    collectionEditorPage.addExistingExploration(firstExplorationId);
    collectionEditorPage.saveDraft();
    collectionEditorPage.closeSaveModal();
    collectionEditorPage.publishCollection();
    collectionEditorPage.setTitle('Test Collection 2');
    collectionEditorPage.setObjective('This is the second test collection.');
    collectionEditorPage.setCategory('Algebra');
    collectionEditorPage.saveChanges();
    await users.logout();
  });

  it('visits the collection editor', async function() {
    await users.login('alice@collections.com');
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateCollectionButton();
    // Add existing explorations.
    collectionEditorPage.addExistingExploration(firstExplorationId);
    collectionEditorPage.addExistingExploration(secondExplorationId);
    collectionEditorPage.addExistingExploration(thirdExplorationId);
    // Search and add existing explorations.
    collectionEditorPage.searchForAndAddExistingExploration('Lazy');
    collectionEditorPage.searchForAndAddExistingExploration('Linear');
    collectionEditorPage.searchForAndAddExistingExploration('Testing');
    // Shifting nodes in the node graph.
    collectionEditorPage.shiftNodeLeft(1);
    collectionEditorPage.shiftNodeRight(1);
    // Delete node in the node graph.
    collectionEditorPage.deleteNode(1);
    // Publish the collection.
    collectionEditorPage.saveDraft();
    collectionEditorPage.closeSaveModal();
    collectionEditorPage.publishCollection();
    collectionEditorPage.setTitle('Test Collection');
    collectionEditorPage.setObjective('This is a test collection.');
    collectionEditorPage.setCategory('Algebra');
    collectionEditorPage.saveChanges();
    await users.logout();
  });

  it('visits the collection player', async function() {
    await users.login('alice@collections.com');
    libraryPage.get();
    libraryPage.findCollection('Test Collection');
    libraryPage.playCollection('Test Collection');
    await users.logout();
  });

  it('checks for errors in a collection with varying node count',
    async function() {
    // Checking in a collection with one node.
      await users.login('player@collections.com');
      await browser.get('/collection/' + collectionId);
      waitFor.pageToFullyLoad();
      general.checkForConsoleErrors([]);

      // Checking in a collection with two nodes.
      await browser.get('/collection_editor/create/' + collectionId);
      waitFor.pageToFullyLoad();
      collectionEditorPage.addExistingExploration(secondExplorationId);
      collectionEditorPage.saveDraft();
      collectionEditorPage.setCommitMessage('Add Exploration');
      collectionEditorPage.closeSaveModal();
      await browser.get('/collection/' + collectionId);
      waitFor.pageToFullyLoad();
      general.checkForConsoleErrors([]);

      // Checking in a collection with three nodes.
      await browser.get('/collection_editor/create/' + collectionId);
      waitFor.pageToFullyLoad();
      collectionEditorPage.addExistingExploration(thirdExplorationId);
      collectionEditorPage.saveDraft();
      collectionEditorPage.setCommitMessage('Add Exploration');
      collectionEditorPage.closeSaveModal();
      await browser.get('/collection/' + collectionId);
      waitFor.pageToFullyLoad();
      general.checkForConsoleErrors([]);

      // Checking in a collection with four nodes.
      await browser.get('/collection_editor/create/' + collectionId);
      waitFor.pageToFullyLoad();
      collectionEditorPage.addExistingExploration(fourthExplorationId);
      collectionEditorPage.saveDraft();
      collectionEditorPage.setCommitMessage('Add Exploration');
      collectionEditorPage.closeSaveModal();
      await browser.get('/collection/' + collectionId);
      waitFor.pageToFullyLoad();
      general.checkForConsoleErrors([]);
      await users.logout();
    });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
