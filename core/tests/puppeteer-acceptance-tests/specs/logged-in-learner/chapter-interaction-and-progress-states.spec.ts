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
 * @fileoverview Acceptance tests for CUJ L.O.2 (part 2):
 * Look down the timeline and choose a lesson.
 *
 * Covers:
 * - Arc headers and chapter card expansion with description, Play CTA,
 *   Practice, and Study Guide actions.
 * - Complete a lesson and verify chapter progression (collapsed row,
 *   completed indicator, Play Again action).
 * - Mastery Challenge card with description and helper tooltip when locked.
 * - Mastery Challenge unlocks after completing all chapters and navigates to
 *   the practice session.
 * - Practice test card with Practice Test button.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let firstExplorationId: string | null;
  let secondExplorationId: string | null;
  let thirdExplorationId: string | null;
  let fourthExplorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin_topic_page2@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coord_topic_page2@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag('redesigned_topic_viewer_page');
    await releaseCoordinator.enableFeatureFlag('story_editor_arcs');
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'Learn about fractions, arithmetic, and more.'
    );

    await curriculumAdmin.createAndPublishTopic(
      'Fractions',
      'Fraction subtopics',
      'Fraction skills'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Fractions');
    await curriculumAdmin.publishClassroom('Math');

    firstExplorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Introduction to Fractions',
        'Algebra'
      );
    secondExplorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Adding Fractions',
        'Algebra'
      );
    thirdExplorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Subtracting Fractions',
        'Algebra'
      );
    fourthExplorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Multiplying Fractions',
        'Algebra'
      );

    await curriculumAdmin.addStoryToTopic(
      'The Fraction Journey',
      'the-fraction-journey',
      'Fractions'
    );

    await curriculumAdmin.addChapter(
      'Introduction to Fractions',
      firstExplorationId as string
    );
    await curriculumAdmin.addChapter(
      'Adding Fractions',
      secondExplorationId as string
    );
    await curriculumAdmin.addChapter(
      'Subtracting Fractions',
      thirdExplorationId as string
    );
    await curriculumAdmin.addChapter(
      'Multiplying Fractions',
      fourthExplorationId as string
    );

    await curriculumAdmin.splitIntoAdventure('Introduction to Fractions');

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();

    loggedInLearner = await UserFactory.createNewUser(
      'learner2',
      'learner_topic_page2@example.com'
    );
  }, 900000);

  it(
    'should display bold thematic Arc headers on the timeline',
    async function () {
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectArcTitlesToBeVisibleOnTimeline();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should expand an active chapter card and show Play CTA, Practice, and Study Guide',
    async function () {
      await loggedInLearner.expectActiveChapterCardToShowStartAndSecondaryActions(
        2
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should play the first chapter and return to topic page with progression',
    async function () {
      await loggedInLearner.clickOnActiveChapterStartButton();

      // The exploration has two cards connected by a Continue button
      // interaction, so advance past the first card to reach the end state.
      await loggedInLearner.clickOnContinueButtonInInteractionCard();

      await loggedInLearner.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Navigate back to the redesigned topic viewer page so the completed
      // chapter is shown with the completed state.
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectCompletedLessonToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should collapse completed chapter into compact row with Play Again action',
    async function () {
      await loggedInLearner.expectCompletedChapterToBeCollapsed();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the next chapter as the active lesson after completion',
    async function () {
      await loggedInLearner.expectNextChapterToBeActive();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Mastery Challenge card with a description',
    async function () {
      await loggedInLearner.scrollMasteryChallengeCardIntoView();
      await loggedInLearner.expectMasteryChallengeCardToShowDescription();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show helper tooltip when clicking the locked Mastery Challenge button',
    async function () {
      await loggedInLearner.clickLockedMasteryChallengeButtonAndExpectHelperTooltip();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should unlock the Mastery Challenge and navigate to the practice session after completing all chapters',
    async function () {
      // Complete the remaining three chapters (2, 3, and 4) by playing them, as
      // done for the first chapter above. The Mastery Challenge unlocks only
      // after every published chapter is completed.
      for (let completedCount = 0; completedCount < 3; completedCount++) {
        await loggedInLearner.waitForPageToFullyLoad();
        await loggedInLearner.clickOnActiveChapterStartButton();
        await loggedInLearner.clickOnContinueButtonInInteractionCard();
        await loggedInLearner.expectExplorationCompletionToastMessage(
          'Congratulations for completing this lesson!'
        );
        await loggedInLearner.openTopicPage('math', 'fractions');
        await loggedInLearner.expectCompletedLessonToBeVisible();
      }

      await loggedInLearner.scrollMasteryChallengeCardIntoView();
      await loggedInLearner.expectMasteryChallengeToBeUnlocked();
      await loggedInLearner.clickMasteryChallengeAndNavigateToPracticeSession();

      // Return to the topic page so the final test can run against the topic
      // page, where the Mastery Challenge now stays unlocked for this learner.
      await loggedInLearner.openTopicPage('math', 'fractions');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the practice test card with Practice Test button',
    async function () {
      await loggedInLearner.expectPracticeTestCardToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
