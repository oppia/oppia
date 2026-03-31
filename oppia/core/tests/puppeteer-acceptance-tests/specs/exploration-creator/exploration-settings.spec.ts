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
 * EC. Settings.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    // Create guest users.
    const guestUser1 = await UserFactory.createNewUser(
      'guestUser1',
      'guest_user1@example.com'
    );
    await guestUser1.closeBrowser();

    const guestUser2 = await UserFactory.createNewUser(
      'guestUser2',
      'guest_user2@example.com'
    );
    await guestUser2.closeBrowser();

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();

    await explorationEditor.updateCardContent('Introduction to Fractions');
    await explorationEditor.addInteraction('Continue Button');
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard('Second Card');
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.navigateToCard('Second Card');
    await explorationEditor.updateCardContent('Thanks for playing!');
    await explorationEditor.addInteraction('End Exploration');

    // Save the draft.
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to change basic settings', async function () {
    await explorationEditor.navigateToSettingsTab();
    await explorationEditor.openExplorationControlDropdown();

    await explorationEditor.updateTitleTo('A Simple Exploration');
    await explorationEditor.expectTitleToBe('A Simple Exploration');

    await explorationEditor.updateGoalTo('Goal Here');
    await explorationEditor.expectGoalToBe('Goal Here');
    await explorationEditor.expectGoalWarningToBeVisible();

    await explorationEditor.updateGoalTo('This is the long goal');
    await explorationEditor.expectGoalToBe('This is the long goal');

    await explorationEditor.selectCategory('Algebra');
    await explorationEditor.expectSelectedCategoryToBe('Algebra');

    await explorationEditor.selectLanguage('Arabic');
    await explorationEditor.expectSelectedLanguageToBe('Arabic');

    await explorationEditor.selectFirstCard('Second Card');
    await explorationEditor.expectSelectedFirstCardToBe('Second Card');

    await explorationEditor.addTags(['TagA', 'TagB', 'TagC']);
    await explorationEditor.expectTagsToMatch(['TagA', 'TagB', 'TagC']);

    await explorationEditor.previewSummary();
    await explorationEditor.expectModalTitleToBe('Preview Summary Card');
    await explorationEditor.closePreviewSummary();
  });

  it('should be able to change advanced settings', async function () {
    await explorationEditor.enableAutomaticTextToSpeech();
  });

  it('should be able to change roles settings', async function () {
    await explorationEditor.assignUserToCollaboratorRole('guestUser1');
    await explorationEditor.assignUserToPlaytesterRole('guestUser2');
  });

  it('should be able to change exploration control settings', async function () {
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.clickOnDeleteExplorationButton();
    await explorationEditor.isTextPresentOnPage('Delete Exploration');
    await explorationEditor.confirmDeleteExplorationButton();

    await explorationEditor.expectToBeInCreatorDashboard();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
