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
var collectionEditor = require('../protractor_utils/collectionEditor.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');


describe('Collections', function() {
  var adminPage = null;
  var creatorDashboardPage = null;
  var COLLECTION_ID = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    var USERNAME = 'aliceCollections';
    var USERNAME_TWO = 'playerCollections';
    users.createUser('player@collections.com', USERNAME_TWO);
    users.createUser('alice@collections.com', USERNAME);
    users.createAndLoginAdminUser('testadm@collections.com', 'testadm');
    adminPage.get();
    adminPage.reloadCollection();
    general.acceptAlert();
    browser.waitForAngular();
    adminPage.reloadAllExplorations();
    adminPage.updateRole(USERNAME, 'collection editor');
    adminPage.updateRole(USERNAME_TWO, 'collection editor');
    users.logout();

    users.login('player@collections.com');
    browser.get(general.SERVER_URL_PREFIX);
    var dropdown = element(by.css('.protractor-test-profile-dropdown'));
    browser.actions().mouseMove(dropdown).perform();
    dropdown.element(by.css('.protractor-test-dashboard-link')).click();
    browser.waitForAngular();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateCollectionButton();
    browser.waitForAngular();
    // Add existing explorations.
    collectionEditor.addExistingExploration('0');
    collectionEditor.saveDraft();
    collectionEditor.closeSaveModal();
    collectionEditor.publishCollection();
    collectionEditor.setTitle('Test Collection 2');
    collectionEditor.setObjective('This is the second test collection.');
    collectionEditor.setCategory('Algebra');
    collectionEditor.saveChanges();
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
    collectionEditor.addExistingExploration('0');
    collectionEditor.addExistingExploration('4');
    collectionEditor.addExistingExploration('13');
    // Search and add existing explorations.
    collectionEditor.searchForAndAddExistingExploration('Lazy');
    collectionEditor.searchForAndAddExistingExploration('Linear');
    collectionEditor.searchForAndAddExistingExploration('The');
    // Shifting nodes in the node graph.
    collectionEditor.shiftNodeLeft(1);
    collectionEditor.shiftNodeRight(1);
    // Delete node in the node graph.
    collectionEditor.deleteNode(1);
    // Publish the collection.
    collectionEditor.saveDraft();
    collectionEditor.closeSaveModal();
    collectionEditor.publishCollection();
    collectionEditor.setTitle('Test Collection');
    collectionEditor.setObjective('This is a test collection.');
    collectionEditor.setCategory('Algebra');
    collectionEditor.saveChanges();
    browser.waitForAngular();
    users.logout();
  });

  it('visits the collection player', function() {
    users.login('alice@collections.com');
    browser.get('/collection/0');
    browser.waitForAngular();
    users.logout();
  });

  it('checks for console errors in a collection with one node', function() {
    users.login('player@collections.com');
    browser.get('/search/find?q=');
    browser.waitForAngular();
    element.all(by.css(
      '.protractor-test-collection-summary-tile-title')
    ).filter(function (elem) {
      return elem.getText().then(function (text) {
        return text === 'Test Collection 2';
      });
    }).first().click();
    browser.waitForAngular();
    general.waitForSystem();
    browser.getCurrentUrl().then(function(url) {
      var pathname = url.split('/');
      COLLECTION_ID = pathname[4];
    });
    users.logout();
  });

  it('checks for console errors in a collection with two nodes', function() {
    users.login('player@collections.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    element.all(by.css(
      '.protractor-test-collection-card')).first().click();
    browser.waitForAngular();
    general.waitForSystem();
    collectionEditor.addExistingExploration('4');
    collectionEditor.saveDraft();
    collectionEditor.setCommitMessage('Add Exploration');
    collectionEditor.closeSaveModal();
    browser.waitForAngular();

    browser.get('/collection/' + COLLECTION_ID);
    browser.waitForAngular();
    users.logout();
  });

  it('checks for console errors in a collection with three nodes', function() {
    users.login('player@collections.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    element.all(by.css(
      '.protractor-test-collection-card')).first().click();
    browser.waitForAngular();
    general.waitForSystem();
    collectionEditor.addExistingExploration('13');
    collectionEditor.saveDraft();
    collectionEditor.setCommitMessage('Add Exploration');
    collectionEditor.closeSaveModal();
    browser.waitForAngular();

    browser.get('/collection/' + COLLECTION_ID);
    browser.waitForAngular();
    users.logout();
  });

  it('checks for console errors in a collection with four nodes', function() {
    users.login('player@collections.com');
    creatorDashboardPage.get();
    browser.waitForAngular();
    element.all(by.css(
      '.protractor-test-collection-card')).first().click();
    browser.waitForAngular();
    general.waitForSystem();
    collectionEditor.addExistingExploration('10');
    collectionEditor.saveDraft();
    collectionEditor.setCommitMessage('Add Exploration');
    collectionEditor.closeSaveModal();
    browser.waitForAngular();

    browser.get('/collection/' + COLLECTION_ID);
    browser.waitForAngular();
    users.logout();
  });

  afterEach(function() {
    browser.manage().logs().get('browser').then(function(browserLog) {
      var i = 0, severWarnings = false, errors = 0;
      for (i; i <= browserLog.length - 1; i++) {
        // Check only for console errors and not warnings
        if (browserLog[i].level.name_ === 'SEVERE') {
          errors = errors + 1;
        }
      }
      expect(errors).toBe(0);
    });
  });
});
