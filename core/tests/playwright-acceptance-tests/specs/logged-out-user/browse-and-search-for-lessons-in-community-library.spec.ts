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
 * @fileoverview Acceptance tests for the community library page interactions.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser;
  let loggedOutUser: LoggedOutUser;
  let explorationId1: string | null;
  let explorationId2: string | null;

  test.beforeAll(async function ({browser}) {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);

    explorationId1 =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Algebra I'
      );
    explorationId2 =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Algebra II',
        'Algorithms',
        false
      );

    await explorationEditor.playExplorationAsLoggedInUser(explorationId1);
    await explorationEditor.rateExploration(
      5,
      'Excellent advanced Algebra course',
      false
    );

    await explorationEditor.playExplorationAsLoggedInUser(explorationId2);
    await explorationEditor.rateExploration(
      4,
      'Excellent advanced Algebra course',
      false
    );
  });

  test('should be able to browse for lessons and see the rating of lessons in the community library', async function () {
    await loggedOutUser.navigateToCommunityLibraryPage();

    // View the ratings on an exploration once a minimum number of ratings have been submitted.
    await loggedOutUser.expectLessonsToHaveRating(5, 'Algebra I');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
