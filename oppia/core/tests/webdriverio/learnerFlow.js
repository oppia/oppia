// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var AdminPage = require('../webdriverio_utils/AdminPage.js');
var CollectionEditorPage = require('../webdriverio_utils/CollectionEditorPage.js');
var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');
var LearnerDashboardPage = require('../webdriverio_utils/LearnerDashboardPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');

describe('Learner dashboard functionality', function () {
  var adminPage = null;
  var collectionEditorPage = null;
  var explorationEditorPage = null;
  var libraryPage = null;

  beforeAll(function () {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    // The editor and player page objects are only required for desktop testing.
    if (!browser.isMobile) {
      collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
      explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
      explorationEditorMainTab = explorationEditorPage.getMainTab();
    }
  });

  it('should visit the collection player and play the correct collection', async function () {
    await users.createAndLoginSuperAdminUser(
      'expOfCollectionCreator@learnerDashboard.com',
      'expOfCollectionCreator'
    );
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
      testExplorationId = await general.getExplorationIdFromEditor();
      // Update the role of the user to admin since only admin users
      // can create a collection.
      await adminPage.get();
      await adminPage.addRole('expOfCollectionCreator', 'collection editor');
      await workflow.createCollectionAsAdmin();
      await collectionEditorPage.addExistingExploration(testExplorationId);
      await collectionEditorPage.saveDraft();
      await collectionEditorPage.closeSaveModal();
      await collectionEditorPage.publishCollection();
      await collectionEditorPage.setTitle(
        'Introduction to Collections in Oppia'
      );
      await collectionEditorPage.setObjective(
        'This is a collection to test player.'
      );
      await collectionEditorPage.setCategory('Algebra');
      await collectionEditorPage.saveChanges();
    }
    // This change helps debugging issue
    // #16260 E2E Flake: Splash page takes too long to appear.
    await general.callFunctionAndCollectFullStackTraceOnError(
      users.logout,
      new Error().stack
    );
    var PLAYER_USERNAME = 'collectionPlayerDM';
    await users.createAndLoginUser(
      'collectionPlayerDesktopAndMobile@learnerFlow.com',
      PLAYER_USERNAME
    );
    await libraryPage.get();
    await libraryPage.findCollection('Introduction to Collections in Oppia');
    await libraryPage.playCollection('Introduction to Collections in Oppia');
  });

  afterEach(async function () {
    await general.checkForConsoleErrors([]);
    // This change helps debugging issue
    // #16260 E2E Flake: Splash page takes too long to appear.
    await general.callFunctionAndCollectFullStackTraceOnError(
      users.logout,
      new Error().stack
    );
  });
});
