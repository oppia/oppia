// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test for the Improvements Tab in the exploration editor.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Improvements Tab', function () {
  let explorationEditor: ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  const IMPROVEMENTS_TAB_FEATURE_FLAG_NAME = 'is_improvements_tab_enabled';

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [testConstants.Roles.RELEASE_COORDINATOR]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    // Enable the Improvements Tab feature flag once for all tests.
    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.navigateToFeaturesTab();
    await releaseCoordinator.enableFeatureFlag(
      IMPROVEMENTS_TAB_FEATURE_FLAG_NAME
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should not be present in an unpublished exploration',
    async function () {
      // Step 1: Create a new exploration as an editor.
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();

      // Step 2: Verify that the Improvements Tab is NOT visible in draft mode.
      // The improvements tab should only be visible in published explorations
      // that have generated improvement tasks (e.g., from learner interactions).
      await explorationEditor.expectImprovementsTabToBeHidden();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // TODO(#13352): The test for improvements tab visibility in published explorations
  // is marked as TODO in the original E2E tests. This required
  // testing the tab after learner interactions generate improvement suggestions,
  // which involves complex setup for generating answer statistics incrementally.
  // This acceptance test focuses on the core functionality: verifying the tab
  // is hidden in draft mode when the feature flag is enabled.

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
