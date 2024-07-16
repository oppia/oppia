// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for checking if all buttons on the
 * "Donate" page can be clicked by logged-out users.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {CollectionEditor} from '../../utilities/user/collection-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let CollectionEditor: CollectionEditor;
  let loggedOutUser: LoggedOutUser;
  let explorationId1: string | null;
  let explorationId2: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    CollectionEditor = await UserFactory.createNewUser(
      'collectionEditor',
      'collection_editor@example.com',
      [ROLES.COLLECTION_EDITOR]
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.createMinimalExploration(
      'Test Exploration 1',
      'End Exploration 1'
    );
    await explorationEditor.saveExplorationDraft();

    explorationId1 = await explorationEditor.publishExplorationWithMetadata(
      'Test Exploration Title 1',
      'Test Exploration Goal 1',
      'Algebra 1'
    );
    if (!explorationId1) {
      throw new Error('Error in publishing the first exploration');
    }

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.createMinimalExploration(
      'Test Exploration 2',
      'End Exploration 2'
    );
    await explorationEditor.saveExplorationDraft();

    explorationId2 = await explorationEditor.publishExplorationWithMetadata(
      'Test Exploration Title 2',
      'Test Exploration Goal 2',
      'Algebra 2'
    );
    if (!explorationId2) {
      throw new Error('Error in publishing the second exploration');
    }

    await CollectionEditor.navigateToCollectionEditor();
    await CollectionEditor.createCollection(explorationId1, explorationId2);
    await CollectionEditor.publishCollection();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate and interact with the community library to find and play collections',
    async function () {
      // Search 'collections' to find all the collections from the search bar.
      await loggedOutUser.navigateToCommunityLibraryPage();
      await loggedOutUser.searchForLessonInSearchBar('Collections');
      await loggedOutUser.expectSearchResultToContain('Collections');

      // Visit the collection player by selecting one of the collections.
      await loggedOutUser.selectAndOpenCollection('Test Collection');

      // See the "collection story path" diagram, can see info about individual exploration via hovering onto the explorations in the diagram.
      await loggedOutUser.viewCollectionStoryPath();
      await loggedOutUser.hoverOverExplorationInDiagram('Test Exploration 1');
      await loggedOutUser.expectExplorationPreviewUponHovering();

      // Share the collection.
      await loggedOutUser.shareCollection('facebook');
      await loggedOutUser.shareCollection('twitter');
      await loggedOutUser.shareCollection('google classroom');

      // Play any exploration in the collection.
      await loggedOutUser.selctAndOpenExplorationPlayer('Test Exploration');
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations! You have completed the exploration.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
