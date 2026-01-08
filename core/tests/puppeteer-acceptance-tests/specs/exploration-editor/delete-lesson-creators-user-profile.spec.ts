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
    // 1. Setup Explorations as expEditor1.

    // Exploration A: Published + Shared with expEditor2.
    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    const positiveNumbersExpId = await expEditor1.getExplorationId();

    await expEditor1.updateCardContent('Introduction to positive numbers');
    await expEditor1.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await expEditor1.saveExplorationDraft();
    await expEditor1.publishExplorationWithMetadata(
      'Positive Numbers',
      'To teach positive numbers',
      'Mathematics'
    );

    // Handle mobile-specific UI: Toggle the navbar menu if the viewport is at mobile width.
    if (await expEditor1.isViewportAtMobileWidth()) {
      await expEditor1.page.waitForSelector(
        '.oppia-navbar-mobile-tabs-toggle',
        {visible: true, timeout: 20000}
      );
      await expEditor1.clickOnElementWithSelector(
        '.oppia-navbar-mobile-tabs-toggle'
      );
    }

    // Navigate to Settings tab and handle viewport scrolling for roles.
    await expEditor1.clickOnElementWithSelector(
      'a.e2e-test-exploration-settings-tab'
    );
    await expEditor1.page.waitForSelector('.oppia-edit-roles-btn-container', {
      visible: true,
      timeout: 20000,
    });

    // Ensure the role username input is visible and centered.
    // This avoids "Element not clickable" errors caused by sticky UI overlaps.
    await expEditor1.page.waitForSelector('.e2e-test-role-username', {
      visible: true,
    });
    await expEditor1.page.evaluate(() => {
      const input = document.querySelector('.e2e-test-role-username');
      if (input) {
        input.scrollIntoView({block: 'center'});
      }
    });

    await expEditor1.assignUserToManagerRole('expEditor2');

    // Exploration B: Published.
    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    const negativeNumbersExpId = await expEditor1.getExplorationId();

    await expEditor1.updateCardContent('Introduction to negative numbers');
    await expEditor1.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await expEditor1.saveExplorationDraft();
    await expEditor1.publishExplorationWithMetadata(
      'Negative Numbers',
      'To teach negative numbers',
      'Mathematics'
    );

    // Exploration C: Draft only.
    await expEditor1.navigateToCreatorDashboardPage();
    await expEditor1.navigateToExplorationEditorFromCreatorDashboard();
    const wholeNumbersExpId = await expEditor1.getExplorationId();

    await expEditor1.updateCardContent('Draft that will be deleted.');
    await expEditor1.saveExplorationDraft();

    // 2. The Account Deletion.
    await expEditor1.navigateToPreferencesPage();
    await expEditor1.deleteAccount();
    await expEditor1.confirmAccountDeletion('expEditor1');
    showMessage('Account deleted for expEditor1.');

    // 3. Verification as expEditor2.

    // A: Check Draft -> 404 error page.
    await expEditor2.navigateToExplorationEditorPageById(wholeNumbersExpId);
    await expEditor2.expectErrorPage(404);

    // B: Check Published -> Still live.
    await expEditor2.navigateToExplorationEditorPageById(negativeNumbersExpId);
    await expEditor2.expectExplorationToBePublished();

    // C: Check Shared -> expEditor2 still Manager.
    await expEditor2.navigateToExplorationEditorPageById(positiveNumbersExpId);
    await expEditor2.expectUserToBeExplorationManager();
  }, 600000); // 10-minute timeout for heavy test workflow.

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
