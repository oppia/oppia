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
var AdminPage = require('../protractor_utils/AdminPage.js');
var CollectionEditorPage = 
  require('../protractor_utils/CollectionEditorPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');



describe('Collections', function() {
  var adminPage = null;
  var collectionEditorPage = null;
  var creatorDashboardPage = null;
  var collectionId = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    var EDITOR_USERNAME = 'aliceCollections';
    var PLAYER_USERNAME = 'playerCollections';
    users.createUser('player@collections.com', PLAYER_USERNAME);
    users.createUser('alice@collections.com', EDITOR_USERNAME);
    users.createAndLoginAdminUser('testadm@collections.com', 'testadm');
    adminPage.get();
    adminPage.reloadCollection();
    general.acceptAlert();
    browser.waitForAngular();
    adminPage.reloadAllExplorations();
    adminPage.updateRole(EDITOR_USERNAME, 'collection editor');
    adminPage.updateRole(PLAYER_USERNAME, 'collection editor');
    users.logout();

    users.login('player@collections.com');
    browser.get(general.SERVER_URL_PREFIX);
    var dropdown = element(by.css('.protractor-test-profile-dropdown'));
    browser.actions().mouseMove(dropdown).perform();
    dropdown.element(by.css('.protractor-test-dashboard-link')).click();
    browser.waitForAngular();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateCollectionButton();
    browser.getCurrentUrl().then(function(url) {
      var pathname = url.split('/');
      //in the url a # is added at the end that is not part of collection ID
      collectionId = pathname[5].slice(0, -1);
    });
    browser.waitForAngular();
    // Add existing explorations.
    CollectionEditorPage.addExistingExploration('0');
    CollectionEditorPage.saveDraft();
    CollectionEditorPage.closeSaveModal();
    CollectionEditorPage.publishCollection();
    CollectionEditorPage.setTitle('Test Collection 2');
    CollectionEditorPage.setObjective('This is the second test collection.');
    CollectionEditorPage.setCategory('Algebra');
    CollectionEditorPage.saveChanges();
    browser.waitForAngular();
    users.logout();
  });

  it('visits the collection editor', function() {
    users.login('alice@collections.com');
    browser.get(general.SERVER_URL_PREFIX);
    var dropdown = element(by.css('.protractor-test-profile-dropdown'));
    browser.actions().mouseMove(dropdown).perform();
    dropdown.element(by.css('.protractor-test-dashboard-link')).click();
    browser.waitForAngular();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateCollectionButton();
    browser.waitForAngular();
    // Add existing explorations.
    collectionEditorPage.addExistingExploration('0');
    collectionEditorPage.addExistingExploration('4');
    collectionEditorPage.addExistingExploration('13');
    // Search and add existing explorations.
    collectionEditorPage.searchForAndAddExistingExploration('Lazy');
    collectionEditorPage.searchForAndAddExistingExploration('Linear');
    collectionEditorPage.searchForAndAddExistingExploration('The');
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
    browser.waitForAngular();
    users.logout();
  });

  it('visits the collection player', function() {
    users.login('alice@collections.com');
    browser.get('/collection/0');
    browser.waitForAngular();
    users.logout();
  });

  it('checks for errors in a collection with varying node count', function() {
    //Checking in a collection with one node
    users.login('player@collections.com');
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    general.checkForConsoleErrors([]);

    //Checking in a collection with two nodes
    browser.get('/collection_editor/create/' + collectionId);
    browser.waitForAngular();
    CollectionEditorPage.addExistingExploration('4');
    CollectionEditorPage.saveDraft();
    CollectionEditorPage.setCommitMessage('Add Exploration');
    CollectionEditorPage.closeSaveModal();
    browser.waitForAngular();
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    general.checkForConsoleErrors([]);

    //Checking in a collection with three nodes
    browser.get('/collection_editor/create/' + collectionId);
    browser.waitForAngular();
    CollectionEditorPage.addExistingExploration('13');
    CollectionEditorPage.saveDraft();
    CollectionEditorPage.setCommitMessage('Add Exploration');
    CollectionEditorPage.closeSaveModal();
    browser.waitForAngular();
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    general.checkForConsoleErrors([]);

    //Checking in a collection with four nodes
    browser.get('/collection_editor/create/' + collectionId);
    browser.waitForAngular();
    CollectionEditorPage.addExistingExploration('10');
    CollectionEditorPage.saveDraft();
    CollectionEditorPage.setCommitMessage('Add Exploration');
    CollectionEditorPage.closeSaveModal();
    browser.waitForAngular();
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    general.checkForConsoleErrors([]);
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
