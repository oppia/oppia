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
 * SM.MP.02 Check recent feedback messages.
 */

import {showMessage} from '../../utilities/common/show-message';
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
    await explorationEditor.playExploration(explorationId);
    await explorationEditor.giveFeedback('It was good');

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
    await explorationEditor.playExploration(explorationId);
    await explorationEditor.giveFeedback('Needs some improvement');
  });

  it('should be able to validate feedback entries', async function () {
    await siteModerator.navigateToModeratorPage();
    await siteModerator.navigateToRecentFeedbackMessagesTab();
    await siteModerator.expectScreenshotToMatch(
      'moderatorPageRecentFeedbackMessagesTab',
      __dirname
    );
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping the test and make the test to run in mobile viewport as well.
    // see: https://github.com/oppia/oppia/issues/19443
    if (process.env.MOBILE === 'true') {
      showMessage('Test skipped in mobile viewport');
      return;
    }

    await siteModerator.expectNumberOfFeedbackMessages(2);
    await siteModerator.expectFeedbackMessageToHaveProperties(1, [
      'timestamp',
      'explorationId',
      'username',
    ]);
    await siteModerator.expectTimestampToBeInDescendingOrder(
      'feedback messages'
    );
  });

  it('should be able to click on feedback links', async function () {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping the test and make the test to run in mobile viewport as well.
    // see: https://github.com/oppia/oppia/issues/19443
    if (process.env.MOBILE === 'true') {
      showMessage('Test skipped in mobile viewport');
      return;
    }

    // Opens Feedback tab in the exploration editor.
    await siteModerator.openFeedbackTabFromLinkInExplorationId(explorationId);
    await siteModerator.expectToBeOnFeedbackTab();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
