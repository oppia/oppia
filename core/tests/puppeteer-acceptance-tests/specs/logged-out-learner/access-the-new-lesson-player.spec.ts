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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * EL.LP.  Learner can access the new lesson player
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const ROLES = testConstants.Roles;

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  FRACTION_INPUT = 'Fraction Input',
  END_EXPLORATION = 'End Exploration',
}

describe('Logged-Out Learner', function () {
  let explorationId: string;
  let loggedOutLearner: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(
    async function () {
      loggedOutLearner = await UserFactory.createLoggedOutUser();

      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculumAdm@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );

      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordinator1',
        'releaseCoordinator1@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );

      // Enable the feature flag.
      await releaseCoordinator.enableFeatureFlag('new_lesson_player');

      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
      // Add Interaction Cards.
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.updateCardContent(
        'Welcome, to the Place Values Exploration.'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard('Second Card');

      await curriculumAdmin.navigateToCard('Second Card');
      await curriculumAdmin.updateCardContent(
        "What is 3/6 equal to in it's simplest form?"
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
      await curriculumAdmin.addResponsesToTheInteraction(
        INTERACTION_TYPES.FRACTION_INPUT,
        '2',
        'Correct!',
        'Final Card',
        true
      );
      await curriculumAdmin.editDefaultResponseFeedbackInExplorationEditorPage(
        'Incorrect, try again!'
      );
      await curriculumAdmin.navigateToCard('Final Card');
      await curriculumAdmin.updateCardContent(
        'You have successfully completed the lesson!'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
      await curriculumAdmin.saveExplorationDraft();
      explorationId = await curriculumAdmin.publishExplorationWithMetadata(
        'What are the Place Values?',
        'Learn basic Mathematics including Place Values',
        'Mathematics'
      );

      if (!explorationId) {
        throw new Error('Exploration ID is null or undefined.');
      }
    },
    // Setup takes more time than default.
    1000000
  );

  it('should not be able to access non-existent lesson', async function () {
    // Try navigating to a non-existent lesson player.
    const wrongExplorationId =
      explorationId?.slice(5) ?? '' + explorationId?.slice(0, 5);

    await loggedOutLearner.playLesson(wrongExplorationId);
    await loggedOutLearner.expectToBeOnErrorPage(404);
  });

  it('should be able to access existent lesson', async function () {
    // Navigate to lesson, verify URL, and match screenshot.
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.expectToBeOnPage('/lesson/');

    await loggedOutLearner.expectScreenshotToMatch(
      'lessonPlayerPage',
      __dirname
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
