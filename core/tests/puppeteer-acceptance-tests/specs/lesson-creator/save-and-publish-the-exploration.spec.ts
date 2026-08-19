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
 * LC.5. Save and publish the exploration.
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
    'should discard the draft exploration',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();

      await explorationEditor.updateCardContent('Old content');
      await explorationEditor.saveExplorationDraft('First edit');

      await explorationEditor.updateCardContent('New Content');
      await explorationEditor.discardCurrentChanges();
      await explorationEditor.expectCardContentToBe('Old content');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should change the first card of the exploration',
    async function () {
      await explorationEditor.updateStateName('First');
      await explorationEditor.saveExplorationDraft('Renamed initial card');

      await explorationEditor.expectStateNameToBe('First');

      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await explorationEditor.viewOppiaResponses();
      await explorationEditor.directLearnersToNewCard('Second');
      await explorationEditor.expectCurrentOutcomeDestinationToBe('Second');

      await explorationEditor.navigateToCard('Second');
      await explorationEditor.updateCardContent('This is the second card.');

      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await explorationEditor.viewOppiaResponses();
      await explorationEditor.directLearnersToNewCard('Final');
      await explorationEditor.expectCurrentOutcomeDestinationToBe('Final');

      await explorationEditor.expectExplorationGraphToContainCard('Final');

      await explorationEditor.navigateToCard('Final');
      await explorationEditor.updateCardContent('Final Card');
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

      await explorationEditor.saveExplorationDraft(
        'Created Second and Final cards'
      );

      await explorationEditor.expectExplorationGraphToContainCard('First');
      await explorationEditor.expectExplorationGraphToContainCard('Second');
      await explorationEditor.expectExplorationGraphToContainCard('Final');
      await explorationEditor.navigateToSettingsTab();
      await explorationEditor.selectFirstCard('Second');
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectPreviewCardContentToBe(
        'Second',
        'This is the second card.'
      );
    },
    10 * 60 * 1000 // Test takes longer than 5 minutes.
  );

  it(
    'should remove an existing state',
    async function () {
      await explorationEditor.navigateToEditorTab();

      await explorationEditor.deleteState('First');
      await explorationEditor.saveExplorationDraft();
      await explorationEditor.expectExplorationGraphToNotContainCard('First');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
