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
 * CL.LP. Learner visits the community library and looks around.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
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
    await explorationEditor.createAndPublishExplorationWithCards(
      'Algebra',
      'Mathematics'
    );
    await explorationEditor.createAndPublishExplorationWithCards(
      'Laws of Motion',
      'Science'
    );
  });

  it('should be able to discover the community library', async function () {
    await loggedOutLearner.navigateToCommunityLibraryOnNavbar();
    await loggedOutLearner.expectCommunityLibraryHeadingToBePresent(
      'Imagine what you could learn today...'
    );
  });

  it('should be able to look at different categories in community library', async function () {
    // Check for the lesson categories.
    await loggedOutLearner.expectCommunityLibraryGroupHeaderToContain([
      'Mathematics & Statistics',
    ]);

    await loggedOutLearner.expectSearchResultsToContain([
      'Fractions',
      'Algebra',
    ]);
    await loggedOutLearner.filterLessonsByCategories(['Science']);
    await loggedOutLearner.expectSearchResultsToContain(
      ['Fractions', 'Algebra'],
      false
    );
    await loggedOutLearner.expectSearchResultsToContain(['Laws of Motion']);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
