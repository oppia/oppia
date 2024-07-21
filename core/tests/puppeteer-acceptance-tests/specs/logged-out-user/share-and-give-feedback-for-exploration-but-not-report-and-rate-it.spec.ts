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
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

const EXPLORATION_ATTRIBUTION_HTML = explorationId =>
  `<a href="http://localhost:8181/explore/${explorationId}#">Oppia</a> // <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY SA 4.0</a>`;
const EXPLORATION_ATTRIBUTION_PRINT =
  '"Algebra Basics" by curriculumAdm. Oppia. http://localhost:8181/explore/csF0uHZ4zEp0#';

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
      await loggedOutUser.navigateToCommunityLibraryPage();

      await loggedOutUser.searchForLessonInSearchBar('Algebra I');
      await loggedOutUser.selectLessonInSearchResults('Algebra I');

      await loggedOutUser.continueToNextCard();

      // Giving feedback before completing the exploration.
      await loggedOutUser.giveFeedback('This state is very informative!');
      await loggedOutUser.submitAnswer('-40');
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      //  A dialog should appear when the user tries to hit the browser back button informing them that they will lose progress if they go back.
      await loggedOutUser.hitBrowserBackButtonAndHandleDialog(true);

      await loggedOutUser.generateAttribution();
      await loggedOutUser.expectAttributionInHtmlSectionToBe(
        EXPLORATION_ATTRIBUTION_HTML(explorationId)
      );
      await loggedOutUser.expectAttributionInPrintToBe(
        EXPLORATION_ATTRIBUTION_PRINT
      );

      await loggedOutUser.shareExploration('Facebook');
      await loggedOutUser.shareExploration('Twitter');
      ('');

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
