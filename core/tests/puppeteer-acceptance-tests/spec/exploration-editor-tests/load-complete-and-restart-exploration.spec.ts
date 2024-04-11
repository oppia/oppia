// Copyright 2023 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use explorationEditor file except in compliance with the License.
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
 * @fileoverview Acceptance Test for preview tab in exploration editor.
 */
import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import testConstants from '../../puppeteer-testing-utilities/test-constants';
import {ExplorationEditor} from '../../user-utilities/exploration-editor-utils';

const DEFAULT_SPEC_TIMEOUT: number = testConstants.DEFAULT_SPEC_TIMEOUT;
const INTRODUCTION_CARD_CONTENT: string =
  'Test exploration to question negative numbers';
const NEW_CARD: string = '/';
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = ' Continue Button ',
  NUMERIC_INPUT = ' Number Input ',
  END_EXPLORATION = ' End Exploration ',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  TEST_QUESTION = 'Test Question ',
  RECAP = 'Recap ',
}

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_creator@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should be able to load, complete and restart an exploration preview',
    async function () {
      // Navigate to the creator dashboard and create a new exploration.
      await explorationEditor.navigateToCreatorDashboard();
      await explorationEditor.createExploration();
      await explorationEditor.updateCardContent(INTRODUCTION_CARD_CONTENT);
      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

      // Add a new card with a question.
      await explorationEditor.viewOppiaResponses();
      await explorationEditor.oppiaDirectlearnersTo(NEW_CARD);
      await explorationEditor.nameNewCard('Test Question');
      await explorationEditor.saveExplorationDraft();

      // Navigate to the new card and update its content.
      await explorationEditor.navigateToCard(CARD_NAME.TEST_QUESTION);
      await explorationEditor.updateCardContent(
        'Enter a negative number greater than -100.'
      );
      await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
      await explorationEditor.addResponseToTheInteraction('-99');

      // Add a final card with an 'End' interaction.
      await explorationEditor.oppiaDirectlearnersTo(NEW_CARD);
      await explorationEditor.nameNewCard('Recap');
      await explorationEditor.saveExplorationDraft();

      // Navigate to the final card and update its content.
      await explorationEditor.navigateToCard(CARD_NAME.RECAP);
      await explorationEditor.updateCardContent(
        'We have practiced negative numbers.'
      );
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

      // Navigate back to the introduction card and save the draft.
      await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
      await explorationEditor.saveExplorationDraft();

      // Navigate to the preview tab and check the content of the first card.
      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectCardContentToBe(INTRODUCTION_CARD_CONTENT);

      // Continue to the next card, enter an answer, and submit it.
      await explorationEditor.continueToNextCard();
      await explorationEditor.enterAnswer('-40');
      await explorationEditor.submitAnswer();
      await explorationEditor.continueToNextCard();

      // Check the completion message and restart the exploration.
      await explorationEditor.expectPreviewCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );
      await explorationEditor.restartPreview();
      await explorationEditor.expectCardContentToBe(INTRODUCTION_CARD_CONTENT);
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
