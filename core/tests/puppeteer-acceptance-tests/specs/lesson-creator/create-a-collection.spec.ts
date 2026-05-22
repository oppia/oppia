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
 * @fileoverview Acceptance test from CUJv3 sheet
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/edit?gid=888982708#gid=888982708
 *
 * LC.12. Visit Creator Dashboard
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

describe('LC.12 Visit Creator Dashboard', function () {
  let lessonCreator: ExplorationEditor & LoggedInUser;
  let learner: LoggedInUser;

  let positiveNumbersExplorationId: string;
  let negativeNumbersExplorationId: string;

  beforeAll(async function () {
    lessonCreator = await UserFactory.createNewUser(
      'lessonCreator',
      'lessoncreator@example.com'
    );

    learner = await UserFactory.createNewUser('learner', 'learner@example.com');
  }, DEFAULT_TIMEOUT);

  it(
    'should view contribution stats',
    async function () {
      await lessonCreator.navigateToCreatorDashboardUsingProfileDropdown();
      await lessonCreator.expectCreatorDashboardMessageToBe(
        "It looks like you haven't created any explorations yet. Let's get started!"
      );

      positiveNumbersExplorationId =
        await lessonCreator.createAndPublishMinimalExploration(
          'Positive Numbers',
          INTERACTION_TYPES.END_EXPLORATION,
          'Positive Numbers',
          'This is the goal of exploration.',
          'Math'
        );

      negativeNumbersExplorationId =
        await lessonCreator.createAndPublishMinimalExploration(
          'Negative Numbers',
          INTERACTION_TYPES.END_EXPLORATION,
          'Negative Numbers',
          'This is the goal of exploration.',
          'Math'
        );

      await lessonCreator.navigateToCreatorDashboardPage();
      await lessonCreator.waitForPageToFullyLoad();
      await lessonCreator.expectAverageRatingAndUsersToBe('N/A', 0);

      await lessonCreator.expectTotalPlaysToBe(0);

      await lessonCreator.expectOpenFeedbacksToBe(0);

      await lessonCreator.expectNumberOfSubscribersToBe(0);

      await lessonCreator.expectExplorationsInGridInOrder([
        'Positive Numbers',
        'Negative Numbers',
      ]);

      await learner.navigateToCommunityLibrary();

      await learner.playExploration(negativeNumbersExplorationId);

      await learner.waitForPageToFullyLoad();

      await learner.starRateExploration(5);

      await learner.giveFeedbackAfterRating('Great Lesson');

      await learner.waitForNetworkIdle();

      await learner.navigateToCommunityLibrary();

      await learner.playExploration(positiveNumbersExplorationId);

      await learner.waitForPageToFullyLoad();

      await learner.starRateExploration(3);

      await learner.closeFeedbackPopup();

      await learner.openLessonInfoModal();

      await learner.visitCreatorProfileFromLessonInfoModal();

      await learner.subscribeToCreator('lessonCreator');

      await lessonCreator.page.reload();

      await lessonCreator.waitForNetworkIdle();

      await lessonCreator.waitForPageToFullyLoad();

      await lessonCreator.expectAverageRatingAndUsersToBe(4, 2);

      await lessonCreator.expectTotalPlaysToBe(2);

      await lessonCreator.expectOpenFeedbacksToBe(1);

      await lessonCreator.expectNumberOfSubscribersToBe(1);
    },
    DEFAULT_TIMEOUT
  );

  it(
    'should view explorations in grid view',
    async function () {
      await lessonCreator.page.reload();

      await lessonCreator.waitForNetworkIdle();

      await lessonCreator.waitForPageToFullyLoad();

      await lessonCreator.expectExplorationsInGridInOrder([
        'Negative Numbers',
        'Positive Numbers',
      ]);

      await lessonCreator.waitForPageToFullyLoad();

      await lessonCreator.expectGridCardDetailsToBe(0, '5.0', '1', '1');

      await lessonCreator.expectGridCardDetailsToBe(1, '3.0', '0', '1');

      await lessonCreator.expectScreenshotToMatch(
        'creatorDashboardGridView',
        __dirname
      );
    },
    DEFAULT_TIMEOUT
  );

  it(
    'should view explorations in list view',
    async function () {
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
          'creatorDashboardListView',
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
