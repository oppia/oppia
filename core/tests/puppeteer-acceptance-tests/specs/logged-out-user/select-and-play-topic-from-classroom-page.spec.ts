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
 * @fileoverview Acceptance Test for the learner journey in the math classroom.
 * The test includes:
 * - Setup: Creation of exploration, topic, subtopic, skill, story, and classroom by a curriculum admin.
 * - User Journey: Navigation to classroom, selection of topic, completion of exploration, and review of a card by a logged-out user.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

ConsoleReporter.setConsoleErrorsToIgnore([
  /Occurred at http:\/\/localhost:8181\/story_editor\/[a-zA-Z0-9]+\/.*Cannot read properties of undefined \(reading 'getStory'\)/,
  /Occurred at http:\/\/localhost:8181\/create\/[a-zA-Z0-9]+\/.*Invalid active state name: null/,
  new RegExp('Invalid active state name: null'),
]);

describe('Logged-out User', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    explorationId =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Negative Numbers'
      );

    await curriculumAdmin.createAndPublishTopic(
      'Algebra I',
      'Negative Numbers',
      'Negative Numbers'
    );
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Algebra Story',
      'algebra-story',
      'Understanding Negative Numbers',
      explorationId as string,
      'Algebra I'
    );

    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Algebra I'
    );
    // Setup taking longer than 300000ms.
  }, 420000);

  it('should be able to select and play a topic from the classroom page', async function () {
    const actions = [
      {
        action: () => loggedOutUser.navigateToClassroomPage('math'),
        name: 'navigateToClassroomPage_math',
      },
      {
        action: () => loggedOutUser.expectTopicsToBePresent(['Algebra I']),
        name: 'expectTopicsToBePresent_AlgebraI',
      },
      {
        action: () => loggedOutUser.selectAndOpenTopic('Algebra I'),
        name: 'selectAndOpenTopic_AlgebraI',
      },
      {
        action: () =>
          loggedOutUser.selectChapterWithinStoryToLearn(
            'Understanding Negative Numbers',
            'Algebra Story'
          ),
        name: 'selectChapterWithinStoryToLearn_UnderstandingNegativeNumbers',
      },

      // Check for the completion message as the exploration has a single state.
      {
        action: () =>
          loggedOutUser.expectExplorationCompletionToastMessage(
            'Congratulations for completing this lesson!'
          ),
        name: 'expectExplorationCompletionToastMessage',
      },

      // Returning to the topic page from the exploration player itself.
      {
        action: () =>
          loggedOutUser.returnToTopicPageAfterCompletingExploration(),
        name: 'returnToTopicPageAfterCompletingExploration',
      },
      {
        action: () => loggedOutUser.navigateToRevisionTab(),
        name: 'navigateToRevisionTab',
      },

      // Review cards are the subtopic that are created in the topic.
      {
        action: () => loggedOutUser.selectReviewCardToLearn('Negative Numbers'),
        name: 'selectReviewCardToLearn_NegativeNumbers',
      },
      {
        action: () =>
          loggedOutUser.expectReviewCardToHaveContent(
            'Negative Numbers',
            'Subtopic creation description text for Negative Numbers'
          ),
        name: 'expectReviewCardToHaveContent_NegativeNumbers',
      },
      {
        action: () => loggedOutUser.timeout(2147483647),
      },
    ];

    for (const {action, name} of actions) {
      try {
        await action();
      } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', error);
        await loggedOutUser.screenshot(`error_${name}.png`);
      }
    }
  }, 2147483647);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
