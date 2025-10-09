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
 * @fileoverview End-to-end tests of the publication and featuring process, and
 * the resultant display of explorations in the library.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var ReleaseCoordinatorPage = require('../webdriverio_utils/ReleaseCoordinatorPage.js');

describe('Library index page', function () {
  var adminPage = null;
  var libraryPage = null;
  var explorationEditorPage = null;
  let releaseCoordinatorPage = null;

  beforeAll(async function () {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    releaseCoordinatorPage =
      new ReleaseCoordinatorPage.ReleaseCoordinatorPage();

    await users.createAndLoginSuperAdminUser(
      'superUser@publicationAndLibrary.com',
      'superUser'
    );
    await adminPage.get();
    await adminPage.addRole('superUser', 'release coordinator');
    await releaseCoordinatorPage.getFeaturesTab();
    improvementsTabFeature =
      await releaseCoordinatorPage.getImprovementsTabFeatureElement();
    await releaseCoordinatorPage.enableFeature(improvementsTabFeature);
    await users.logout();
  });

  it('should not have any non translated strings', async function () {
    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_ENVIRONMENT = 'Environment';
    var CATEGORY_BUSINESS = 'Business';
    var LANGUAGE_FRANCAIS = 'français (French)';
    var LANGUAGE_FRANCAI = 'français';
    await users.createUser('aule@example.com', 'Aule');

    await users.login('aule@example.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS,
      CATEGORY_BUSINESS,
      'hold the light of the two trees',
      LANGUAGE_FRANCAIS,
      true
    );
    await workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT,
      CATEGORY_ENVIRONMENT,
      'seek the aid of the Valar',
      LANGUAGE_FRANCAIS,
      false
    );
    await users.logout();

    await libraryPage.get();
    await libraryPage.expectMainHeaderTextToBe(
      'Imagine what you could learn today...'
    );
    await general.ensurePageHasNoTranslationIds();

    // Filter library explorations.
    await libraryPage.selectLanguages([LANGUAGE_FRANCAI]);
    await general.ensurePageHasNoTranslationIds();
  });

  afterEach(async function () {
    await general.checkForConsoleErrors([]);
  });
});

describe('Permissions for private explorations', function () {
  var explorationEditorPage = null;
  var explorationEditorSettingsTab = null;
  var expectedConsoleErrors = null;

  beforeEach(function () {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    expectedConsoleErrors = [
      'Failed to load resource: the server responded with a status of 404',
    ];
  });

  it('should not be changeable if title is not given to exploration', async function () {
    await users.createUser('checkFor@title.com', 'Thanos');
    await users.login('checkFor@title.com');
    await workflow.createExploration(true);
    await explorationEditorPage.navigateToSettingsTab();

    await workflow.openEditRolesForm();
    expect(await workflow.canAddRolesToUsers()).toBe(false);
    expect(await workflow.checkForAddTitleWarning()).toBe(true);
    await explorationEditorSettingsTab.setTitle('Pass');
    await workflow.triggerTitleOnBlurEvent();
    expect(await workflow.canAddRolesToUsers()).toBe(true);
    expect(await workflow.checkForAddTitleWarning()).toBe(false);
    await users.logout();
  });

  afterEach(async function () {
    await general.checkForConsoleErrors(expectedConsoleErrors);
  });
});
