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

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser;
  let loggedOutUser: LoggedOutUser;
  let explorationId1: string | null;
  let explorationId2: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    explorationId1 =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Algebra I'
      );
    explorationId2 =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Algebra II',
        'Algorithms'
      );

    await explorationEditor.playExploration(explorationId1);
    await explorationEditor.rateExploration(
      5,
      'Excellent advanced Algebra course',
      false
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should be able to browse and search for lessons and see the rating of lessons in the community library', async function () {
    const actions = [
      {
        action: () => loggedOutUser.navigateToCommunityLibraryPage(),
        name: 'navigateToCommunityLibraryPage',
      },
      {
        action: () => loggedOutUser.searchForLessonInSearchBar('Algebra II'),
        name: 'searchForLessonInSearchBar_AlgebraII',
      },
      {
        action: () =>
          loggedOutUser.expectSearchResultsToContain([
            'Algebra I',
            'Algebra II',
          ]),
        name: 'expectSearchResultsToContain_AlgebraII',
      },
      {
        action: () => loggedOutUser.filterLessonsByCategories(['Algorithm']),
        name: 'filterLessonsByCategories_Algebra',
      },
      {
        action: () =>
          loggedOutUser.expectSearchResultsToContain(['Algebra II']),
        name: 'expectSearchResultsToContain_AlgebraII',
      },
      {
        action: () => loggedOutUser.filterLessonsByLanguage(['Aken']),
        name: 'filterLessonsByLanguage_English',
      },
      {
        action: () => loggedOutUser.expectSearchResultsToContain([]),
        name: 'expectSearchResultsToContain_AlgebraII',
      },
      // Access the top-rated page at /community-library/top-rated, which shows explorations with high ratings.
      {
        action: () => loggedOutUser.navigateToTopRatedPage(),
        name: 'navigateToTopRatedPage',
      },
      {
        action: () =>
          loggedOutUser.expectExplorationsInOrder(['Algebra II', 'Algebra I']),
        name: 'expectExplorationsInOrder_AlgebraII_AlgebraI',
      },
      // Visit the recently published explorations page at /community-library/recently-published.
      {
        action: () => loggedOutUser.navigateToRecentlyPublishedPage(),
        name: 'navigateToRecentlyPublishedPage',
      },
      {
        action: () =>
          loggedOutUser.expectExplorationsInOrder(['Algebra I', 'Algebra II']),
        name: 'expectExplorationsInOrder_AlgebraI_AlgebraII',
      },
      // View the ratings on an exploration once a minimum number of ratings have been submitted.
      {
        action: () =>
          loggedOutUser.expectExplorationToHaveRating(4, 'Algebra I'),
        name: 'expectExplorationToHaveRating_4_AlgebraI',
      },
      {
        action: () => loggedOutUser.timeout(2147483647),
      },
    ];

    for (const {action, name} of actions) {
      try {
        await action();
      } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', error);
        await loggedOutUser.screenshot(`error_${name}.png`);
      }
    }
  }, 2147483647);
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
