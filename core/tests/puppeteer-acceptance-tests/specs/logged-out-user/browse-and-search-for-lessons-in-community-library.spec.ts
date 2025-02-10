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

    await explorationEditor.playExploration(explorationId2);
    await explorationEditor.rateExploration(
      4,
      'Excellent advanced Algebra course',
      false
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to browse and search for lessons and see the rating of lessons in the community library',
    async function () {
      await loggedOutUser.navigateToCommunityLibraryPage();

      await loggedOutUser.searchForLessonInSearchBar('Algebra II');
      await loggedOutUser.expectSearchResultsToContain([
        'Algebra I',
        'Algebra II',
      ]);

      await loggedOutUser.filterLessonsByCategories(['Algorithms']);
      await loggedOutUser.expectSearchResultsToContain(['Algebra II']);

      await loggedOutUser.filterLessonsByLanguage(['Ákán']);
      // No lessons are created in the Ákán language.
      await loggedOutUser.expectSearchResultsToContain([]);

      // Access the top-rated page at /community-library/top-rated, which shows explorations with high ratings.
      await loggedOutUser.navigateToTopRatedLessonsPage();
      await loggedOutUser.expectLessonsInOrder(['Algebra I', 'Algebra II']);

      // Visit the recently published explorations page at /community-library/recently-published.
      await loggedOutUser.navigateToRecentlyPublishedLessonsPage();
      await loggedOutUser.expectLessonsInOrder(['Algebra II', 'Algebra I']);

      // View the ratings on an exploration once a minimum number of ratings have been submitted.
      await loggedOutUser.expectLessonsToHaveRating(5, 'Algebra I');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
