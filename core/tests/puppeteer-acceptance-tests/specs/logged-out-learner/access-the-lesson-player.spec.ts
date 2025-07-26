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
 * EL.LP.  Learner can access the lesson player
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;

  let explorationId: string | null;
  beforeAll(async function () {
    loggedOutLearner = await UserFactory.createLoggedOutUser();

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Addition'
      );

    if (!explorationId) {
      throw new Error('Exploration ID is null or undefined.');
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should not be able to access non-existent lesson', async function () {
    // Try navigating to a non-existent lesson player.
    const wrongExplorationId =
      explorationId?.slice(5) ?? '' + explorationId?.slice(0, 5);

    await loggedOutLearner.playExploration(wrongExplorationId);
    await loggedOutLearner.expectToBeOnErrorPage(404);
  });

  it('should be able to access existent lesson', async function () {
    // Navigate to exploration, verify URL, and match screenshot.
    await loggedOutLearner.playExploration(explorationId);
    await loggedOutLearner.expectToBeOnPage('/explore/');

    await loggedOutLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );
    await loggedOutLearner.expectScreenshotToMatch(
      'explorationPlayerPage',
      __dirname
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
