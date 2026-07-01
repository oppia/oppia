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
 * LI. Learner can report a lesson from the lesson player
 */

test.describe.configure({mode: 'serial'});

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe('Logged-In Learner', function () {
  // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
  // in mobile viewport which is required for testing the feedback messages tab),
  // remove this part of skipping the test and make the test to run in mobile viewport as well.
  // see: https://github.com/oppia/oppia/issues/19443
  test.skip(
    () => process.env.MOBILE === 'true',
    'Test skipped in mobile viewport'
  );

  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let explorationEditor: ExplorationEditor;
  let explorationId: string;

  test.beforeAll(async function ({browser}) {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent('Introduction to Algebra');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard('Algebra Basics');
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard('Algebra Basics');
    await explorationEditor.updateCardContent('Enter a negative number.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-1',
      'Perfect!',
      'Final Card',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong, try again!'
    );

    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard('Final Card');
    await explorationEditor.updateCardContent(
      'We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard('Introduction');
    await explorationEditor.saveExplorationDraft();
    explorationId =
      (await explorationEditor.publishExplorationWithMetadata(
        'Algebra Basics',
        'Learn the basics of Algebra',
        'Algorithms'
      )) ?? '';

    if (explorationId === '') {
      throw new Error('Error publishing exploration successfully.');
    }

    loggedInLearner = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com',
      browser
    );
  });

  test('should be able to report the lesson from the sidebar', async function () {
    // Navigate to a lesson.
    await loggedInLearner.navigateToCommunityLibraryPage();
    await loggedInLearner.searchForLessonInSearchBar('Algebra Basics');
    await loggedInLearner.playLessonFromSearchResults('Algebra Basics');
    await loggedInLearner.continueToNextCard();

    // Report Exploration.
    await loggedInLearner.reportExploration('It is an ad');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
