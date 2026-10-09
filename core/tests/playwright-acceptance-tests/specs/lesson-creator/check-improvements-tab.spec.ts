// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJ spreadsheet
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/edit?gid=888982708#gid=888982708
 *
 * LC.13. Check Improvements Tab
 */

import {expect, test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;
const IMPROVEMENTS_TAB_FEATURE_FLAG = 'is_improvements_tab_enabled';
const EXPLORATION_CONTENT = 'Test Exploration Content';
const featureFlagSelector = '.e2e-test-feature-flag';
const featureFlagValueSelector = '.e2e-test-value-selector';
const featureFlagSaveButtonSelector = '.e2e-test-save-button';
const stateContentSelector = '.e2e-test-actual-state-content';

test.describe.configure({mode: 'serial'});

test.describe('Lesson Creator', function () {
  let explorationEditor: ExplorationEditor;
  let explorationId: string;

  test.beforeAll(async function ({browser}) {
    const releaseCoordinator: ReleaseCoordinator =
      await UserFactory.createNewUser(
        'releaseCoordinator',
        'release_coordinator@example.com',
        browser,
        [ROLES.RELEASE_COORDINATOR]
      );

    await releaseCoordinator.enableFeatureFlag(IMPROVEMENTS_TAB_FEATURE_FLAG);
    const featureFlag = releaseCoordinator.page
      .locator(featureFlagSelector)
      .filter({
        has: releaseCoordinator.page.getByText(IMPROVEMENTS_TAB_FEATURE_FLAG, {
          exact: true,
        }),
      });
    await expect(featureFlag.locator(featureFlagValueSelector)).toHaveValue(
      '0: true'
    );
    // Wait for this feature's save to finish before closing its context.
    // Other feature rows also contain disabled Save buttons.
    await expect(
      featureFlag.locator(featureFlagSaveButtonSelector)
    ).toBeDisabled();
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    explorationEditor = await UserFactory.createNewUser(
      'explorationCreator',
      'exploration_creator@example.com',
      browser
    );
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(EXPLORATION_CONTENT);
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await explorationEditor.saveExplorationDraft();
    explorationId = new URL(explorationEditor.page.url()).pathname.split(
      '/'
    )[2];
  });

  test('should not see improvements tab in draft exploration', async function () {
    await explorationEditor.expectImprovementsTabToBePresent(false);

    await explorationEditor.navigateToCreatorDashboardPage();
    // Reopen the saved draft rather than creating a second exploration.
    await explorationEditor.openExplorationFromCreatorDashboard(explorationId);
    await expect(explorationEditor.page).toHaveURL(
      url => url.pathname === `/create/${explorationId}`
    );
    await expect(
      explorationEditor.page.locator(stateContentSelector)
    ).toContainText(EXPLORATION_CONTENT);
    await explorationEditor.expectImprovementsTabToBePresent(false);
  });

  // TODO(#13352): Test improvements tab visibility in published explorations.
  // Blocked by #7327: Generating NeedsGuidingResponses tasks requires answer
  // stats to be generated incrementally via a slow continuous job, making it
  // too costly to include in acceptance tests. This test covers the core
  // goal: improvements tab is hidden for draft explorations.

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
