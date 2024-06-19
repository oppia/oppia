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

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

enum INTERACTION_TYPES {
  MATH_EQUATION_INPUT = 'Math Equation Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  FINAL_CARD = 'Final Card',
}

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
      'We will be learning Equations today.'
    );
    await explorationEditor.addMathInteraction('Math Equation Input');
    await explorationEditor.addResponseToTheInteraction(
      INTERACTION_TYPES.MATH_EQUATION_INPUT,
      'y = 2x + 3',
      'Prefect!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();

    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Test Exploration Title',
      'Test Exploration Goal',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error in publishing the exploration');
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should navigate to the Release Coordinator page, select a job, run it,' +
      'view and copy the output, and close the output modal',
    async function () {
      await releaseCoordinator.navigateToReleaseCoordinatorPage();
      await releaseCoordinator.selectAndRunJob(
        'FindMathExplorationsWithRulesJob'
      );

      // Beam jobs, take a while to run.
      await releaseCoordinator.waitForJobToComplete();
      await releaseCoordinator.viewAndCopyJobOutput();

      // Verify that the output was copied correctly.
      await releaseCoordinator.expectJobOutputToBe('af');

      await releaseCoordinator.closeOutputModal();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
