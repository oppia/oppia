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
      await explorationEditor.createExploration('Exploration begins');
      await explorationEditor.addAnInteractionToTheExploration(
        ' Continue Button '
      );

      // The following block of code adds a new card to the exploration that contains a question.
      await explorationEditor.addANewCardToTheExploration('Question Card');
      await explorationEditor.goToTheCard('Question Card ');
      await explorationEditor.addContentToTheCard(
        'mention a negative number greater than -100.'
      );
      await explorationEditor.addAnInteractionToTheCard(' Number Input ');
      await explorationEditor.addResponsesToTheInteraction('-45');

      // The following block adds the final card with an ‘End’ interaction to conclude the exploration.
      await explorationEditor.addANewCardToTheExploration('Last Card');
      await explorationEditor.goToTheCard('Last Card ');
      await explorationEditor.addContentToTheCard('Exploration ends here');
      await explorationEditor.addAnInteractionToTheCard(' End Exploration ');

      await explorationEditor.goToTheIntroductionCard(0);
      await explorationEditor.saveExplorationDraft();

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectTheExplorationToStartFromIntroductionCard(
        'Exploration begins'
      );

      await explorationEditor.completeTheExplorationInPreviewTab();
      await explorationEditor.expectTheExplorationToComplete();
      await explorationEditor.restartTheExploration();
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
