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
 * EL.SL. Learner can share the lesson from the new lesson player
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const LESSON_ATTRIBUTION_PRINT = (explorationId: string | null) =>
  `"What are the Place Values?" by curriculumAdm. Oppia. http://localhost:8181/lesson/${explorationId}`;

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

  it('should be able to share the lesson using copy link', async function () {
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.clickOpenOptions();
    await loggedOutLearner.isTextVisibleToUser('Close options');
    // Expect lesson description is present on the page.
    await loggedOutLearner.isTextVisibleToUser(
      'Learn basic Mathematics including Place Values'
    );
    // Expect Share and Feedback button is visible.
    await loggedOutLearner.isTextVisibleToUser('Share this lesson');
    await loggedOutLearner.isTextVisibleToUser('Feedback');
    // Expect report button is not displayed.
    expect(await loggedOutLearner.isReportButtonVisible()).toBe(false);

    // Click on share and copy link.
    await loggedOutLearner.clickShareLessonButton();
    await loggedOutLearner.expectShareLessonModal();

    await loggedOutLearner.clickCopyLinkButton();
    await loggedOutLearner.expectLinkCopiedMessage();
    await loggedOutLearner.expectScreenshotToMatch(
      'newLessonPlayerShareLessonLinkCopy',
      __dirname
    );
    const newBrowserTab = await loggedOutLearner.openCopiedLink();

    // Expect lesson name present in new tab.
    await loggedOutLearner.isTextVisibleToUser(
      'What are the Place Values?',
      newBrowserTab
    );
    await newBrowserTab.close();
    await loggedOutLearner.closeShareModal();
  });

  it('should be able to share the lesson on Google Classroom', async function () {
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.clickOpenOptions();
    await loggedOutLearner.clickShareLessonButton();
    await loggedOutLearner.expectShareLessonModal();

    await loggedOutLearner.shareViaGoogleClassroomAndVerifyURL();
    await loggedOutLearner.closeShareModal();
  });

  it('should be able to share the lesson on Facebook', async function () {
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.clickOpenOptions();
    await loggedOutLearner.clickShareLessonButton();
    await loggedOutLearner.expectShareLessonModal();

    await loggedOutLearner.shareViaFacebookAndVerifyURL();
    await loggedOutLearner.closeShareModal();
  });

  it('should be able to claim the lesson attribution', async function () {
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.clickOpenOptions();
    await loggedOutLearner.clickShareLessonButton();
    await loggedOutLearner.expectShareLessonModal();

    await loggedOutLearner.clickOnHowToAttributeThisLesson();
    await loggedOutLearner.isTextVisibleToUser(
      'Generate Creative Commons Attribution'
    );
    await loggedOutLearner.verifyAttributionText(
      LESSON_ATTRIBUTION_PRINT(explorationId)
    );

    await loggedOutLearner.copyAttributionAndVerify(
      LESSON_ATTRIBUTION_PRINT(explorationId)
    );
    await loggedOutLearner.closeShareModal();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
