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
 * @fileoverview Acceptance test for LC.9: Delete lesson creator's user profile.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {showMessage} from '../../utilities/common/show-message';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Lesson Creator Profile Deletion', function () {
  let expEditor1!: ExplorationEditor & LoggedInUser;
  let expEditor2!: ExplorationEditor & LoggedInUser;

  beforeAll(async function () {
    expEditor1 = await UserFactory.createNewUser(
      'expEditor1',
      'expEditor1@example.com'
    );
    expEditor2 = await UserFactory.createNewUser(
      'expEditor2',
      'expEditor2@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should handle exploration ownership correctly after account deletion', async function () {
    // 1. Setup Exploration A: Published + Shared with expEditor2.
    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    const positiveNumbersExpId = await expEditor1.getExplorationId();

    await expEditor1.updateCardContent('Introduction to positive numbers');
    await expEditor1.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await expEditor1.saveExplorationDraft();
    await expEditor1.publishExplorationWithMetadataRobust(
      'Positive Numbers',
      'This exploration teaches students about positive numbers and their properties.',
      'Mathematics'
    );

    // 2. Roles Assignment. Ensure Settings is open and Roles form is visible.
    await expEditor1.ensureRolesFormIsOpen();

    await expEditor1.assignUserToManagerRoleAfterFormOpen('expEditor2');

    // 3. Setup Exploration B (Published) and Exploration C (Draft).
    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    const negativeNumbersExpId = await expEditor1.getExplorationId();
    await expEditor1.updateCardContent('Negative Numbers Intro');
    await expEditor1.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await expEditor1.saveExplorationDraft();
    // Allow page to fully settle before publishing second exploration.
    await expEditor1.page.waitForTimeout(1000);
    await expEditor1.publishExplorationWithMetadataRobust(
      'Negative Numbers',
      'This exploration teaches students about negative numbers and their applications.',
      'Mathematics'
    );

    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    const wholeNumbersExpId = await expEditor1.getExplorationId();
    await expEditor1.updateCardContent('Draft that will be deleted.');
    await expEditor1.saveExplorationDraft();

    // 4. Account Deletion.
    await expEditor1.navigateToPreferencesPage();
    await expEditor1.deleteAccount();
    await expEditor1.confirmAccountDeletion('expEditor1');
    showMessage('Account deleted for expEditor1.');

    // 5. Verify ownership and access permissions as expEditor2.
    await expEditor2.navigateToExplorationEditorPageById(wholeNumbersExpId);
    await expEditor2.expectErrorPage(404);
    await expEditor2.navigateToExplorationEditorPageById(negativeNumbersExpId);
    await expEditor2.expectExplorationToBeCommunityOwned();
    await expEditor2.navigateToExplorationEditorPageById(positiveNumbersExpId);
    await expEditor2.expectUserToBeExplorationManager();
  }, 600000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
