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
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/
 *
 * LC.9: Delete lesson creator's user profile.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

describe('Lesson Creator Profile Deletion', function () {
  let expEditor1!: ExplorationEditor & LoggedInUser;
  let expEditor2!: ExplorationEditor & LoggedInUser;
  let positiveNumbersExpId!: string;
  let negativeNumbersExpId!: string;
  let wholeNumbersExpId!: string;

  beforeAll(async function () {
    expEditor1 = await UserFactory.createNewUser(
      'expEditor1',
      'expEditor1@example.com'
    );
    expEditor2 = await UserFactory.createNewUser(
      'expEditor2',
      'expEditor2@example.com'
    );

    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    positiveNumbersExpId = await expEditor1.getExplorationId();
    await expEditor1.updateCardContent('Introduction to positive numbers');
    await expEditor1.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await expEditor1.saveExplorationDraft();
    await expEditor1.publishExplorationWithMetadata(
      'Positive Numbers',
      'This exploration teaches students about positive numbers and their properties.',
      'Mathematics'
    );

    await expEditor1.navigateToSettingsTab();
    await expEditor1.expectRolesFormToBeOpen();
    await expEditor1.assignUserToManagerRoleAfterFormOpen('expEditor2');
    await expEditor1.expectUserToBeExplorationManager('expEditor2');

    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    negativeNumbersExpId = await expEditor1.getExplorationId();
    await expEditor1.updateCardContent('Negative Numbers Intro');
    await expEditor1.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await expEditor1.saveExplorationDraft();
    await expEditor1.waitForPageToFullyLoad();
    await expEditor1.publishExplorationWithMetadata(
      'Negative Numbers',
      'This exploration teaches students about negative numbers and their applications.',
      'Mathematics'
    );

    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    wholeNumbersExpId = await expEditor1.getExplorationId();
    await expEditor1.updateCardContent('Draft that will be deleted.');
    await expEditor1.saveExplorationDraft();
  }, 600000);

  it('should handle exploration ownership correctly after account deletion', async function () {
    // 1. Account Deletion.
    await expEditor1.navigateToPreferencesPage();
    await expEditor1.deleteAccount();
    await expEditor1.confirmAccountDeletion('expEditor1');

    // 2. Verify ownership and access permissions as expEditor2.
    await expEditor2.navigateToExplorationEditor(wholeNumbersExpId);
    await expEditor2.expectErrorPage(404);
    await expEditor2.navigateToExplorationEditor(negativeNumbersExpId);
    await expEditor2.navigateToSettingsTab();
    await expEditor2.expectExplorationToBeCommunityOwned(
      'This exploration is public and community-editable. It is available in the Oppia library.'
    );
    await expEditor2.navigateToExplorationEditor(positiveNumbersExpId);
    await expEditor2.navigateToSettingsTab();
    await expEditor2.expectUserToBeExplorationManager('expEditor2');
  }, 600000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
