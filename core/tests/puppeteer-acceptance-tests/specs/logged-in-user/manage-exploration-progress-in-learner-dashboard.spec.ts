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
 * @fileoverview Acceptance tests for learner dashboard functionalities, specfically
 * interactions with components that use exploration and collectons data (community lessons).
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  let loggedInUser: LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );

    const explorationTitles = [
      'Exploration 1',
      'Exploration 2',
      'Exploration 3',
    ];

    for (const title of explorationTitles) {
      await curriculumAdmin.createAndPublishExplorationWithCards(title);
    }

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  }, 480000);

  /**
   * TODO(#22493): Add tests for home tab. Interactions involving in-progress lessons
   * and saved lessons sections.
   */

  /**
   * TODO(#22493): Add tests for progress tab. Interactions involving in-progress
   * and completed explorations.
   */

  it(
    'should navigate to the new learner dashboard',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
