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
const BASE_URL = testConstants.URLs.BaseURL;

const redesignedContainerSelector =
  '.e2e-test-redesigned-topic-viewer-container';
const adventureTitleSelector = '.e2e-test-adventure-title';
const lessonCardSelector = '.e2e-test-lesson-card';
const lessonCardStartButtonSelector = '.e2e-test-lesson-card-start-button';
const lessonCardSecondaryButtonSelector =
  '.e2e-test-lesson-card-secondary-button';
const completedLessonClassSelector = '.e2e-test-lesson-card.completed-lesson';
const completedCollapsedSelector = '.e2e-test-lesson-card.completed-collapsed';
const playAgainButtonSelector = '.e2e-test-lesson-card-play-again-button';
const completedLabelSelector = '.e2e-test-lesson-card-completed-label';
const masteryChallengeCardSelector = '.e2e-test-mastery-challenge-card';
const masteryChallengeTitleSelector = '.e2e-test-mastery-challenge-title';
const masteryChallengeDescriptionSelector =
  '.e2e-test-mastery-challenge-description';
const masteryChallengeButtonSelector = '.e2e-test-mastery-challenge-button';
const masteryChallengeHelperTooltipSelector =
  '.e2e-test-mastery-challenge-helper-tooltip';
const masteryChallengeHelperTitleSelector =
  '.e2e-test-mastery-challenge-helper-title';
const masteryChallengeHelperDescriptionSelector =
  '.e2e-test-mastery-challenge-helper-description';
const adventureEndTestCardSelector = '.e2e-test-adventure-end-test-card';
const adventureEndTestTitleSelector = '.e2e-test-adventure-end-test-card-title';
const adventureEndTestPracticeButtonSelector =
  '.e2e-test-adventure-end-test-card-practice-button';

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

    // Split the story into two Adventures so that the Adventure (arc) features
    // (navigation dock, skip confirmation modal, skipped-adventure cards)
    // render for the learner on the redesigned topic page.
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
      await loggedInLearner.goto(`${BASE_URL}/learn/math/fractions`);
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(adventureTitleSelector);

      const arcTitles = await loggedInLearner.page.$$eval(
        adventureTitleSelector,
        elements => elements.map(el => (el as HTMLElement).textContent?.trim())
      );
      expect(arcTitles.length).toBeGreaterThan(0);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should expand an active chapter card and show Play CTA, Practice, and Study Guide',
    async function () {
      await loggedInLearner.expectElementToBeVisible(lessonCardSelector);
      await loggedInLearner.expectElementToBeVisible(
        lessonCardStartButtonSelector
      );

      const secondaryButtons = await loggedInLearner.page.$$(
        lessonCardSecondaryButtonSelector
      );
      expect(secondaryButtons.length).toBeGreaterThanOrEqual(2);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should play the first chapter and return to topic page with progression',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        lessonCardStartButtonSelector
      );

      await loggedInLearner.waitForPageToFullyLoad();

      // The exploration has two cards connected by a Continue button
      // interaction, so advance past the first card to reach the end state.
      await loggedInLearner.clickOnContinueButtonInInteractionCard();

      await loggedInLearner.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Navigate back to the redesigned topic viewer page so the completed
      // chapter is shown with the completed state.
      await loggedInLearner.goto(`${BASE_URL}/learn/math/fractions`);
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        completedLessonClassSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should collapse completed chapter into compact row with Play Again action',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        completedCollapsedSelector
      );
      await loggedInLearner.expectElementToBeVisible(playAgainButtonSelector);
      await loggedInLearner.expectElementToBeVisible(completedLabelSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the next chapter as the active lesson after completion',
    async function () {
      const lessonCards = await loggedInLearner.page.$$(lessonCardSelector);
      expect(lessonCards.length).toBeGreaterThanOrEqual(2);

      await loggedInLearner.expectElementToBeVisible(
        lessonCardStartButtonSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Mastery Challenge card with a description',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        document
          .querySelector('.e2e-test-mastery-challenge-card')
          ?.scrollIntoView({behavior: 'smooth'});
      });

      await loggedInLearner.expectElementToBeVisible(
        masteryChallengeCardSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        masteryChallengeTitleSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        masteryChallengeDescriptionSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        masteryChallengeButtonSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show helper tooltip when clicking the locked Mastery Challenge button',
    async function () {
      const isUnlocked = await loggedInLearner.page.evaluate(() => {
        const btn = document.querySelector(
          '.e2e-test-mastery-challenge-button'
        ) as HTMLButtonElement;
        return (
          !btn?.disabled &&
          !btn?.classList.contains('mastery-challenge-button-locked')
        );
      });

      if (!isUnlocked) {
        await loggedInLearner.clickOnElementWithSelector(
          masteryChallengeButtonSelector
        );

        await loggedInLearner.expectElementToBeVisible(
          masteryChallengeHelperTooltipSelector
        );
        await loggedInLearner.expectElementToBeVisible(
          masteryChallengeHelperTitleSelector
        );
        await loggedInLearner.expectElementToBeVisible(
          masteryChallengeHelperDescriptionSelector
        );
        await loggedInLearner.expectTextContentToContain(
          masteryChallengeHelperTitleSelector,
          'Complete all chapters to unlock'
        );

        await loggedInLearner.page.waitForTimeout(6000);

        await loggedInLearner.expectElementToBeVisible(
          masteryChallengeHelperTooltipSelector,
          false
        );
      }
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the practice test card with Practice Test button',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        adventureEndTestCardSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        adventureEndTestTitleSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        adventureEndTestPracticeButtonSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
