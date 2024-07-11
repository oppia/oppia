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

import {showMessage} from '../../utilities/common/show-message';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

const INTRODUCTION_CARD_CONTENT: string =
  'This exploration is for publishing an exploration with an interaction.';

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  FINAL_CARD = 'Final Card',
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
    showMessage('explorationEditor has signed up successfully.');

    explorationVisitor = await UserFactory.createNewUser(
      'explorationVisitor',
      'exploration_visitor@example.com'
    );
    showMessage('explorationVisitor has signed up successfully.');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should draft, discard and publish the changes',
    async function () {
      // Navigate to the creator dashboard and create a new exploration.
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorPage();
      await explorationEditor.dismissWelcomeModal();
      await explorationEditor.updateCardContent(INTRODUCTION_CARD_CONTENT);
      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

      // Add a new card with an end interaction.
      await explorationEditor.viewOppiaResponses();
      await explorationEditor.directLearnersToNewCard(CARD_NAME.FINAL_CARD);
      await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
      await explorationEditor.updateCardContent('It is final card');
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

      await explorationEditor.saveExplorationDraft();

      explorationId = await explorationEditor.publishExplorationWithMetadata(
        'Publish with an interaction',
        'This is the goal of exploration.',
        'Algebra'
      );

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
