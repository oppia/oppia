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
 * EC.EE. Preview rarely used interactions.
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
    await explorationEditor.dismissWelcomeModal();
  });

  it('should be able to preview "Code Editor" interaction', async function () {
    // Add a code editor interaction.
    await explorationEditor.updateCardContent('Enter a code editor.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CODE_EDITOR);
    await explorationEditor.updateCodeEditorLearnerAnswerInResponseModal(
      'has code that contains',
      'print("Hello, Oppia!")'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.SECOND,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState(
      'The hint is print("Hello, Oppia!")'
    );
    // Add solution.
    await explorationEditor.addCodeEditorSolutionToState(
      'print("Hello, Oppia!")',
      'As given in the question.'
    );
    await explorationEditor.saveExplorationDraft();

    // Submit wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitCodeEditorAnswer('print("Hello!")');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Check code output.
    await explorationEditor.expectCodeOutputToBe('Hello!');
    // View Hint.
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'The hint is print("Hello, Oppia!")'
      );
      await explorationEditor.closeHintModal();
    }
    // Submit correct answer.
    await explorationEditor.submitCodeEditorAnswer('print("Hello, Oppia!")');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SECOND);
  });

  it('should be able to preview "Music Notes Input" interaction', async function () {
    // Add a music notes input interaction.
    await explorationEditor.updateCardContent('Enter a music notes input.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.MUSIC_NOTES_INPUT);
    await explorationEditor.updateMusicNotesInputLearnerAnswerInResponseModal(
      'is equal to',
      ['C4', 'E4', 'G4']
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.THIRD,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    // Add solution.
    await explorationEditor.addHintToState('Only answer C4');
    await explorationEditor.addMusicNotesInputSolutionToState(
      ['C4', 'E4', 'G4'],
      'as given in the question.'
    );
    await explorationEditor.expectToolTipMessage(
      'The current solution does not lead to another card.'
    );
    await explorationEditor.saveExplorationDraft();

    // Submit wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitMusicNotesInputAnswer(['C4', 'E4', 'G4']);
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain('Only answer C4');
      await explorationEditor.closeHintModal();
    }
    // TODO(#22998): The correct answer automatically changes to ['C4'].
    // And even using C4 as awswer throws wrong answer feedback.

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.THIRD);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
