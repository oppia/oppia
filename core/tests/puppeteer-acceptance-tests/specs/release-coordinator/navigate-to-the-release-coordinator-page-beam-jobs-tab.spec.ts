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
 * RC.BJ Navigate to the release coordinator page, Beam Jobs tab.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DUMMY_PASS_BEAM_JOB = 'DummyPassJob';
const DUMMY_FAIL_BEAM_JOB = 'DummyFailJob';
const DUMMY_PASS_BEAM_JOB_OUTPUT = 'SUCCESS: Dummy job completed successfully';
const DUMMY_FAIL_BEAM_JOB_ERROR =
  'Exception: DummyFailJob intentionally failed.';

describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [testConstants.Roles.RELEASE_COORDINATOR]
    );
  });

  it('should be able to visit release coordinator page', async function () {
    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.expectScreenshotToMatch(
      'releaseCoordinatorPage',
      __dirname
    );
  });

  it('should be able to run beam job (success)', async function () {
    await releaseCoordinator.selectAndRunJob(DUMMY_PASS_BEAM_JOB);
    // Beam jobs, take a while to run.
    await releaseCoordinator.waitForJobToComplete();
    await releaseCoordinator.expectJobStatusToBeSuccessful(
      1, // First job.
      true // Successful.
    );

    await releaseCoordinator.viewAndCopyJobOutput();
    // Check if the job output is as expected.
    await releaseCoordinator.expectJobOutputToBe(DUMMY_PASS_BEAM_JOB_OUTPUT);
  });

  it('should be able to handle beam job (failure)', async function () {
    await releaseCoordinator.closeOutputModal();
    await releaseCoordinator.selectAndRunJob(DUMMY_FAIL_BEAM_JOB);
    await releaseCoordinator.waitForJobToComplete();
    await releaseCoordinator.expectJobStatusToBeSuccessful(
      1, // Latest job of DummyFailJob.
      false // Failure.
    );

    await releaseCoordinator.viewJobOutput();
    await releaseCoordinator.expectJobOutputToBe(DUMMY_FAIL_BEAM_JOB_ERROR);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
