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
var admin = require('../protractor_utils/admin.js');
var collectionEditor = require('../protractor_utils/collectionEditor.js');
var collectionPlayer = require('../protractor_utils/collectionPlayer.js');

describe('Collections', function() {
  beforeAll(function() {
    var USERNAME = 'aliceCollections';
    users.createAndLoginAdminUser('alice@collections.com', USERNAME);
    browser.get(general.ADMIN_URL_SUFFIX);
    element.all(by.css(
      '.protractor-test-reload-collection-button')).first().click();
    general.acceptAlert();
    browser.waitForAngular();
    admin.editConfigProperty(
      'Names of users allowed to use the collection editor',
      'List', function(listEditor) {
        listEditor.addItem('Unicode').setValue(USERNAME);
      }
    );
    users.logout();
  });
 
 

  it('visits the collection editor', function() {
    users.login('alice@collections.com');
    browser.get(general.SERVER_URL_PREFIX);
    var dropdown = element(by.css('.protractor-test-profile-dropdown'));
    browser.actions().mouseMove(dropdown).perform();
    dropdown.element(by.css('.protractor-test-dashboard-link')).click();
    browser.waitForAngular();
    element(by.css('.protractor-test-create-activity')).click();
    // Create new collection.
    element(by.css('.protractor-test-create-collection')).click();
    browser.waitForAngular();
    // Add existing explorations.
    collectionEditor.addExistingExploration('0');
    collectionEditor.addExistingExploration('4');
    collectionEditor.addExistingExploration('13');
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

  it('interacts with the collection player as a guest', function() {
    collectionPlayer.goToDemoCollection();
    // Check that we are in the guest state (sign in button visible).
    collectionPlayer.verifySignInButton();
    // Verify that there are 5 uncompleted explorations (initial state).
    collectionPlayer.verifyNumUncompletedExplorations(5);
    // Play the third exploration in the demo collection.
    collectionPlayer.playDemoExplorationThree();
    // Verify that the suggested exploration is the next in the collection.
    collectionPlayer.verifySuggestedExplorationAsGuest();
    // Go back to collection player.
    collectionPlayer.goToDemoCollection();
    // Verify that there are 5 uncompleted explorations, since this is a guest.
    collectionPlayer.verifyNumUncompletedExplorations(5);
  });
    
  it('interacts with the collection player as a logged-in user', function() {
    users.login('alice@collections.com');
    collectionPlayer.goToDemoCollection();
    // Verify that profile dropdown thumbnail appears, since we are logged in.
    collectionPlayer.verifyProfileDropdown();
    // Verify that there are 5 uncompleted explorations (initial state).
    collectionPlayer.verifyNumUncompletedExplorations(5);
    // This test (i.e. part 3) needs to be finished
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
