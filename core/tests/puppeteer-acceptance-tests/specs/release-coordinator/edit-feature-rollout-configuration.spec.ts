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
const promoMessage =
  'New Features Alert! Check out our latest updates and enhancements. Explore now!';

describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should navigate to the "Features" tab, alter the rollout percentage for logged-in users, enable or disable the "Force-enable for all users" option, and save the changes',
    async function () {
      await releaseCoordinator.navigateToReleaseCoordinatorPage();
      await releaseCoordinator.navigateToFeaturesTab();
      await releaseCoordinator.alterRolloutPercentageForLoggedInUsers(50);
      await releaseCoordinator.toggleForceEnableForAllUsers();
      await releaseCoordinator.saveChanges();

      // Verify the changes
      await releaseCoordinator.expectRolloutPercentageForLoggedInUsersToBe(50);
      await releaseCoordinator.expectForceEnableForAllUsersToBe(true);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
