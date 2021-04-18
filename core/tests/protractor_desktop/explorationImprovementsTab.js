// Copyright 2019 The Oppia Authors. All Rights Reserved.
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

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage = (
  require('../protractor_utils/CreatorDashboardPage.js'));
var ExplorationEditorPage = (
  require('../protractor_utils/ExplorationEditorPage.js'));

describe('Improvements tab', function() {
  let adminPage = new AdminPage.AdminPage();
  let creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
  let explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();

  let explorationEditorImprovementsTab = (
    explorationEditorPage.getImprovementsTab());

  beforeAll(async() => {
    await users.createAndLoginAdminUser(
      'superUser@improvementsTab.com', 'superUser');
    await adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor.',
      'Boolean',
      async(elem) => await elem.setValue(true));
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

  it('should be present after revisiting a published exploration', async() => {
    await users.createUser(
      'publisher@improvementsTab.com', 'improvementsTabPublisher');
    await users.login('publisher@improvementsTab.com');
    await workflow.createAndPublishExploration(
      'Demo Exploration',
      'Algebra',
      'Learn how to demo',
      'English',
      true
    );

    // Freshly-published explorations should not show the improvements tab yet.
    await explorationEditorImprovementsTab.expectToBeHidden();

    await general.goToHomePage();
    await creatorDashboardPage.get();
    await creatorDashboardPage.navigateToExplorationEditor();

    // After revisiting the exploration editor, the button should be visible.
    await explorationEditorPage.navigateToImprovementsTab();
    await explorationEditorImprovementsTab.expectHealthyExploration();
    await users.logout();
  });

  // TODO(#7327): Add tests for generating and resolving NeedsGuidingResponses
  // tasks once answer stats are generated incrementally. Currently, we need to
  // run a slow continuous job; too slow to outweigh the benefit in test
  // coverage.
});
