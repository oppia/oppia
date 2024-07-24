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
 * @fileoverview Acceptance Test for the learner journey in the math classroom.
 * User Journey: Lesson info modal usage, progress tracking, state answering, progress URL generation and usage.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-out User', function () {
  let explorationEditor:  ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'explorationEditor@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Negative Numbers'
      );

    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS
);

it(
    'should be able to check progress, answer states, generate and use progress URL in the exploration player.',
    async function () {
        await loggedOutUser.navigateToExplorationPlayer();

        await loggedOutUser.checkLessonInfoModal();
        await loggedOutUser.reloadPage();

        await loggedOutUser.tryToReturnToMostRecentCheckpoint();
        await loggedOutUser.tryToAnswerPreviouslyAnsweredState();

        await loggedOutUser.tryToGenerateProgressUrlBeforeFirstCheckpoint();
        await loggedOutUser.reachFirstCheckpoint();
        await loggedOutUser.generateProgressUrlAfterFirstCheckpoint();

        await loggedOutUser.checkProgressUrlModalButtons();
        await loggedOutUser.checkProgressUrlValidityInfo();

        const progressUrl = await loggedOutUser.copyProgressUrl();
        await loggedOutUser.startExplorationUsingProgressUrl(progressUrl);

        await loggedOutUser.chooseExplorationActionAfterUsingProgressUrl();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
