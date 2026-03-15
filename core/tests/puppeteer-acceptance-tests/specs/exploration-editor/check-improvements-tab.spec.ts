// Copyright 2024 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Acceptance test to verify that the Improvements tab
 * is not visible for draft explorations in the exploration editor.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Check Improvements Tab', function () {
  let explorationEditor: ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  const IMPROVEMENTS_TAB_FEATURE_FLAG = 'is_improvements_tab_enabled';

  beforeAll(async function () {
    // Create releaseCoordinator to enable the feature flag.
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [testConstants.Roles.RELEASE_COORDINATOR]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationCreator',
      'exploration_creator@example.com'
    );

    // Enable the Improvements Tab feature flag.
    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.navigateToFeaturesTab();
    await releaseCoordinator.enableFeatureFlag(IMPROVEMENTS_TAB_FEATURE_FLAG);

    // Create exploration "Test Exploration" and save as draft per CUJ.
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent('Test Exploration Content');
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await explorationEditor.saveExplorationDraft();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should not show improvements tab in a draft exploration',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();

      // Improvements Tab should NOT be visible in a draft exploration.
      await explorationEditor.expectImprovementsTabToBeHidden();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // TODO(#13352): Test improvements tab visibility in published explorations.
  // Blocked by #7327: Generating NeedsGuidingResponses tasks requires answer
  // stats to be generated incrementally via a slow continuous job, making it
  // too costly to include in acceptance tests. This test covers the core
  // goal: improvements tab is hidden for draft explorations.

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
