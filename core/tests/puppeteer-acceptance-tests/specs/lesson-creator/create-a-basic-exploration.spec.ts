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
 * LC.1. Create a basic exploration.
 */
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
describe('Lesson Creator', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'ExpEditor1',
      'expeditor1@example.com'
    );
  });

  it(
    'should create a new exploration',
    async function () {
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();
      await explorationEditor.expectToBeInCreatorDashboard();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should generate warning message if card height limit is exceeded',
    async function () {
      await explorationEditor.updateStateName('1 - Intro');
      await explorationEditor.saveExplorationDraft('Renamed initial card');

      await explorationEditor.expectStateNameToBe('1 - Intro');
      await explorationEditor.expectExplorationGraphToContainCard('1 - Intro');

      const questionText = 'What is the capital of France?';
      await explorationEditor.updateCardContent(questionText);
      await explorationEditor.expectCardContentToBe(questionText);

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectPreviewCardContentToBe(
        '1 - Intro',
        questionText
      );

      await explorationEditor.navigateToEditorTab();
      await explorationEditor.expectCardContentToBe(questionText);

      const longContent = Array.from(
        {length: 15},
        (_, i) => `Line ${i + 1}`
      ).join('\n');

      await explorationEditor.updateCardContent(longContent);

      await explorationEditor.expectCardHeightLimitWarningToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show warning when there are 50 unsaved changes',
    async function () {
      await explorationEditor.saveExplorationDraft();

      for (let i = 1; i <= 50; i++) {
        await explorationEditor.updateCardContent(`Content ${i}`);
      }

      await explorationEditor.expectSaveRecommendationModalToBeVisible();
      await explorationEditor.saveExplorationDraftFromSaveRecommendationModal();
      await explorationEditor.expectSaveDraftButtonToBeDisabled(true);
    },
    50 * 60 * 1000 // Test takes longer that 35 minutes.
  );

  it(
    'should add a Continue Button interaction',
    // Functionality has issues with continue button
    // doesnt align with what the WIP doc states
    // there is no feedback text for continue
    async function () {},
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should add a multiple-choice interaction',
    async function () {
      await explorationEditor.updateCardContent(
        'Which of these texts is bold?'
      );

      await explorationEditor.addMultipleChoiceInteraction([
        'Italic text',
        'Bold text',
      ]);

      // Add correct response. isLastResponse=false so modal stays open
      // and we can add the default response next without reopening.
      await explorationEditor.addResponsesToTheInteraction(
        INTERACTION_TYPES.MULTIPLE_CHOICE,
        'Bold text',
        'Correct!',
        'Text Input - 3',
        true,
        false // keep modal open
      );

      // Now still inside the modal, add the default (wrong) response.
      await explorationEditor.addResponseDetailsInResponseModal(
        'Try again!',
        '1 - Intro',
        false,
        true // isLastResponse=true closes modal
      );

      await explorationEditor.saveExplorationDraft(
        'Added multiple choice card'
      );
      await explorationEditor.expectExplorationGraphToContainCard(
        'Text Input - 3'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should add a Text Input interaction with hints and a solution',
    async function () {
      await explorationEditor.navigateToCard('Text Input - 3');
      await explorationEditor.updateCardContent(
        'Type the word "bold" in the box below.'
      );

      // addTextInputInteraction opens modal and saves with no customization.
      await explorationEditor.addTextInputInteraction();

      // Now add the response with feedback and destination.
      await explorationEditor.addResponsesToTheInteraction(
        INTERACTION_TYPES.TEXT_INPUT,
        'bold',
        'Correct!',
        'End - 4',
        true,
        true
      );

      await explorationEditor.addHintToState(
        'Bold text means the text is heavier'
      );

      await explorationEditor.addSolutionToState(
        'bold',
        'The answer is the word bold',
        false
      );

      await explorationEditor.saveExplorationDraft('Added text input card');
      await explorationEditor.expectExplorationGraphToContainCard('End - 4');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should add an EndExploration interaction',
    async function () {
      await explorationEditor.navigateToCard('End - 4');
      await explorationEditor.updateCardContent(
        'You have completed the exploration!'
      );
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

      await explorationEditor.saveExplorationDraft(
        'Added end exploration card'
      );

      await explorationEditor.expectSaveDraftButtonToBeDisabled(true);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
