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
 * EL.SL. Learner can share the lesson from the lesson player
 */

import {showMessage} from '../../utilities/common/show-message';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;

describe('Logged-Out Learner', function () {
  let explorationEditor: ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let loggedOutUser: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping the test and make the test to run in mobile viewport as well.
    // Also, attribution cannot be generated in mobile devices, so keep that part skipped in mobile
    // tests.
    // see: https://github.com/oppia/oppia/issues/19443
    if (process.env.MOBILE === 'true') {
      showMessage('Test skipped in mobile viewport');
      process.exit(0);
    }

    loggedOutUser = await UserFactory.createLoggedOutUser();

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator1',
      'release_coordinator1@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    // Enable the feature flag.
    await releaseCoordinator.enableFeatureFlag('new_lesson_player');

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    explorationId =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Addition'
      );

    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }
  });

  it('should be able to share the lesson using copy link', async function () {
    await loggedOutUser.playLesson(explorationId);
    await loggedOutUser.expectSidebarToggleBtnTextToBe('Open options');

    // Expand sidebar.
    await loggedOutUser.toggleLessonPlayerSidebar();
    await loggedOutUser.expectSidebarToggleBtnTextToBe('Close options');
    // await loggedOutUser.expectLessonDescriptionInSidebarTextToBe('This is Goal here.');
    await loggedOutUser.expectSidebarShareButtonToBePresent();
    await loggedOutUser.expectSidebarFeedbackButtonToBePresent();
    await loggedOutUser.expectSidebarReportButtonToBePresent();

    // Open share modal.
    await loggedOutUser.openShareModal();

    // Copy lesson sharing link.
    const sharingLink = await loggedOutUser.copyLessonSharingLink();
    await loggedOutUser.expectLessonSharingLinkToBeCopied(
      'Link Copied',
      sharingLink
    );

    // await loggedOutUser.expectScreenshotToMatch('attributionModel', __dirname);
  });

  it('should be able to share the lesson attribution', async function () {
    await loggedOutUser.playLesson(explorationId);
    await loggedOutUser.openShareModal();
    const attribution = await loggedOutUser.copyAttribution();
    await loggedOutUser.expectAttributionToBeCopied(
      'Attribution Copied',
      attribution
    );
    // await loggedOutUser.expectScreenshotToMatch('attributionCopied', __dirname);
  });

  it('should be able to share the lesson on Google Classroom', async function () {
    await loggedOutUser.shareExplorationAndVerifyRedirect(
      'Classroom',
      explorationId
    );
  });

  it('should be able to share the lesson on Facebook', async function () {
    await loggedOutUser.shareExplorationAndVerifyRedirect(
      'Facebook',
      explorationId
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
