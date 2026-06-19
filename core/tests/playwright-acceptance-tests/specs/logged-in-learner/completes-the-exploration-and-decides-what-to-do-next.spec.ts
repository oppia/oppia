// Copyright 2026 The Oppia Authors. All Rights Reserved.
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

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-In Learner', function () {
  let explorationEditor: ExplorationEditor;
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let explorationId: string | null;

  test.beforeAll(async function ({browser}) {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    explorationId =
      await explorationEditor.createAndPublishExplorationWithCards(
        'What are the Place Values?'
      );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'loggedInUser@example.com',
      browser
    );
  });

  test('should be able to rate the lesson', async function () {
    await loggedInUser.playExploration(explorationId);
    await loggedInUser.continueToNextCard();

    // Rate exploration and give feedback.
    await loggedInUser.expectRatingStarsToBeVisible();
    await loggedInUser.rateExploration(3, 'Nice!', false);
    await loggedInUser.expectStarRatingToBe(3);

    // Return to learner dashboard.
    await loggedInUser.returnToLibraryFromExplorationCompletion();
    await loggedInUser.expectToBeOnCommunityLibraryPage();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
