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
 * EC.EE. Preview Math interactions.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const CARD_NAMES = {
  FIRST: 'Introduction',
  SECOND: '2nd Card',
  THIRD: '3rd Card',
  FOURTH: '4th Card',
  FIFTH: '5th Card',
  SIXTH: '6th Card',
  SEVENTH: '7th Card',
  EIGHTH: '8th Card',
  NINTH: '9th Card',
};

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal(true);
  });

  it('should be able to preview "Fraction Input" interaction', async function () {
    // Add Fraction Input Interaction.
    await explorationEditor.updateCardContent('Enter a fraction: 1/2.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '2',
      'Perfect!',
      CARD_NAMES.SECOND,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState('The hint is 1/2');
    await explorationEditor.addSolutionToState(
      '1/2',
      'As given in the question.',
      true
    );
    await explorationEditor.saveExplorationDraft();

    // Submit a wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitAnswerInInputField('1/3');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit a blank answer.
    await explorationEditor.submitAnswerInInputField('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter a valid fraction (e.g., 5/3 or 1 2/3)'
    );
    // Submit answer with invalid characters.
    await explorationEditor.submitAnswerInInputField('1/2a');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please only use numerical digits, spaces or forward slashes (/)'
    );
    // View Hint.
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain('The hint is 1/2');
      await explorationEditor.closeHintModal();
    }
    // Submit correct answer.
    await explorationEditor.submitAnswerInInputField('1/2');
    await explorationEditor.expectResponseFeedbackToBe('Perfect!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SECOND);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
