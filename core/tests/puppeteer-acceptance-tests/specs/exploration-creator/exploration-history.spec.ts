// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * EC. History.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(
    async function () {
      explorationEditor = await UserFactory.createNewUser(
        'explorationEditor',
        'exploration_editor@example.com'
      );

      await explorationEditor.navigateToCreatorDashboardPageInExplorationEditor();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModalInExplorationEditor();

      await explorationEditor.updateCardContentInExplorationEditor(
        'Introduction to Fractions'
      );
      await explorationEditor.addInteractionInExplorationEditor(
        'Continue Button'
      );
      await explorationEditor.viewOppiaResponses();
      await explorationEditor.directLearnersToNewCard('Second Card');
      await explorationEditor.saveExplorationDraftInExplorationEditor();

      await explorationEditor.navigateToCard('Second Card');
      await explorationEditor.updateCardContentInExplorationEditor(
        'Thanks for playing!'
      );
      await explorationEditor.addInteractionInExplorationEditor(
        'End Exploration'
      );
      await explorationEditor.saveExplorationDraftInExplorationEditor();

      for (let i = 0; i < 15; i++) {
        await explorationEditor.updateCardContentInExplorationEditor(
          `Thanks for playing! ${i}`
        );
        await explorationEditor.saveExplorationDraftInExplorationEditor();
      }
    },
    // Test takes more time than default timeout.
    600000
  );

  it('should be able to view the history tab', async function () {
    await explorationEditor.navigateToHistoryTab();

    await explorationEditor.searchUserInHistoryTab('guestUser1');
    await explorationEditor.expectNumberOfHistoryItemsToBe(0);

    await explorationEditor.searchUserInHistoryTab('');
    await explorationEditor.expectNumberOfHistoryItemsToBe(10);

    await explorationEditor.changePaginationInHistoryTabTo(15);
    await explorationEditor.expectNumberOfHistoryItemsToBe(15);

    await explorationEditor.changePaginationInHistoryTabTo(10);
    await explorationEditor.expectNumberOfHistoryItemsToBe(10);

    await explorationEditor.changePaginationInHistoryTabTo(15);
    await explorationEditor.expectNumberOfHistoryItemsToBe(15);
  });

  it('should be able to compare versions of an exploration', async function () {
    await explorationEditor.compareExplorationVersionsInHistoryTab('1', '5');
    await explorationEditor.expectGraphDifferencesToBeVisible();
    await explorationEditor.resetGraphDifferenceInHistoryTab();
  });

  it('should be able to revert to a previous version of an exploration', async function () {
    // Check if exploration version date is properly formatted.
    await explorationEditor.expectExplorationHistoryDateHasProperFormat();

    // Revert exploration to an older version.
    await explorationEditor.revertExplorationToVersion('10');
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard('Second Card');
    await explorationEditor.expectCardContentToBe('Thanks for playing! 6');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
