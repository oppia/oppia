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
const LAST_CARD_CONTENT: string =
  'Congratulations! You have completed the lesson.';
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
    'should draft an exploration with image interaction, add feedback and hints, and publish it successfully',
    async function () {
      // Step 1: Start creating the exploration.
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorPage();
      await explorationEditor.dismissWelcomeModal();

      // Step 2: Add content and interaction to the first card.
      await explorationEditor.updateCardContent(INTRODUCTION_CARD_CONTENT);
      await explorationEditor.addImageInteraction();
      await explorationEditor.editDefaultResponseFeedback(DEFAULT_FEEDBACK);
      await explorationEditor.addHintToState(HINT_TEXT);
      await explorationEditor.viewOppiaResponses();
      await explorationEditor.directLearnersToNewCard(CARD_NAME.LAST_CARD);
      await explorationEditor.saveExplorationDraft();

      // Step 3: Add final card with End Exploration interaction.
      await explorationEditor.navigateToCard(CARD_NAME.LAST_CARD);
      await explorationEditor.updateCardContent(LAST_CARD_CONTENT);
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
      await explorationEditor.saveExplorationDraft();

      // Step 4: Publish the exploration.
      explorationId = await explorationEditor.publishExplorationWithMetadata(
        'Publish with an interaction',
        'This is the goal of exploration.',
        'Algebra'
      );

      if (!explorationId) {
        throw new Error('Exploration failed to publish.');
      }

      // Step 5: Validate the published exploration is publicly accessible.
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
