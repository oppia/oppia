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
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * SM.MP.03 Featured Activities Section.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {Moderator} from '../../utilities/user/moderator';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

test.describe.configure({mode: 'serial'});

test.describe('Site Moderator', function () {
  let siteModerator: Moderator;
  let loggedOutUser: LoggedOutUser;
  let explorationId: string;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(500000); // Setup takes longer than the default timeout.

    siteModerator = await UserFactory.createNewUser(
      'siteModerator',
      'site_moderator@example.com',
      browser,
      [testConstants.Roles.MODERATOR]
    );
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);

    const explorationEditor: ExplorationEditor & LoggedOutUser =
      await UserFactory.createNewUser(
        'explorationEditor',
        'exploration_editor@example.com',
        browser
      );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
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
  });

  test('should be able to add featured activities', async function () {
    await siteModerator.navigateToModeratorPage();
    await siteModerator.navigateToFeaturedActivitiesTab();
    await siteModerator.expectScreenshotToMatch(
      'moderatorPageFeaturedActivitiesTab'
    );

    await siteModerator.featureActivity(explorationId);
    await loggedOutUser.navigateToCommunityLibraryPage();
    await loggedOutUser.expectToViewFeaturedActivities([
      'Test Exploration Title',
    ]);

    // Use invalid exploration ID.
    await siteModerator.featureActivity('ABC0101', 1);
    await siteModerator.expectToastWarningMessageToBe(
      'These Exploration IDs do not exist: ABC0101'
    );
    await siteModerator.closeToastWarningMessage();
    // Once we check that activity can't be added, it's data is still there.
    // Thus, we are removing it.
    await siteModerator.unfeatureActivityAtIndex(2);
  });

  test('should be able to remove featured activity', async function () {
    await siteModerator.unfeatureActivityAtIndex(1);
    await loggedOutUser.navigateToCommunityLibraryPage();
    await loggedOutUser.expectToViewFeaturedActivities([]);
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
