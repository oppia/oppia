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
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS: number =
  testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Moderator', function () {
  let moderator: Moderator;
  let explorationEditor: ExplorationEditor;
  let loggedInUser: LoggedInUser;
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

    loggedInUser = await UserFactory.createNewUser(
      'testLearner',
      'test_user@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.createExplorationWithMinimumContent(
      'Test Exploration',
      'End Exploration'
    );
    await explorationEditor.saveExplorationDraft();

    explorationId = await explorationEditor.publishExplorationWithContent(
      'Test Exploration Title',
      'Test Exploration Goal',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to feature and unfeature activities',
    async function () {
      // The logged in user navigates to the community library
      await loggedInUser.navigateToCommunitylibrary();

      // The logged in user views all featured activities
      let featuredActivities = await loggedInUser.viewAllFeaturedActivities();
      expect(featuredActivities).toEqual([]);

      // The moderator features an activity
      await moderator.featureActivity(explorationId as string);

      // The logged in user views all featured activities again
      featuredActivities = await loggedInUser.viewAllFeaturedActivities();
      expect(featuredActivities).toContain({explorationId: explorationId});

      // The moderator unfeatures the activity
      await moderator.unfeatureActivity();

      // The logged in user views all featured activities again
      featuredActivities = await loggedInUser.viewAllFeaturedActivities();
      expect(featuredActivities).toEqual([]);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
