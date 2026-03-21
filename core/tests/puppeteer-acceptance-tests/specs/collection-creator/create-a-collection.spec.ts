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

const ROLES = testConstants.Roles;

describe('Collection Creator', function () {
  let collectionEditor: CollectionEditor & ExplorationEditor;
  let explorationCreator: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let firstExplorationId: string;
  let secondExplorationId: string;
  let thirdExplorationId: string;

  beforeAll(async function () {
    // Create a user to create explorations that will be added to the collection.
    explorationCreator = await UserFactory.createNewUser(
      'explorationCreator',
      'exploration_creator@example.com'
    );

    // Create 3 explorations: Positive Numbers, Negative Numbers, Whole Numbers.
    await explorationCreator.navigateToCreatorDashboardPage();
    await explorationCreator.navigateToExplorationEditorFromCreatorDashboard();
    await explorationCreator.dismissWelcomeModal();
    await explorationCreator.updateCardContent('Positive Numbers Content');
    await explorationCreator.addInteraction('End Exploration');
    await explorationCreator.saveExplorationDraft();
    await explorationCreator.publishExplorationWithMetadata(
      'Positive Numbers',
      'Exploration about positive numbers.',
      'Algebra'
    );
    firstExplorationId = await explorationCreator.getExplorationId();

    await explorationCreator.navigateToCreatorDashboardPage();
    await explorationCreator.navigateToExplorationEditorFromCreatorDashboard();
    await explorationCreator.updateCardContent('Negative Numbers Content');
    await explorationCreator.addInteraction('End Exploration');
    await explorationCreator.saveExplorationDraft();
    await explorationCreator.publishExplorationWithMetadata(
      'Negative Numbers',
      'Exploration about negative numbers.',
      'Algebra'
    );
    secondExplorationId = await explorationCreator.getExplorationId();

    await explorationCreator.navigateToCreatorDashboardPage();
    await explorationCreator.navigateToExplorationEditorFromCreatorDashboard();
    await explorationCreator.updateCardContent('Whole Numbers Content');
    await explorationCreator.addInteraction('End Exploration');
    await explorationCreator.saveExplorationDraft();
    await explorationCreator.publishExplorationWithMetadata(
      'Whole Numbers',
      'Exploration about whole numbers.',
      'Algebra'
    );
    thirdExplorationId = await explorationCreator.getExplorationId();

    await explorationCreator.closeBrowser();

    // Create a user with collection editor role.
    collectionEditor = await UserFactory.createNewUser(
      'collectionEditor',
      'collection_editor@example.com',
      [ROLES.COLLECTION_EDITOR]
    );

    // Create a logged-out user for verifying the published collection.
    loggedOutUser = await UserFactory.createLoggedOutUser();
  });

  it('should be able to create a collection and add explorations', async function () {
    // Navigate to creator dashboard and create a new collection.
    await collectionEditor.navigateToCreatorDashboardUsingProfileDropdown();
    await collectionEditor.createNewCollection();

    // Verify the collection editor page matches the expected state
    // (Snapshot Collections.1: empty collection editor with add exploration
    // input visible).
    await collectionEditor.expectToBeOnCollectionEditorPage();
    await collectionEditor.expectAddExplorationInputToBeVisible();
    await collectionEditor.expectScreenshotToMatch(
      'emptyCollectionEditor',
      __dirname
    );

    // Verify the collection editor is empty initially.
    await collectionEditor.expectCollectionEditorToBeEmpty();

    // Add the first exploration.
    await collectionEditor.addExistingExploration(firstExplorationId);

    // Verify the first node is visible with no arrows.
    await collectionEditor.expectNodeToBeVisible('Positive Numbers');
    await collectionEditor.expectMoveLeftArrow(0, false);
    await collectionEditor.expectMoveRightArrow(0, false);

    // Add the second and third explorations.
    await collectionEditor.addExistingExploration(secondExplorationId);
    await collectionEditor.addExistingExploration(thirdExplorationId);

    // Verify all nodes appear in order.
    await collectionEditor.expectNodesInOrder([
      'Positive Numbers',
      'Negative Numbers',
      'Whole Numbers',
    ]);

    // Verify arrow visibility on each node.
    await collectionEditor.expectMoveRightArrow(0, true);
    await collectionEditor.expectMoveLeftArrow(1, true);
    await collectionEditor.expectMoveRightArrow(1, true);
    await collectionEditor.expectMoveLeftArrow(2, true);

    // Shift "Positive Numbers" to the right.
    await collectionEditor.shiftNodeRight(0);

    // Verify the new order after shift.
    await collectionEditor.expectNodesInOrder([
      'Negative Numbers',
      'Positive Numbers',
      'Whole Numbers',
    ]);

    // Delete node "Negative Numbers" (now at index 0 after shift).
    await collectionEditor.deleteNode(0);

    // Verify remaining nodes in order and "Negative Numbers" is not visible.
    await collectionEditor.expectNodesInOrder([
      'Positive Numbers',
      'Whole Numbers',
    ]);
    await collectionEditor.expectNodeNotVisible('Negative Numbers');

    // Click on the "Save Draft" button.
    await collectionEditor.saveCollectionDraft();

    // Verify "Save Draft" button is disabled and "Publish" is clickable.
    await collectionEditor.expectSaveDraftButtonDisabled();
    await collectionEditor.expectPublishButtonClickable();
  });

  it('should be able to save and publish the collection draft', async function () {
    // Click on the "Publish" button.
    await collectionEditor.publishCollection();

    // Add title, goal, and category.
    await collectionEditor.setTitle('Test Collection');
    await collectionEditor.setObjective('End-to-end test for collection');
    await collectionEditor.setCategory('Algebra');

    // Click "Save Changes".
    await collectionEditor.saveChanges();

    // Verify "Publish" button is disabled (no unpublished changes).
    await collectionEditor.expectPublishButtonDisabled();

    // As loggedOutUser: navigate to community library and verify collection
    // is visible.
    await loggedOutUser.navigateToCommunityLibraryOnNavbar();
    await loggedOutUser.expectCollectionToBeVisibleInLibrary('Test Collection');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
