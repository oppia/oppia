// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * RC.RD Enable feature flag.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const dummyFeatureFlagName = 'dummy_feature_flag_for_e2e_tests';

describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [testConstants.Roles.RELEASE_COORDINATOR]
    );
  });

  it('should be able to view feature flags', async function () {
    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.navigateToFeaturesTab();
    await releaseCoordinator.expectFeatureFlagToBePresent(dummyFeatureFlagName);
    await releaseCoordinator.expectFeatureFlagForcedEnabledStatusToBe(
      dummyFeatureFlagName,
      false
    );
    await releaseCoordinator.expectRolloutPercentageInputToBe(
      dummyFeatureFlagName,
      'enabled',
      0
    );
  });

  it('should be able to force enable a feature flag', async function () {
    // Enable the feature flag.
    await releaseCoordinator.enableFeatureFlag(dummyFeatureFlagName);
    await releaseCoordinator.expectFeatureFlagForcedEnabledStatusToBe(
      dummyFeatureFlagName,
      true
    );
    await releaseCoordinator.expectRolloutPercentageInputToBe(
      dummyFeatureFlagName,
      'disabled'
    );
    // Verify that data is persisted on reload.
    await releaseCoordinator.page.reload();
    await releaseCoordinator.navigateToFeaturesTab();
    await releaseCoordinator.expectFeatureFlagForcedEnabledStatusToBe(
      dummyFeatureFlagName,
      true
    );
    await releaseCoordinator.expectRolloutPercentageInputToBe(
      dummyFeatureFlagName,
      'disabled'
    );
    await releaseCoordinator.verifyDummyHandlerStatusInFeaturesTab(true);
  });

  it('should be able to remove force-enabling of feature flag', async function () {
    await releaseCoordinator.enableFeatureFlag(dummyFeatureFlagName, false);
    await releaseCoordinator.expectFeatureFlagForcedEnabledStatusToBe(
      dummyFeatureFlagName,
      false
    );
    await releaseCoordinator.expectRolloutPercentageInputToBe(
      dummyFeatureFlagName,
      'enabled',
      0
    );

    // Verify that data is persisted on reload.
    await releaseCoordinator.page.reload();
    await releaseCoordinator.navigateToFeaturesTab();
    await releaseCoordinator.expectFeatureFlagForcedEnabledStatusToBe(
      dummyFeatureFlagName,
      false
    );
    await releaseCoordinator.expectRolloutPercentageInputToBe(
      dummyFeatureFlagName,
      'enabled',
      0
    );

    // Verify that dummy handler tag is removed.
    await releaseCoordinator.verifyDummyHandlerStatusInFeaturesTab(false);
  });

  it('should be able to set a percentage rollout', async function () {
    // Set a rollout percentage.
    await releaseCoordinator.editFeatureRolloutPercentage(
      dummyFeatureFlagName,
      50
    );
    await releaseCoordinator.expectFeatureFlagForcedEnabledStatusToBe(
      dummyFeatureFlagName,
      false
    );
    await releaseCoordinator.expectRolloutPercentageInputToBe(
      dummyFeatureFlagName,
      'enabled',
      50
    );

    // Check that data is persisted on reload.
    await releaseCoordinator.page.reload();
    await releaseCoordinator.navigateToFeaturesTab();
    await releaseCoordinator.expectFeatureFlagForcedEnabledStatusToBe(
      dummyFeatureFlagName,
      false
    );
    await releaseCoordinator.expectRolloutPercentageInputToBe(
      dummyFeatureFlagName,
      'enabled',
      50
    );

    // Reset the rollout percentage.
    await releaseCoordinator.editFeatureRolloutPercentage(
      dummyFeatureFlagName,
      0
    );
    await releaseCoordinator.expectFeatureFlagForcedEnabledStatusToBe(
      dummyFeatureFlagName,
      false
    );
    await releaseCoordinator.expectRolloutPercentageInputToBe(
      dummyFeatureFlagName,
      'enabled',
      0
    );
  });

  it('should be able to set rollout to a user group', async function () {
    await releaseCoordinator.navigateToMiscTab();
    await releaseCoordinator.addUserGroup('group1');
    // TODO(#23330): Currently, adding a user to user group is not working.
    // Once fixed, add a part to add user 'anotherUser' to user group 'group1'.
    // Also, try adding the user again to the same user group. It should throw an error.
    // Also, try using an invalid username. It should throw an error.

    // Try to create a duplicate user group.
    await releaseCoordinator.addUserGroup('group1');
    await releaseCoordinator.expectUserGroupCreationErrorToBe(
      "The user group 'group1' already exists."
    );

    // Create another user group.
    await releaseCoordinator.addUserGroup('group2');
    await releaseCoordinator.expectUserGroupToBePresent('group1');
    await releaseCoordinator.expectUserGroupToBePresent('group2');

    // Remove the user group 'group2'.
    await releaseCoordinator.removeUserGroup('group2');
    await releaseCoordinator.expectUserGroupToBePresent('group1');
    await releaseCoordinator.expectUserGroupToBePresent('group2', false);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
