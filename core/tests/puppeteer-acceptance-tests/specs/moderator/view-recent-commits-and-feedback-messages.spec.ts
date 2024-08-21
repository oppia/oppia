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
import {Moderator} from '../../utilities/user/moderator';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {showMessage} from '../../utilities/common/show-message';

ConsoleReporter.setConsoleErrorsToIgnore([
  "Failed to execute 'convertToSpecifiedUnits' on 'SVGLength': Could not resolve relative length.",
]);

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Moderator', function () {
  let moderator: Moderator;
  let explorationEditor: ExplorationEditor;
  let explorationId: string | null;

  beforeAll(async function () {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping the test and make the test to run in mobile viewport as well.
    // see: https://github.com/oppia/oppia/issues/19443
    if (process.env.MOBILE === 'true') {
      showMessage('Test skipped in mobile viewport');
      return;
    }

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

    await explorationEditor.playExploration(explorationId);
    await explorationEditor.giveFeedback('It was good');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to view recent commits and feedback messages',
    async function () {
      // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
      // in mobile viewport which is required for testing the feedback messages tab),
      // remove this part of skipping the test and make the test to run in mobile viewport as well.
      // see: https://github.com/oppia/oppia/issues/19443
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }

      await moderator.navigateToModeratorPage();
      await moderator.expectNumberOfRecentCommits(1);
      await moderator.expectCommitToHaveProperties(1, [
        'timestamp',
        'exploration',
        'category',
        'username',
        'commitMessage',
        'isCommunityOwned',
      ]);

      // Opens Feedback tab in the exploration editor.
      await moderator.openFeedbackTabFromLinkInExplorationTitle(
        'Test Exploration Title'
      );
      await moderator.expectToBeOnFeedbackTab();

      // Moderator was redirected to the Feedback tab in the previous step.
      // Therefore, need to navigate back to the Moderator page.
      await moderator.navigateToModeratorPage();
      await moderator.navigateToRecentFeedbackMessagesTab();
      await moderator.expectNumberOfFeedbackMessages(1);
      await moderator.expectFeedbackMessageToHaveProperties(1, [
        'timestamp',
        'explorationId',
        'username',
      ]);

      // Opens Feedback tab in the exploration editor.
      await moderator.openFeedbackTabFromLinkInExplorationId(explorationId);
      await moderator.expectToBeOnFeedbackTab();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
