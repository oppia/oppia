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
 * LC.11. Modify an existing interaction.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

describe('Lesson Creator', function () {
  let expEditor1: ExplorationEditor & LoggedInUser;
  let expEditor2: ExplorationEditor & LoggedInUser;
  let explorationId: string;

  beforeAll(async function () {
    expEditor1 = await UserFactory.createNewUser(
      'ExpEditor1',
      'expeditor1@example.com'
    );
    expEditor2 = await UserFactory.createNewUser(
      'ExpEditor2',
      'expeditor2@example.com'
    );

    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    await expEditor1.dismissWelcomeModal();

    await expEditor1.updateCardContent('Introduction to Mathematics');
    await expEditor1.addMultipleChoiceInteraction([
      'Option 1',
      'Option 2',
      'Correct Response',
      'Option 4',
    ]);
    await expEditor1.updateMultipleChoiceLearnersAnswerInResponseModal(
      'is equal to',
      'Correct Response'
    );
    await expEditor1.addResponseDetailsInResponseModal(
      'Okay',
      'End',
      true,
      true
    );
    await expEditor1.editDefaultResponseFeedbackInExplorationEditorPage(
      'Please try again.'
    );

    await expEditor1.navigateToCard('End');
    await expEditor1.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    await expEditor1.saveExplorationDraft();

    explorationId = await expEditor1.publishExplorationWithMetadata(
      'LC.11 Test Exploration',
      'Testing conflicting changes',
      'Algebra'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });

  it(
    'should restrict editing for read-only users and handle overwritten/conflicting draft changes',
    async function () {
      await expEditor2.navigateToExplorationEditor(explorationId);

      // Read-only exploration access (expEditor2 should NOT be able to edit).
      await expEditor2.expectEditCardContentPencilButtonToBeVisible(false);

      await expEditor1.navigateToSettingsTab();
      await expEditor1.assignUserToManagerRole('ExpEditor2');
      await expEditor1.navigateToEditorTab();

      await expEditor2.reloadPage();
      await expEditor2.navigateToEditorTab();

      await expEditor2.expectEditCardContentPencilButtonToBeVisible(true);

      await expEditor1.navigateToCard('Introduction');
      await expEditor1.updateCardContent('Introduction to Mathematics');

      await expEditor2.navigateToCard('Introduction');
      await expEditor2.updateCardContent('Intro to Mathematics (Part 1)');
      await expEditor2.saveExplorationDraft('Updated by expEditor2');

      // Draft overwritten scenario (expEditor1 has autosaved changes,
      // expEditor2 saves draft -> expEditor1 should see Lost Changes modal).
      await expEditor1.navigateToExplorationEditor(explorationId);
      await expEditor1.expectLostChangesModalToBeVisible(true);

      await expEditor1.discardLostChanges();

      await expEditor1.expectLostChangesModalToBeVisible(false);

      await expEditor1.waitForPageToFullyLoad();

      await expEditor1.navigateToCard('Introduction');
      await expEditor1.updateCardContent('Created by expEditor1');
      await expEditor1.saveExplorationDraft('Editor 1');

      await expEditor2.navigateToCard('Introduction');
      await expEditor2.updateCardContent('Created by expEditor2');

      // Conflicting changes scenario (expEditor2 edits on stale version,
      // sees Lost Changes modal, exports and discards lost changes and downloads file.)
      await expEditor2.waitForPageToFullyLoad();
      await expEditor2.exportAndDiscardLostChanges();

      await expEditor2.waitForPageToFullyLoad();
      await expEditor2.navigateToCard('Introduction');
      await expEditor2.expectCardContentToBe('Created by expEditor1');

      await expEditor2.updateCardContent(
        'Created by expEditor1 and expEditor2'
      );
      await expEditor2.saveExplorationDraft('Updated by expEditor2');

      // Non-conflicting update scenario (expEditor2 saves changes,
      // expEditor1 should NOT see Lost Changes modal and can rename the state).
      await expEditor1.navigateToExplorationEditor(explorationId);
      await expEditor1.waitForPageToFullyLoad();
      await expEditor1.navigateToEditorTab();
      await expEditor1.navigateToCard('Introduction');

      await expEditor1.expectLostChangesModalToBeVisible(false);

      await expEditor1.updateStateName('First');

      await expEditor1.waitForPageToFullyLoad();
      await expEditor1.saveExplorationDraft();

      await expEditor1.expectLostChangesModalToBeVisible(false);
      await expEditor1.expectStateNameToBe('First');
      await expEditor1.expectExplorationGraphToContainCard('First');
    },
    10 * 60 * 1000
  );
});
