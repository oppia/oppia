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
 * @fileoverview Acceptance test to cover learner journey for an exploration that includes sharing of the exploration, generation of attribution, giving feedback, and not be able to report or rate the exploration
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {showMessage} from '../../utilities/common/show-message';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

const EXPLORATION_ATTRIBUTION_HTML = (explorationId: string | null) =>
  `<a href="http://localhost:8181/explore/${explorationId}#">Oppia</a> // <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY SA 4.0</a>`;
const EXPLORATION_ATTRIBUTION_PRINT =
  '"Algebra Basics" by explorationEditor. Oppia. http://localhost:8181/explore/';

const EXPECTED_EMBED_URL = (explorationId: string | null) =>
  `<iframe src="http://localhost:8181/embed/exploration/${explorationId}" width="700" height="1000">`;

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  ALGEBRA_BASICS = 'Algebra Basics',
  FINAL_CARD = 'Final Card',
}

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping the test and make the test to run in mobile viewport as well.
    // see: https://github.com/oppia/oppia/issues/19443
    if (process.env.MOBILE === 'true') {
      showMessage('Test skipped in mobile viewport');
      return;
    }
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent('Introduction to Algebra');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.ALGEBRA_BASICS);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.ALGEBRA_BASICS);
    await explorationEditor.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-99',
      'Perfect!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong, try again!');

    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Algebra Basics',
      'Learn the basics of Algebra',
      'Algorithms'
    );

    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to generate attribution, share the exploration, give feedback, and not be able to report or rate the exploration',
    async function () {
      // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
      // in mobile viewport which is required for testing the feedback messages tab),
      // remove this part of skipping the test and make the test to run in mobile viewport as well.
      // Also, attribution cannot be generated in mobile devices, so keep that part skipped in mobile
      // tests.
      // see: https://github.com/oppia/oppia/issues/19443
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }
      await loggedOutUser.navigateToCommunityLibraryPage();
      await loggedOutUser.searchForLessonInSearchBar('Algebra Basics');
      await loggedOutUser.playLessonFromSearchResults('Algebra Basics');
      await loggedOutUser.continueToNextCard();

      // Giving feedback before completing the exploration on a state.
      await loggedOutUser.giveFeedback('This state is very informative!');
      await loggedOutUser.submitAnswer('-40');
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedOutUser.generateAttribution();
      await loggedOutUser.expectAttributionInHtmlSectionToBe(
        EXPLORATION_ATTRIBUTION_HTML(explorationId)
      );
      await loggedOutUser.expectAttributionInPrintToBe(
        EXPLORATION_ATTRIBUTION_PRINT
      );
      await loggedOutUser.closeAttributionModal();
      await loggedOutUser.shareExploration('Facebook', explorationId);
      await loggedOutUser.shareExploration('Twitter', explorationId);
      await loggedOutUser.shareExploration('Classroom', explorationId);

      await loggedOutUser.embedThisLesson(EXPECTED_EMBED_URL(explorationId));

      // Giving feedback after completing the exploration.
      await loggedOutUser.giveFeedback('This is a great lesson!');
      await loggedOutUser.expectReportOptionsNotAvailable();
      await loggedOutUser.expectRateOptionsNotAvailable();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
