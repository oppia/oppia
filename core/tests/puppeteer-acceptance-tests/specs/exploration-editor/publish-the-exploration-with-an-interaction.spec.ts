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

enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
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
      // Navigate to the creator dashboard and create a new exploration.
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorPage();
      await explorationEditor.dismissWelcomeModal();
      await explorationEditor.updateCardContent(INTRODUCTION_CARD_CONTENT);
      await explorationEditor.addImageInteraction();
      await explorationEditor.editDefaultResponseFeedback('Wrong.');
      await explorationEditor.addHintToState('Initial coordinate');
      await explorationEditor.saveExplorationDraft();

      // Add a new card with an end interaction.
      await explorationEditor.navigateToCard(CARD_NAME.LAST_CARD);
      await explorationEditor.updateCardContent('Congratulations!');
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
