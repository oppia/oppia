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

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

/**
 * @fileoverview Acceptance Test for checking if a learner can play an
 * exploration in an embedded lesson
 */

describe('Logged-Out Learner in Embedded Lesson', function () {
  let loggedOutUser: LoggedOutUser;
  let explorationEditor: ExplorationEditor;
  let explorationId: string;
  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor2',
      'exploration_editor2@example.com'
    );

    explorationId =
      await explorationEditor.createAndPublishExplorationWithCards(
        'A Quick Exploration',
        'Algorithms'
      );

    loggedOutUser = await UserFactory.createLoggedOutUser();
  });
  it('should be able to start an embedded lesson', async function () {
    // TODO: Visit /embed/exploration/expId
    await loggedOutUser.goto(
      `http://localhost:8181/embed/exploration/${explorationId}`
    );
    // TODO: First card of exploration is displayed
    // TODO: Continue Button is displayed
    await loggedOutUser.expectContinueToNextCardButtonToBePresent();
    // TODO: Lesson Info text isn't visible in the footer
    // TODO: Audio Bar isn't visible
    // TODO: Language option should be visible
    // TODO: compare screenshots
  });

  it('should be able to complete the embedded lesson', async function () {
    // TODO: complete the lesson to the end
    // TODO: Lesson completion confetti shows up
    // TODO: No chapter suggestion.
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
