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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * SM.MP.01 Check recent commits.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {Moderator} from '../../utilities/user/moderator';

describe('Site Moderator', function () {
  let siteModerator: Moderator;
  let explorationId: string;

  beforeAll(async function () {
    siteModerator = await UserFactory.createNewUser(
      'siteModerator',
      'site_moderator@example.com',
      [testConstants.Roles.MODERATOR]
    );

    const explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
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
    await explorationEditor.dismissWelcomeModal();
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

  it('should be able verify display of recent commits table', async function () {
    await siteModerator.navigateToModeratorPage();
    await siteModerator.expectScreenshotToMatch('siteModeratorPage', __dirname);

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

  it('should be able to verify clickable exploration links', async function () {
    await siteModerator.clickOnExplorationLinkInRecentCommitsTable(2);
    await siteModerator.expectToBeInExplorationEditor(explorationId);

    await siteModerator.page.goBack();
    await siteModerator.expectToBeInModeratorPage();
  });

  it('should be able to verify order of timestamp', async function () {
    await siteModerator.expectTimestampToBeInDescendingOrder();
  });

  it('should be able to verify community owned section', async function () {
    await siteModerator.expectCommitPropertyToBe(
      1,
      'isCommunityOwned',
      'false'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
