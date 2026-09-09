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
 * @fileoverview Acceptance test from E2E Migration Doc
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/edit?gid=888982708#gid=888982708&range=A154:A156
 *
 * CC.1. Create a collection
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {CollectionEditor} from '../../utilities/user/collection-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {showMessage} from '../../utilities/common/show-message';

const ROLES = testConstants.Roles;

describe('Collection Creator', function () {
  let collectionEditor: CollectionEditor & ExplorationEditor;
  let explorationCreator: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let firstExplorationId: string;
  let secondExplorationId: string;
  let thirdExplorationId: string;

  beforeAll(async function () {
    // Create Users.
    explorationCreator = await UserFactory.createNewUser(
      'explorationCreator',
      'exploration_creator@example.com'
    );
    collectionEditor = await UserFactory.createNewUser(
      'collectionEditor',
      'collection_editor@example.com',
      [ROLES.COLLECTION_EDITOR]
    );
    loggedOutUser = await UserFactory.createLoggedOutUser();

    // TODO (#26642): Currently, the "Save Draft" button in collection editor isn't visible
    // once fixed, allow testing for mobile viewport.
    if (loggedOutUser.isViewportAtMobileWidth()) {
      showMessage('Skipping the test, check issue #26642');
      return;
    }

    // Create 3 explorations: Positive Numbers, Negative Numbers, Whole Numbers.
    await explorationCreator.navigateToCreatorDashboardPage();
    await explorationCreator.navigateToExplorationEditorFromCreatorDashboard();
    await explorationCreator.dismissWelcomeModal();
    await explorationCreator.updateCardContent('Positive Numbers Content');
    await explorationCreator.addInteraction('End Exploration');
    await explorationCreator.saveExplorationDraft();
    firstExplorationId =
      await explorationCreator.publishExplorationWithMetadata(
        'Positive Numbers',
        'Exploration about positive numbers.',
        'Algebra'
      );

    await explorationCreator.navigateToCreatorDashboardPage();
    await explorationCreator.navigateToExplorationEditorFromCreatorDashboard();
    await explorationCreator.updateCardContent('Negative Numbers Content');
    await explorationCreator.addInteraction('End Exploration');
    await explorationCreator.saveExplorationDraft();
    secondExplorationId =
      await explorationCreator.publishExplorationWithMetadata(
        'Negative Numbers',
        'Exploration about negative numbers.',
        'Algebra'
      );

    await explorationCreator.navigateToCreatorDashboardPage();
    await explorationCreator.navigateToExplorationEditorFromCreatorDashboard();
    await explorationCreator.updateCardContent('Whole Numbers Content');
    await explorationCreator.addInteraction('End Exploration');
    await explorationCreator.saveExplorationDraft();
    thirdExplorationId =
      await explorationCreator.publishExplorationWithMetadata(
        'Whole Numbers',
        'Exploration about whole numbers.',
        'Algebra'
      );

    await explorationCreator.closeBrowser();
  });

  it('should be able to create a collection and add explorations', async function () {
    // TODO (#26642): Currently, the "Save Draft" button in collection editor isn't visible
    // once fixed, allow testing for mobile viewport.
    if (loggedOutUser.isViewportAtMobileWidth()) {
      showMessage('Skipping the test, check issue #26642');
      return;
    }

    // Navigate to creator dashboard and create a new collection.
    await collectionEditor.navigateToCreatorDashboardUsingProfileDropdown();
    await collectionEditor.createACollection();

    await collectionEditor.expectToBeOnCollectionEditorPage();
    await collectionEditor.expectAddExplorationInputToBeVisible();
    await collectionEditor.expectCollectionEditorToBeEmpty();
    await collectionEditor.expectScreenshotToMatch(
      'emptyCollectionEditor',
      __dirname
    );

    // Add Positive Numbers exploration.
    await collectionEditor.addExistingExploration(firstExplorationId);

    await collectionEditor.expectNodeToBeVisible('Positive Numbers');
    await collectionEditor.expectMoveLeftArrow(0, false);
    await collectionEditor.expectMoveRightArrow(0, false);

    // Add remaining explorations.
    await collectionEditor.addExistingExploration(secondExplorationId);
    await collectionEditor.addExistingExploration(thirdExplorationId);

    await collectionEditor.expectNodesInOrder([
      'Positive Numbers',
      'Negative Numbers',
      'Whole Numbers',
    ]);

    await collectionEditor.expectMoveRightArrow(0, true);

    await collectionEditor.expectMoveLeftArrow(1, true);
    await collectionEditor.expectMoveRightArrow(1, true);

    await collectionEditor.expectMoveLeftArrow(2, true);

    // Shift Positive Numbers to the right.
    await collectionEditor.shiftNodeRight(0);

    await collectionEditor.expectNodesInOrder([
      'Negative Numbers',
      'Positive Numbers',
      'Whole Numbers',
    ]);

    // Delete node Negative Numbers (now at index 0 after shift).
    await collectionEditor.deleteNode(0);

    await collectionEditor.expectNodeNotVisible('Negative Numbers');
    await collectionEditor.expectNodesInOrder([
      'Positive Numbers',
      'Whole Numbers',
    ]);
  });

  it('should be able to save and publish the collection draft', async function () {
    // TODO (#26642): Currently, the "Save Draft" button in collection editor isn't visible
    // once fixed, allow testing for mobile viewport.
    if (loggedOutUser.isViewportAtMobileWidth()) {
      showMessage('Skipping the test, check issue #26642');
      return;
    }

    // Save exploration draft.
    await collectionEditor.saveCollectionDraft();

    await collectionEditor.expectSaveDraftButtonDisabled();
    await collectionEditor.expectPublishButtonClickable();

    // Publish the exploration.
    await collectionEditor.clickOnPublishCollectionButton();

    // Add title, goal, and category.
    await collectionEditor.setTitle('Test Collection');
    await collectionEditor.setObjective('End-to-end test for collection');
    await collectionEditor.setCategory('Algebra');

    await collectionEditor.saveChanges();

    // Verify "Publish" button is disabled (no unpublished changes).
    await collectionEditor.expectPublishButtonDisabled();

    // Check community page for the collection.
    await loggedOutUser.navigateToCommunityLibraryOnNavbar();
    await loggedOutUser.expectCollectionToBeVisibleInLibrary('Test Collection');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
