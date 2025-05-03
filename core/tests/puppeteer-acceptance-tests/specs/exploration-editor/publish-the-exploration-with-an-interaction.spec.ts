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
 * @fileoverview Acceptance Test for publishing an exploration with an interaction.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

const INTRODUCTION_CARD_CONTENT: string = 'Test Question';
const LAST_CARD_CONTENT: string = 'Congratulations! You have completed the lesson.';
const DEFAULT_FEEDBACK: string = 'Wrong.';
const HINT_TEXT: string = 'Initial coordinate.';

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  IMAGE_CLICK_INPUT = 'Image Click Input',
  END_EXPLORATION = 'End Exploration',
}

enum CARD_NAME {
  INTRODUCTION = 'Introduction Card',
  LAST_CARD = 'Last Card',
}

describe('Exploration Creator', function () {
  let explorationEditor: ExplorationEditor;
  let explorationVisitor: LoggedInUser;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    explorationVisitor = await UserFactory.createNewUser(
      'explorationVisitor',
      'exploration_visitor@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should draft, discard and publish the changes',
    async function () {
      // Step 1: Create and setup new exploration.
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorPage();
      await explorationEditor.dismissWelcomeModal();
      await explorationEditor.updateCardContent(INTRODUCTION_CARD_CONTENT);

      // Step 2: Add an image interaction with feedback and hint.
      await explorationEditor.addImageInteraction();
      await explorationEditor.editDefaultResponseFeedback(DEFAULT_FEEDBACK);
      await explorationEditor.addHintToState(HINT_TEXT);

      // Step 3: Save draft.
      await explorationEditor.saveExplorationDraft();

      // Step 4: Create a second card to ensure proper navigation.
      await explorationEditor.directLearnersToNewCard(CARD_NAME.LAST_CARD);
      await explorationEditor.navigateToCard(CARD_NAME.LAST_CARD);

      // Step 5: Add End Exploration interaction on the new card.
      await explorationEditor.updateCardContent(LAST_CARD_CONTENT);
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

      // Step 6: Save final draft.
      await explorationEditor.saveExplorationDraft();

      // Step 7: Publish the exploration.
      explorationId = await explorationEditor.publishExplorationWithMetadata(
        'Publish with an interaction',
        'This is the goal of exploration.',
        'Algebra'
      );

      // Step 8: Verify published exploration is accessible by another user.
      await explorationVisitor.expectExplorationToBeAccessibleByUrl(
        explorationId
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
