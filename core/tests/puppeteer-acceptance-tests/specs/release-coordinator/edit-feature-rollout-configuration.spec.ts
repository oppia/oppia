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
 * @fileoverview Acceptance tests for the release coordinator's ability
 *  to manage feature rollouts.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Release Coordinator', function () {
  let releaseCoordinator1: ReleaseCoordinator;
  let releaseCoordinator2: ReleaseCoordinator;

  beforeAll(async function () {
    releaseCoordinator1 = await UserFactory.createNewUser(
      'releaseCoordinator1',
      'release_coordinator1@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    releaseCoordinator2 = await UserFactory.createNewUser(
      'releaseCoordinator2',
      'release_coordinator2@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to alter the rollout percentage for logged-in users and save' +
      'the changes in release coordinator page',
    async function () {
      await releaseCoordinator1.navigateToReleaseCoordinatorPage();
      await releaseCoordinator1.navigateToFeaturesTab();

      await releaseCoordinator1.editFeatureRolloutPercentage(
        'dummy_feature_flag_for_e2e_tests',
        100
      );
      // Since the rollout percentage is 100, the Dummy Handler should be visible to all users.
      await releaseCoordinator2.verifyDummyHandlerStatusInFeaturesTab(true);

      await releaseCoordinator1.editFeatureRolloutPercentage(
        'dummy_feature_flag_for_e2e_tests',
        0
      );
      // Since the rollout percentage is 0, the Dummy handler should not be visible to any users.
      await releaseCoordinator2.verifyDummyHandlerStatusInFeaturesTab(false);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should enable the "Force-enable for all users" option and save the changes in' +
      'release coordinator page',
    async function () {
      await releaseCoordinator1.navigateToReleaseCoordinatorPage();
      await releaseCoordinator1.navigateToFeaturesTab();
      await releaseCoordinator1.enableFeatureFlag(
        'dummy_feature_flag_for_e2e_tests'
      );

      await releaseCoordinator2.verifyDummyHandlerStatusInFeaturesTab(true);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
