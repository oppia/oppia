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
 * @fileoverview Acceptance test to cover the CUJ that includes changing site language, verifying
 * translations, and interacting with an exploration in its original language.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const CONCEPT_CARD_CONTENT_EN = 'Numbers can be positive, negative, or zero.';
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  CONCEPT_CARD = 'Concept Card',
  FINAL_CARD = 'Final Card',
}

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'We will be learning numbers today.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with concept content.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.CONCEPT_CARD);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and add concept content.
    await explorationEditor.navigateToCard(CARD_NAME.CONCEPT_CARD);
    await explorationEditor.updateCardContent(CONCEPT_CARD_CONTENT_EN);
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'We have learnt positive numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.publishExplorationWithMetadata(
      'Positive Numbers',
      'Learn positive numbers.',
      'Algebra'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to change the site language, check translation, navigate through pages, and engage with the exploration in its original language.',
    async function () {
      // Changing site language to hindi.
      await loggedOutUser.changeSiteLanguage('hi');

      // Check the navbar to confirm that it is translated correctly.
      await loggedOutUser.expectNavbarButtonsToHaveText([
        'परिचय',
        'बुनियादी गणित',
        'जानिए',
      ]);

      // Confirm that the translation happened correctly.
      await loggedOutUser.expectPageLanguageToMatch('hi');

      await loggedOutUser.navigateToCommunityLibraryPage();
      await loggedOutUser.expectPageLanguageToMatch('hi');

      await loggedOutUser.searchForLessonInSearchBar('Positive Numbers');
      await loggedOutUser.playLessonFromSearchResults('Positive Numbers');
      await loggedOutUser.continueToNextCard();

      // Check if the content of the card is in the original language (en).
      await loggedOutUser.expectCardContentToMatch(CONCEPT_CARD_CONTENT_EN);

      await loggedOutUser.continueToNextCard();
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'इस पाठ को पूरा करने के लिए बधाई! अब आप अगली बार जब वापस आएंगे तो पाठ को शुरू से ' +
          'शुरू करेंगे।'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
