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
 * EC. Navigation Bar Header.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;
  let explorationId: string;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
  });

  it('should be able to save draft', async function () {
    await explorationEditor.updateCardContent('Hello, World!');
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    await explorationEditor.clickOnSaveDraftButton();
    await explorationEditor.expectSaveDraftModalTitleToBe('Save Draft');

    await explorationEditor.fillDescriptionInSaveDraftModal('First Commit!');
    await explorationEditor.clickOnSaveDraftButtonInSaveDraftModal();

    await explorationEditor.expectSaveDraftButtonToBeDisabled();

    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Exploration 1',
      'Goal of the the exploration is to test recommendations',
      'Algebra'
    );
  });

  it('should be able to publish an exploration', async function () {
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();

    await explorationEditor.updateCardContent('Hello, World!');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.END_EXPLORATION,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (End Exploration)'
    );

    await explorationEditor.customizeEndExplorationInteraction([explorationId]);
    await explorationEditor.clickOnSaveDraftButton();
    await explorationEditor.fillDescriptionInSaveDraftModal('First Commit!');
    await explorationEditor.clickOnSaveDraftButtonInSaveDraftModal();

    await explorationEditor.clickOnPublishExplorationButton();
    await explorationEditor.expectHeaderInPublishExplorationModalToBe(
      'Add Some Details'
    );
    await explorationEditor.fillExplorationMetadataDetails(
      'Exploration 2',
      'Goal of the the exploration is to test recommendations',
      'Algebra',
      'Ásụ̀sụ́ Ìgbò (Igbo)',
      ['algebra']
    );

    await explorationEditor.clickOnSaveChangesButtonInPublishModal();
    await explorationEditor.expectModalTitleToBe('Publish Exploration');
    await explorationEditor.expectModalContentToContain(
      "Congratulations, you're about to publish an exploration!"
    );

    await explorationEditor.clickOnPublishButtonInPublishModal();
    await explorationEditor.expectModalTitleToBe('Awesome!');
    await explorationEditor.expectModalContentToContain(
      "Now that you're a published Oppia teacher, you can share your creation."
    );

    // Verify the link.
    await explorationEditor.expectShareExplorationLinkToBeValid();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
