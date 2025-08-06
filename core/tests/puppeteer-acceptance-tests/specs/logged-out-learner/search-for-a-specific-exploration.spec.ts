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
 * CL.SE. Learner searches for a specific exploration
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let explorationEditor: ExplorationEditor & LoggedInUser;
  let explorationId: string;

  beforeAll(async function () {
    // Create a new users.
    loggedOutLearner = await UserFactory.createLoggedOutUser();

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    // Create a new explorations.
    await explorationEditor.createAndPublishExplorationWithCards(
      'Fractions',
      'Mathematics'
    );

    explorationId =
      await explorationEditor.createAndPublishExplorationWithCards(
        'Geometry',
        'Mathematics'
      );

    await explorationEditor.playExploration(explorationId);
    await explorationEditor.continueToNextCard();
    await explorationEditor.rateExploration(
      5,
      'Excellent advanced Algebra course',
      false
    );
  });

  it('should be able to search for an exploration of an interest', async function () {
    await loggedOutLearner.navigateToCommunityLibraryOnNavbar();

    await loggedOutLearner.searchForLessonInSearchBar('Geometry');
    await loggedOutLearner.expectSearchResultsToContain(['Geometry']);
    await loggedOutLearner.expectSearchResultsToContain(['Fractions'], false);

    await loggedOutLearner.expectLessonsToHaveRating(5, 'Geometry');
    await loggedOutLearner.expectLessonViewsToBe(1, 'Geometry');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
