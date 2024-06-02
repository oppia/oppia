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
 * @fileoverview Acceptance Test for checking if a moderator can view recent commits 
 * and feedback messages
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import { Moderator } from '../../utilities/user/moderator';
import { ExplorationEditor } from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS: number =
  testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Moderator', function () {
  let moderator: Moderator;
  let explorationEditor: ExplorationEditor;
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

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.createExplorationWithMinimumContent(
      'Test Exploration',
      'End Exploration'
    );
    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.publishExplorationWithContent(
      'Test Exploration Title 1',
      'Test Exploration Goal',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }

    await explorationEditor.playExploration(explorationId);
    await explorationEditor.giveFeedback('It was good');
}, DEFAULT_SPEC_TIMEOUT_MSECS);

 it('should be able to view recent commits and feedback messages', async function () {
  // Access the moderator page and ensure that the page data loads correctly.
  await moderator.navigateToModeratorPage();
  const recentCommits = await moderator.viewAllRecentCommits();
  expect(recentCommits.length).toBeGreaterThan(0);

  // Check properties of a recent commit.
  const recentCommit = await moderator.viewRecentCommit();
  expect(recentCommit).toHaveProperty('timestamp');
  expect(recentCommit).toHaveProperty('exploration');
  expect(recentCommit).toHaveProperty('category');
  expect(recentCommit).toHaveProperty('username');
  expect(recentCommit).toHaveProperty('commitMessage');
  expect(recentCommit).toHaveProperty('isCommunityOwned');

  // Open the respective exploration in the exploration editor by clicking the links attached to the corresponding exploration titles.
  await moderator.openExplorationFromCommitLink();
  expect(await moderator.isInExplorationEditor()).toBe(true);

  // View recent feedback messages.
  const recentFeedbackMessages = await moderator.viewRecentFeedbackMessages();
  expect(recentFeedbackMessages.length).toBeGreaterThan(0);

  // Open the respective exploration in the exploration editor by clicking the links attached to the corresponding exploration in recent feedback messages.
  await moderator.openExplorationFromFeedbackLink();
  expect(await moderator.isOnFeedbackTabOfExplorationEditor()).toBe(true);
}, DEFAULT_SPEC_TIMEOUT_MSECS);

afterAll(async function () {
  await UserFactory.closeAllBrowsers();
});

});
