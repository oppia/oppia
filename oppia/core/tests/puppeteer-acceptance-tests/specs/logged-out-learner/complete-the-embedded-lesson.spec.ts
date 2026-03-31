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
 * EE. Learner can complete the embedded lesson
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

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
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to start an embedded lesson',
    async function () {
      // Visit the embedded lesson URL, and expect exploration to be present.
      await loggedOutUser.goto(
        `http://localhost:8181/embed/exploration/${explorationId}`
      );
      await loggedOutUser.expectCardContentToMatch('Content 0');

      // Verify continue button, and language dropdown are present.
      await loggedOutUser.expectContinueToNextCardButtonToBePresent();
      await loggedOutUser.expectLanguageDropdownToBePresent();

      // Verify lesson info text, and audio bar are not present.
      await loggedOutUser.expectLessonInfoTextToBePresent(false);
      await loggedOutUser.expectVoiceoverBarToBePresent(false);
      await loggedOutUser.expectSignInButtonToBePresent(false);

      // Compare screenshot of the embedded lesson player.
      await loggedOutUser.expectScreenshotToMatch(
        'lessonPlayerEmbedded',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to complete the embedded lesson, but not rate the exploration',
    async function () {
      // Complete the exploration and expect completion toast message.
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Expect rate options to not be available.
      await loggedOutUser.expectRateOptionsNotAvailable();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
