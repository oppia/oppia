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
 * SM.MP.01 Check recent commits.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {Moderator} from '../../utilities/user/moderator';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Site Moderator', function () {
  let siteModerator: Moderator;
  let explorationId: string;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(500000); // Setup takes longer than the default timeout.

    siteModerator = await UserFactory.createNewUser(
      'siteModerator',
      'site_moderator@example.com',
      browser,
      [testConstants.Roles.MODERATOR]
    );

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

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.createMinimalExploration(
      'Test Exploration 2',
      'End Exploration'
    );
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.publishExplorationWithMetadata(
      'Test Exploration Title 2',
      'Test Exploration Goal 2',
      'Algebra'
    );
  });

  test('should be able verify display of recent commits table', async function () {
    await siteModerator.navigateToModeratorPage();
    await siteModerator.expectScreenshotToMatch('siteModeratorPage');

    await siteModerator.expectNumberOfRecentCommits(2);
    await siteModerator.expectRecentCommitsTableToHaveColumns([
      'Timestamp',
      'Exploration',
      'Category',
      'Username',
      'Commit message',
      'Community-owned?',
    ]);
    await siteModerator.expectCommitToHaveProperties(1, [
      'timestamp',
      'exploration',
      'category',
      'username',
      'commitMessage',
      'isCommunityOwned',
    ]);
  });

  test('should be able to verify clickable exploration links', async function () {
    await siteModerator.clickOnExplorationLinkInRecentCommitsTable(2);
    await siteModerator.expectToBeInExplorationEditor(explorationId);

    await siteModerator.page.goBack();
    await siteModerator.expectToBeInModeratorPage();
  });

  test('should be able to verify order of timestamp', async function () {
    await siteModerator.expectTimestampToBeInDescendingOrder();
  });

  test('should be able to verify community owned section', async function () {
    await siteModerator.expectCommitPropertyToBe(
      1,
      'isCommunityOwned',
      'false'
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
