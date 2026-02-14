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
 * @fileoverview Acceptance test for "LC.12. Visit Creator Dashboard".
 * This test covers the exploration creation, adding interaction, and publishing exploration
 * previously tested in E2E tests:
 * - creatorDashboard.js (visiting the creator dashboard)
 */
import testConstants from '../../utilities/common/test-constants';
import { UserFactory } from '../../utilities/common/user-factory';
import { ExplorationEditor } from '../../utilities/user/exploration-editor';
import { LoggedInUser } from '../../utilities/user/logged-in-user';

const DEFAULT_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

describe('Exploration Learner Flow', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser;
  let learner:LoggedInUser;
  let explorationId1: string | null;
  let explorationId2: string | null;
  
  

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'editor@example.com'
    );

    learner = await UserFactory.createNewUser(
      'learnerUser',
      'learner@example.com'
    );
  }, DEFAULT_TIMEOUT);

  async function createAndPublishMinimalExploration(): Promise<void> {
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();
  
      await explorationEditor.createMinimalExploration(
        'Positive Numbers' ,
        INTERACTION_TYPES.END_EXPLORATION
      );
  
      await explorationEditor.saveExplorationDraft();
      explorationId1= await explorationEditor.publishExplorationWithMetadata(
        'Positive Numbers',
        'This is the goal of exploration.',
        'Math'
      );
      await explorationEditor.waitForPageToFullyLoad();
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();

      // Second exploration
      
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();
  
      await explorationEditor.createMinimalExploration(
        'Negative Numbers',
        INTERACTION_TYPES.END_EXPLORATION
      );
  
      await explorationEditor.saveExplorationDraft();
      explorationId2= await explorationEditor.publishExplorationWithMetadata(
        'Negative Numbers',
        'This is the goal of exploration.',
        'Math'
      );
      await explorationEditor.waitForPageToFullyLoad();
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();

    }
  
    it(
      'should create and publish two minimal explorations',
      async function () {
          await createAndPublishMinimalExploration();
      },
      DEFAULT_TIMEOUT);

  it('should allow learner to play, rate, and subscribe', async function () {
    expect(explorationId1).not.toBeNull();
    expect(explorationId2).not.toBeNull();
    await learner.navigateToCommunityLibrary();
    await learner.waitForPageToFullyLoad();
    await learner.playExploration(explorationId2);
    await learner.starRateExploration(5);
    await learner.giveFeedback('Super ,fantastic,explorations!!! I loves them',false);
    // Await learner.submitFeedback();
    await learner.navigateToCommunityLibrary();
    await learner.waitForPageToFullyLoad();
    await learner.playExploration(explorationId1);
    await learner.starRateExploration(3);
    await learner.subscribeToCreator('explorationEditor');
    await explorationEditor.reloadPage();
    await explorationEditor.waitForPageToFullyLoad();
    const viewport = explorationEditor.page.viewport();

    if (
      viewport &&
      viewport.width >= testConstants.ViewportWidthBreakpoints.MOBILE_PX
    ) {
    await explorationEditor.switchToListView();
    await explorationEditor.waitForPageToFullyLoad();
   }

  }, DEFAULT_TIMEOUT);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
