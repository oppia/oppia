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

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

test.describe.configure({mode: 'serial'});

test.describe('Lesson Creator', function () {
  let lessonCreator: ExplorationEditor & LoggedInUser;
  let learner: LoggedInUser & LoggedOutUser;

  let positiveNumbersExplorationId: string;
  let negativeNumbersExplorationId: string;

  test.beforeAll(async function ({browser}) {
    lessonCreator = await UserFactory.createNewUser(
      'lessonCreator',
      'lessoncreator@example.com',
      browser
    );

    learner = await UserFactory.createNewUser(
      'learner',
      'learner@example.com',
      browser
    );
  });

  test('should view contribution stats', async function () {
    test.setTimeout(600000);
    await lessonCreator.navigateToCreatorDashboardUsingProfileDropdown();
    await lessonCreator.expectCreatorDashboardMessageToBe(
      "It looks like you haven't created any explorations yet. Let's get started!"
    );

    positiveNumbersExplorationId =
      await lessonCreator.createAndPublishAMinimalExplorationWithTitle(
        'Positive Numbers',
        'Math'
      );

    negativeNumbersExplorationId =
      await lessonCreator.createAndPublishAMinimalExplorationWithTitle(
        'Negative Numbers',
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

    await learner.navigateToCommunityLibraryPage();

    await learner.playExplorationAsLoggedInUser(negativeNumbersExplorationId);

    await learner.waitForPageToFullyLoad();

    await learner.rateExploration(5, 'Great Lesson', false);

    await learner.returnToLibraryFromExplorationCompletion();

    await learner.playExplorationAsLoggedInUser(positiveNumbersExplorationId);

    await learner.waitForPageToFullyLoad();

    await learner.rateExploration(3, '', false);

    await learner.openLessonInfoModal();

    await learner.clickOnProfileIconInLessonInfoModel();

    await learner.subscribeToCreator();

    await lessonCreator.reloadPage();

    await lessonCreator.waitForPageToFullyLoad();

    await lessonCreator.expectAverageRatingAndUsersToBe(4, 2);

    await lessonCreator.expectTotalPlaysToBe(2);

    await lessonCreator.expectOpenFeedbacksToBe(1);

    await lessonCreator.expectNumberOfSubscribersToBe(1);
  });

  test('should view explorations in grid view', async function () {
    await lessonCreator.reloadPage();

    await lessonCreator.waitForPageToFullyLoad();

    await lessonCreator.expectExplorationsInGridInOrder([
      'Negative Numbers',
      'Positive Numbers',
    ]);

    await lessonCreator.expectGridCardDetailsToBe(0, '5.0', '1', '1');

    await lessonCreator.expectGridCardDetailsToBe(1, '3.0', '0', '1');

    await lessonCreator.expectScreenshotToMatch('creatorDashboardGridView');
  });

  test('should view explorations in list view', async function () {
    test.skip(
      lessonCreator.isViewportAtMobileWidth(),
      'List view is desktop-only.'
    );
    await lessonCreator.switchToListView();

    await lessonCreator.expectExplorationsInListInOrder([
      'Negative Numbers',
      'Positive Numbers',
    ]);

    await lessonCreator.expectListDetailsToBe(0, '5.0', '1', '1');

    await lessonCreator.expectListDetailsToBe(1, '3.0', '0', '1');

    await lessonCreator.expectScreenshotToMatch('creatorDashboardListView');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
