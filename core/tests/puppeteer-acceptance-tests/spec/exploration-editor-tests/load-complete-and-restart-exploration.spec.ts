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

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = ' Continue Button ',
  NUMERIC_INPUT = ' Number Input ',
  END_EXPLORATION = ' End Exploration ',
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
      await explorationEditor.navigateToCreatorDashboard();
      await explorationEditor.createExploration();
      await explorationEditor.updateCardContent(
        'Test exploration to question negative numbers'
      );
      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

      // The following block of code adds a new card to the exploration that contains a question.
      await explorationEditor.navigateToOppiaResponses();
      await explorationEditor.oppiaDirectlearnersTo();
      await explorationEditor.nameTheNewCard();
      await explorationEditor.navigateToCard('Question Card ');
      await explorationEditor.updateCardContent(
        'mention a negative number greater than -100.'
      );
      await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
      await explorationEditor.addResponseToTheInteraction('-45');

      // The following block adds the final card with an ‘End’ interaction to conclude the exploration.
      await explorationEditor.oppiaDirectlearnersTo();
      await explorationEditor.nameTheNewCard();
      await explorationEditor.navigateToCard('Last Card ');
      await explorationEditor.updateCardContent('');
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

      await explorationEditor.navigateToCard('');
      await explorationEditor.saveExplorationDraft();

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectTheExplorationToStartFromIntroductionCard(
        'Exploration begins'
      );

      await explorationEditor.completeTheExplorationInPreviewTab();
      await explorationEditor.expectTheExplorationToComplete();
      await explorationEditor.restartExploration();
      await explorationEditor.expectTheExplorationToRestart(
        'Exploration begins'
      );
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
