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
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {log} from 'console';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator;
  let loggedInUser: LoggedInUser;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to alter the rollout percentage for logged-in users and save' +
      'the changes in release coordinator page',
    async function () {
      await releaseCoordinator.navigateToReleaseCoordinatorPage();
      await releaseCoordinator.navigateToFeaturesTab();

      await loggedInUser.verifyNewDesignInLearnerDashboard(false);
      await releaseCoordinator.editFeatureRolloutPercentage(
        'show_redesigned_learner_dashboard',
        100
      );
      // Since the rollout percentage is 100, the new design should be visible to all users.
      await loggedInUser.verifyNewDesignInLearnerDashboard(true);

      await releaseCoordinator.editFeatureRolloutPercentage(
        'show_redesigned_learner_dashboard',
        0
      );
      await loggedInUser.verifyNewDesignInLearnerDashboard(false);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should enable the "Force-enable for all users" option and save the changes in' +
      'release coordinator page',
    async function () {
      await releaseCoordinator.navigateToReleaseCoordinatorPage();
      await releaseCoordinator.navigateToFeaturesTab();

      await loggedInUser.verifyNewDesignInLearnerDashboard(false);
      await releaseCoordinator.enableFeatureFlag(
        'show_redesigned_learner_dashboard'
      );
      await loggedInUser.verifyNewDesignInLearnerDashboard(true);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
