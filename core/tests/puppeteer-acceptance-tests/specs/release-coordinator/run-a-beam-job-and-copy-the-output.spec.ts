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
 * @fileoverview Acceptance tests for the Release Coordinator's ability
 * to run a Beam job, view its output, and copy it.
 */
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

enum INTERACTION_TYPES {
  NUMERIC_EXPRESSION_INPUT = 'Numeric Expression Input',
  END_EXPLORATION = 'End Exploration',
}

// Ignoring these errors because they are happening due to missing responses in the exploration setup data,
// which are not needed for the actual tests to work.
ConsoleReporter.setConsoleErrorsToIgnore([
  /.*404.*Not Found.*/,
  /.*Failed to load resource: net::ERR_CONNECTION_CLOSED.*/,
]);

describe('Release Coordinator', function () {
  let releaseCoordinator: ReleaseCoordinator;
  let explorationEditor: ExplorationEditor;
  let explorationId: string | null;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    // Creating data for the beam job.
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'We will be learning Expressions today.'
    );
    await explorationEditor.addMathInteraction(
      INTERACTION_TYPES.NUMERIC_EXPRESSION_INPUT
    );
    await explorationEditor.closeInteractionResponseModal();

    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.getExplorationId();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should navigate to the Release Coordinator page, select a job, run it,' +
      ' view and copy the output, and close the output modal',
    async function () {
      await releaseCoordinator.navigateToReleaseCoordinatorPage();
      await releaseCoordinator.selectAndRunJob(
        'FindMathExplorationsWithRulesJob'
      );

      // Beam jobs, take a while to run.
      await releaseCoordinator.waitForJobToComplete();
      // Verify that the output was copied correctly.
      await releaseCoordinator.viewAndCopyJobOutput();

      await releaseCoordinator.expectJobOutputToBe(
        `('${explorationId}', 'Introduction', [])`
      );
      await releaseCoordinator.closeOutputModal();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
