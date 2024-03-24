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
 * @fileoverview Acceptance Test for checking if logged-in users
 * can add exploration to play later and remove it from learner dashboard
 * can report the exploration
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {LoggedInUser} from '../../user-utilities/logged-in-users-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged-in User', function () {
  let testLearner: LoggedInUser;
  let explorationCreator: LoggedInUser;

  beforeAll(async function () {
    testLearner = await UserFactory.createNewUser(
      'testLearner',
      'test_user@example.com'
    );
    explorationCreator = await UserFactory.createNewUser(
      'explorationCreator',
      'exploration_creator@example.com'
    );

    await explorationCreator.createEndExploration();
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should add exploration to play later then remove it and report it',
    async function () {
      await testLearner.navigateToCommunityLibraryPage();
      await testLearner.findExplorationInCommunityLibrary('Test Exploration');
      await testLearner.addExplorationToPlayLater();

      await testLearner.navigateToLearnerDashboardPage();
      await testLearner.openCommunityLessonsTab();
      await testLearner.expectExplorationWithTitleToBePresentInPlayLater(
        'Test Exploration',
        true
      );
      await testLearner.removeExplorationFromPlayLater();
      await testLearner.expectExplorationWithTitleToBePresentInPlayLater(
        'Test Exploration',
        false
      );

      await testLearner.searchAndOpenExplorationFromCommunityLibrary(
        'Test Exploration'
      );
      await testLearner.expectReachedTheEndOfExploration();
      await testLearner.reportTheExploration('Testing the functionality');

      await testLearner.giveFeedbackToExploration(
        'Testing Feedback functionality'
      );

      await explorationCreator.openExplorationEditor('Test Exploration');
      await explorationCreator.checkUserFeedback('testLearner');
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
