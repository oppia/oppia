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
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

describe('Exploration Learner Flow', function () {
  let lessonCreator: ExplorationEditor & LoggedInUser;
  let learner: LoggedInUser;
  let explorationId1: string | null;
  let explorationId2: string | null;

  beforeAll(async function () {
    lessonCreator = await UserFactory.createNewUser(
      'lessonCreator',
      'editor@example.com'
    );

    learner = await UserFactory.createNewUser(
      'learnerUser',
      'learner@example.com'
    );
  }, DEFAULT_TIMEOUT);

  it(
    'should create and publish two minimal explorations',
    async function () {
      await lessonCreator.navigateToCreatorDashboardUsingProfileDropdown();
      await lessonCreator.expectTextToBePresent(
        "It looks like you haven't created any explorations yet. Let's get started!"
      );
      explorationId1 = await lessonCreator.createAndPublishMinimalExploration(
        'Positive Numbers',
        INTERACTION_TYPES.END_EXPLORATION,
        'Positive Numbers',
        'This is the goal of exploration.',
        'Math'
      );
      explorationId2 = await lessonCreator.createAndPublishMinimalExploration(
        'Negative Numbers',
        INTERACTION_TYPES.END_EXPLORATION,
        'Negative Numbers',
        'This is the goal of exploration.',
        'Math'
      );
    },
    DEFAULT_TIMEOUT
  );

  it(
    'should allow learner to play, rate, and subscribe',
    async function () {
      await lessonCreator.expectAverageRatingAndUsersToBe('N/A', 0);
      await lessonCreator.expectTotalPlaysToBe(0);
      await lessonCreator.expectOpenFeedbacksToBe(0);
      await lessonCreator.expectNumberOfSubscribersToBe(0);

      await learner.navigateToCommunityLibrary();
      await learner.playExploration(explorationId2);
      await learner.waitForPageToFullyLoad();
      await learner.starRateExploration(5);
      await learner.giveFeedbackAfterRating(
        'Super, fantastic, explorations!!! I loves them'
      );
      await learner.waitForNetworkIdle();
      await lessonCreator.page.reload();
      await learner.waitForPageToFullyLoad();

      await learner.navigateToCommunityLibrary();
      await learner.playExploration(explorationId1);
      await learner.waitForPageToFullyLoad();
      await learner.starRateExploration(3);
      await learner.waitForPageToFullyLoad();
      await learner.closeFeedbackPopup();
      await learner.subscribeToCreator('lessonCreator');

      await lessonCreator.navigateToCreatorDashboardUsingProfileDropdown();
      await lessonCreator.waitForNetworkIdle();
      await lessonCreator.waitForPageToFullyLoad();
      await lessonCreator.expectAverageRatingAndUsersToBe(4, 2);
      await lessonCreator.expectTotalPlaysToBe(2);
      await lessonCreator.expectOpenFeedbacksToBe(1);
      await lessonCreator.expectNumberOfSubscribersToBe(1);
      await lessonCreator.waitForPageToFullyLoad();
      await lessonCreator.expectExplorationsInGridInOrder([
        'Negative Numbers',
        'Positive Numbers',
      ]);
      await lessonCreator.expectGridCardDetailsToBe(1, '3.0', '0', '1');
      await lessonCreator.expectGridCardDetailsToBe(0, '5.0', '1', '1');
      await lessonCreator.expectScreenshotToMatch(
        'creatorDashboardGridView',
        __dirname
      );

      const viewport = lessonCreator.page.viewport();

      if (
        viewport &&
        viewport.width >= testConstants.ViewportWidthBreakpoints.MOBILE_PX
      ) {
        await lessonCreator.switchToListView();
        await lessonCreator.waitForPageToFullyLoad();
        await lessonCreator.expectExplorationsInListInOrder([
          'Negative Numbers',
          'Positive Numbers',
        ]);
        await lessonCreator.expectListDetailsToBe(0, '5.0', '1', '1');
        await lessonCreator.expectListDetailsToBe(1, '3.0', '0', '1');
        await lessonCreator.expectScreenshotToMatch(
          'creatorDashboardListViewExploration',
          __dirname
        );
      }
    },
    DEFAULT_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
