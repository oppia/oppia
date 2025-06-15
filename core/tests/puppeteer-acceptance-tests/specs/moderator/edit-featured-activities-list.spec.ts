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
 * @fileoverview Acceptance tests for the functionality of editing the
 * featured activities list by a moderator.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {Moderator} from '../../utilities/user/moderator';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Moderator', function () {
  let moderator: Moderator;
  let explorationEditor: ExplorationEditor;
  let LoggedOutUser: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    moderator = await UserFactory.createNewUser(
      'Moderator',
      'moderator@example.com',
      [ROLES.MODERATOR]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    LoggedOutUser = await UserFactory.createLoggedOutUser();

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.createMinimalExploration(
      'Test Exploration',
      'End Exploration'
    );
    await explorationEditor.saveExplorationDraft();

    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Test Exploration Title',
      'Test Exploration Goal',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error in publishing the exploration');
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to feature and unfeature activities',
    async function () {
      await LoggedOutUser.navigateToCommunityLibraryPage();

      // Expect to see no featured activities as nothing is featured yet.
      await LoggedOutUser.expectToViewFeaturedActivities([]);

      await moderator.navigateToModeratorPage();
      await moderator.navigateToFeaturedActivitiesTab();
      await moderator.featureActivity(explorationId);

      // Expect to see the newly featured activity in the list of featured activities.
      await LoggedOutUser.expectToViewFeaturedActivities([
        'Test Exploration Title',
      ]);

      await moderator.unfeatureActivityAtIndex(1);

      // Expect to see no featured activity as the newly featured activity is unfeatured.
      await LoggedOutUser.expectToViewFeaturedActivities([]);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
