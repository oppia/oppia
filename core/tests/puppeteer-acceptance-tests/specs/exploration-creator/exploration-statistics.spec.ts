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
 * EC. Stats.
 */

import {showMessage} from '../../utilities/common/show-message';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';

const CARD_NAME = {
  INTRODUCTION: 'Introduction',
  FINAL_CARD: 'End',
} as const;

const CARD_CONTENT = {
  INTRODUCTION: 'What is the sign to represent negative numbers called?',
  FINAL_CARD: 'We have practiced negative numbers.',
} as const;

describe('Exploration Stats', function () {
  let creator: ExplorationEditor;
  let explorationId: string;

  beforeAll(async function () {
    creator = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await creator.navigateToCreatorDashboardPage();
    await creator.navigateToExplorationEditorFromCreatorDashboard();
    await creator.dismissWelcomeModal();
    await creator.updateCardContent(CARD_CONTENT.INTRODUCTION);
    await creator.addTextInputInteraction();
    await creator.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'minus',
      'Correct!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await creator.editDefaultResponseFeedbackInExplorationEditorPage('Wrong.');
    await creator.navigateToCard(CARD_NAME.FINAL_CARD);
    await creator.updateCardContent(CARD_CONTENT.FINAL_CARD);
    await creator.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await creator.saveExplorationDraft();

    explorationId = await creator.publishExplorationWithMetadata(
      'Number Input',
      'Learn how to input numbers.',
      'Algebra'
    );

    if (!explorationId) {
      throw new Error('Failed to publish the exploration');
    } else {
      showMessage('Ready to gather statistics!');
    }
  });

  it('should collect after learner aces the exploration', async function () {
    const learnerOne = await UserFactory.createNewUser(
      'learnerOne',
      'learner_one@example.com'
    );
    await learnerOne.playExploration(explorationId);
    await learnerOne.submitAnswerInTextArea('minus');
    await learnerOne.expectResponseFeedbackToBe('Correct!');
    await learnerOne.continueToNextCard();
    await learnerOne.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );
    await learnerOne.returnToLibraryFromExplorationCompletion();
  });

  it('should collect after learner enters wrong answers', async function () {
    const learnerTwo = await UserFactory.createNewUser(
      'learnerTwo',
      'learner_two@example.com'
    );
    await learnerTwo.playExploration(explorationId);
    await learnerTwo.submitAnswerInTextArea('plus');
    await learnerTwo.expectResponseFeedbackToBe('Wrong.');
    await learnerTwo.submitAnswerInTextArea('minus');
    await learnerTwo.expectResponseFeedbackToBe('Correct!');
    await learnerTwo.continueToNextCard();
    await learnerTwo.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );
    await learnerTwo.returnToLibraryFromExplorationCompletion();
  });

  it('should present correct stats to creator', async function () {
    await creator.reloadPage();
    await creator.navigateToStatsTab();

    await creator.openCardStats(CARD_NAME.INTRODUCTION);
    await creator.expectCardEnteredTimesToBe(2);
    await creator.closeCardStats();

    await creator.openCardStats(CARD_NAME.FINAL_CARD);
    await creator.expectCardEnteredTimesToBe(2);
    await creator.closeCardStats();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
