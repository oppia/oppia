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
 * @fileoverview End-to-end tests for the functionality of the statistics tabs
 * in the exploration editor.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ExplorationEditorPage = (
  require('../webdriverio_utils/ExplorationEditorPage.js'));
var ReleaseCoordinatorPage = require(
  '../webdriverio_utils/ReleaseCoordinatorPage.js');

describe('Improvements tab', function() {
  let explorationEditorPage = null;
  let explorationEditorImprovementsTab = null;
  let releaseCoordinatorPage = null;
  let improvementsTabFeature = null;
  let adminPage = null;

  beforeAll(async() => {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    releaseCoordinatorPage = (
      new ReleaseCoordinatorPage.ReleaseCoordinatorPage());
    await users.createAndLoginCurriculumAdminUser(
      'superUser@improvementsTab.com', 'superUser');
    await adminPage.get();
    await adminPage.addRole('superUser', 'release coordinator');
    await releaseCoordinatorPage.getFeaturesTab();
    improvementsTabFeature = (
      await releaseCoordinatorPage.getImprovementsTabFeatureElement());
    await releaseCoordinatorPage.enableFeature(improvementsTabFeature);
    explorationEditorImprovementsTab = (
      explorationEditorPage.getImprovementsTab());
    await users.logout();
  });

  afterEach(async() => {
    await general.checkForConsoleErrors([]);
  });

  it('should not be present in an unpublished exploration', async() => {
    await users.createUser(
      'drafter@improvementsTab.com', 'improvementsTabDrafter');
    await users.login('drafter@improvementsTab.com');
    await workflow.createExploration(true);

    await explorationEditorImprovementsTab.expectToBeHidden();
    await users.logout();
  });

  // TODO(#13352): Add back test that verifies that the improvements tab is
  // present after revisiting a published exploration.
  // TODO(#7327): Add tests for generating and resolving NeedsGuidingResponses
  // tasks once answer stats are generated incrementally. Currently, we need to
  // run a slow continuous job; too slow to outweigh the benefit in test
  // coverage.
});
