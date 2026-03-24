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
 * LO.13. View a collection
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {CollectionEditor} from '../../utilities/user/collection-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in Learner viewing a collection', function () {
  let collectionEditor: CollectionEditor & ExplorationEditor;
  let viewerUser: LoggedOutUser & LoggedInUser & ExplorationEditor;

  beforeAll(async function () {
    // Create the first exploration: "Positive Numbers".
    const explorationCreator = await UserFactory.createNewUser(
      'explorationCreatorLO13',
      'exploration_creator_lo13@example.com'
    );

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
    const exploration1Id = await explorationCreator.getExplorationId();

    // Create the second exploration: "Negative Numbers".
    // Note: welcome modal is only dismissed on the first exploration editor
    // visit per user, so it is not dismissed again here.
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
    const exploration2Id = await explorationCreator.getExplorationId();
    await explorationCreator.closeBrowser();

    // Create and publish a collection named "Numbers" with both explorations.
    collectionEditor = await UserFactory.createNewUser(
      'collectionEditorLO13',
      'collection_editor_lo13@example.com',
      [ROLES.COLLECTION_EDITOR]
    );

    await collectionEditor.navigateToCreatorDashboardUsingProfileDropdown();
    await collectionEditor.createNewCollection();
    await collectionEditor.addExistingExploration(exploration1Id);
    await collectionEditor.addExistingExploration(exploration2Id);
    await collectionEditor.saveCollectionDraft();
    await collectionEditor.publishCollection();
    await collectionEditor.setTitle('Numbers');
    await collectionEditor.setObjective(
      'End-to-end test for viewing a collection'
    );
    await collectionEditor.setCategory('Algebra');
    await collectionEditor.saveChanges();
    // Wait for the publish to fully complete before closing. saveChanges()
    // only waits for the metadata save; the actual publish request fires
    // asynchronously afterwards. Without this, closeBrowser() can abort the
    // in-flight publish request, leaving the collection unpublished.
    await collectionEditor.expectPublishButtonDisabled();
    await collectionEditor.closeBrowser();

    // Create a logged-in user to view the collection. A logged-in user is
    // needed so that the backend tracks exploration completion, which is
    // required for the paw icon (completion marker) to appear.
    viewerUser = await UserFactory.createNewUser(
      'collectionViewerLO13',
      'collection_viewer_lo13@example.com'
    );
  });

  it(
    'should find, play and verify collection features from the library',
    async function () {
      // Navigate to community library via the "Learn" navbar.
      await viewerUser.navigateToCommunityLibraryOnNavbar();
      await viewerUser.expectCollectionToBeVisibleInLibrary('Numbers');

      // Click on the "Numbers" collection.
      await viewerUser.clickOnCollectionInLibrary('Numbers');

      // Verify "Begin Numbers:" and both explorations are visible.
      await viewerUser.expectCollectionBeginTextVisible('Numbers');
      await viewerUser.expectExplorationVisibleInCollectionPage(
        'Positive Numbers'
      );
      await viewerUser.expectExplorationVisibleInCollectionPage(
        'Negative Numbers'
      );

      // Play the "Positive Numbers" exploration.
      await viewerUser.playExplorationFromCollectionPage('Positive Numbers');
      // Verify exploration completion toast message is visible.
      await viewerUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Navigate back to the collection page and verify the paw icon
      // (completion marker) appears for "Positive Numbers".
      await viewerUser.clickBackToCollection();
      await viewerUser.expectPawIconVisibleForExploration(0);

      // Change language to Spanish and verify footer text.
      await viewerUser.changeSiteLanguage('es');
      await viewerUser.expectShareCollectionFooterText(
        'COMPARTIR ESTA COLECCIÓN'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
