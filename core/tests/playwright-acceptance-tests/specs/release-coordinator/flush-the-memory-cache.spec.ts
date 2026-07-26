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
 * RC.MC Flush the memory cache.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

test.describe.configure({mode: 'serial'});

test.describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(900000);
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      browser,
      [testConstants.Roles.RELEASE_COORDINATOR]
    );
  });

  test('should be able to flush the memory cache', async function () {
    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.navigateToMiscTab();
    await releaseCoordinator.getMemoryCacheProfile();
    await releaseCoordinator.expectTotalKeysStoredToBeInRange(
      undefined,
      10
    );

    await releaseCoordinator.flushCache();

    await releaseCoordinator.getMemoryCacheProfile();
    await releaseCoordinator.expectTotalKeysStoredToBeInRange(100, undefined);
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
