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
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator;
  let explorationEditor: ExplorationEditor;
  let explorationId: string;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [testConstants.Roles.RELEASE_COORDINATOR]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    // Creating data for the beam job.
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'We will be learning Expressions today.'
    );
    await explorationEditor.addMathInteraction(
      INTERACTION_TYPES.NUMERIC_EXPRESSION
    );
    await explorationEditor.closeInteractionResponseModal();

    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.getExplorationId();
  });

  it('should be able to visit release coordinator page', async function () {
    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.expectScreenshotToMatch(
      'releaseCoordinatorPage',
      __dirname
    );
  });

  it('should be able to run beam job (Success)', async function () {
    await releaseCoordinator.selectAndRunJob(
      'FindMathExplorationsWithRulesJob'
    );
    // Beam jobs, take a while to run.
    await releaseCoordinator.waitForJobToComplete();

    await releaseCoordinator.viewAndCopyJobOutput();
    // Check if the job output is as expected.
    await releaseCoordinator.expectJobOutputToBe(
      `('${explorationId}', 'Introduction', [])`
    );
    await releaseCoordinator.expectJobStatusToBeSuccessful(
      1, // First job.
      true // Successful.
    );
  });

  it('should be able to handle beam job failure', async function () {
    // TODO(#23331): Once we have a dummy job that always fails,
    // add steps to run the dummy job and check if the job status is failure.
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
