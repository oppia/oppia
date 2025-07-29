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
 * LI. Learner completes the exploration and decides what to do next.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-In Learner', function () {
  let explorationEditor: ExplorationEditor;
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    explorationId =
      await explorationEditor.createAndPublishExplorationWithCards(
        'What are the Place Values?'
      );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'loggedInUser@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to rate the lesson',
    async function () {
      await loggedInUser.playExploration(explorationId);
      await loggedInUser.continueToNextCard();

      // Rate exploration and give feedback.
      await loggedInUser.expectRatingStarsToBeVisible();
      await loggedInUser.rateExploration(3, 'Nice!', false);
      await loggedInUser.expectStarRatingToBe(3);

      // Return to learner dashboard.
      await loggedInUser.returnToLibraryFromExplorationCompletion();
      await loggedInUser.expectToBeOnCommunityLibraryPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);
});
