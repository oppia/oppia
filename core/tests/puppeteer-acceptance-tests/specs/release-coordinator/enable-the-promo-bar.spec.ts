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
 * RC.PB Enable the promo bar.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator & LoggedOutUser;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [testConstants.Roles.RELEASE_COORDINATOR]
    );
  });

  it('should be able to enable the promo bar', async function () {
    await releaseCoordinator.navigateToCommunityLibraryPage();
    await releaseCoordinator.expectPromoBarToBeVisible(false);

    // Enable the promo bar.
    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.navigateToMiscTab();
    await releaseCoordinator.enterPromoBarMessage('testing');
    await releaseCoordinator.togglePromoBar();
    await releaseCoordinator.savePromoBarMessage();
    await releaseCoordinator.expectActionStatusMessageToBe('Success!');

    // Verify that the promo bar is visible.
    await releaseCoordinator.navigateToCommunityLibraryPage();
    await releaseCoordinator.expectPromoBarToBeVisible(true, 'testing');
  });

  it('should be able to disable the promo bar', async function () {
    // Disable the promo bar.
    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.navigateToMiscTab();
    await releaseCoordinator.togglePromoBar('disabled');
    await releaseCoordinator.savePromoBarMessage();
    await releaseCoordinator.expectActionStatusMessageToBe('Success!');

    // Verify that the promo bar is not visible.
    await releaseCoordinator.navigateToCommunityLibraryPage();
    await releaseCoordinator.expectPromoBarToBeVisible(false);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
