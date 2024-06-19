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
 * @fileoverview Acceptance tests for the functionality of flushing the cache
 * and getting the memory cache profile by a release coordinator.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

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
    'should navigate to the Misc tab, flush the cache and get the memory cache profile',
    async function () {
      await releaseCoordinator.navigateToReleaseCoordinatorPage();
      await releaseCoordinator.navigateToMiscTab();
      await releaseCoordinator.flushCache();
      await releaseCoordinator.expectSuccessMessage(
        'Success! Memory Cache Flushed.'
      );
      await releaseCoordinator.getMemoryCacheProfile();
      await releaseCoordinator.expectSuccessMessage('Success!');
      await releaseCoordinator.expectCacheProfileToHaveProperties([
        'totalAllocatedInBytes',
        'peakAllocatedInBytes',
        'totalKeysStored',
      ]);

      // Since the cache is flushed, the total keys stored should be less than 10.
      // But, not necessarily 0, as there could be some keys stored in the cache
      // while fetching the profile.
      await releaseCoordinator.expectTotalKeysStoredToBeLessThan(10);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
