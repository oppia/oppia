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
 * @fileoverview Acceptance tests for the functionality of enabling and saving
 * a promo bar message by a release coordinator.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {showMessage} from '../../utilities/common/show-message';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;
const promoMessage =
  'New Features Alert! Check out our latest updates and enhancements. Explore now!';

describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should navigate to the Promo Bar tab, enable the promo bar and save a promo bar message',
    async function () {
      // TODO(20476): This test is currently skipped in mobile viewport due to an issue
      // that prevents navigation to the "MISC" tab on the release coordinator page.
      // This tab is necessary for testing the promo messages.
      // Once the issue is resolved, remove the code that skips this test in mobile viewport.
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }

      await releaseCoordinator.navigateToReleaseCoordinatorPage();
      await releaseCoordinator.navigateToMiscTab();
      await releaseCoordinator.enablePromoBar();
      await releaseCoordinator.enterPromoBarMessage(promoMessage);
      await releaseCoordinator.savePromoBarMessage();
      // Any learner facing page would work. We are just checking if the message is saved.
      await releaseCoordinator.navigateToSplash();
      await releaseCoordinator.expectPromoMessageToBe(promoMessage);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
