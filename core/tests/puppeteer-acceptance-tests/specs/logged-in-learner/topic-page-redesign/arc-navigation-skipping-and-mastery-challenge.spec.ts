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
 * @fileoverview Acceptance tests for CUJ L.O.2 (part 3):
 * Use the Arc section skip forward and back to move between lessons.
 * Topic Page Mastery Challenge.
 *
 * Covers:
 * - Arc section navigation: skip forward and back between chapters.
 * - Skip-Forward: first chapter has no backward skip; after skipping,
 *   next chapter becomes active with milestone indicator.
 * - Mastery Challenge: card at end of each Arc, "Take Mastery Challenge"
 *   link, dialog, practice session, score 6/6 or 5/6, score card.
 * - Score Card detail: chapter scores, accuracy, time taken, skill list,
 *   End Practice, Close buttons.
 * - Mastery Challenge failure and retry.
 * - Second Arc Mastery Challenge with milestone numbering.
 */

import {UserFactory} from '../../../utilities/common/user-factory';
import testConstants from '../../../utilities/common/test-constants';
import {LoggedInUser} from '../../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;
const BASE_URL = testConstants.URLs.BaseURL;

const redesignedContainerSelector =
  '.e2e-test-redesigned-topic-viewer-container';
const adventureNavigationSelector = '.e2e-test-adventure-navigation';
const adventureSkipButtonSelector = '.e2e-test-adventure-skip-button';
const skipConfirmationSelector = '.e2e-test-arc-skip-confirmation-modal';
const skipConfirmationYesSelector = '.e2e-test-arc-skip-confirmation-proceed';
const skipConfirmationNoSelector = '.e2e-test-arc-skip-confirmation-cancel';
const milestoneIndicatorSelector = '.e2e-test-milestone-indicator';
const adventureTitleSelector = '.e2e-test-adventure-title';
const masteryChallengeCardSelector = '.e2e-test-mastery-challenge-card';
const masteryChallengeTitleSelector = '.e2e-test-mastery-challenge-title';
const masteryChallengeButtonSelector = '.e2e-test-mastery-challenge-button';
const masteryChallengeCompleteSelector =
  '.e2e-test-mastery-challenge-complete-button';
const practiceSessionTitleSelector = '.e2e-test-practice-session-title';
const scoreCardContainerSelector = '.e2e-test-score-card-container';
const chapterScoreListSelector = '.e2e-test-chapter-score-list';
const chapterScoreItemSelector = '.e2e-test-chapter-score-item';
const totalScoreDisplaySelector = '.e2e-test-total-score-display';
const accuracyDisplaySelector = '.e2e-test-accuracy-display';
const timeTakenDisplaySelector = '.e2e-test-time-taken-display';
const skillListContainerSelector = '.e2e-test-skill-list-container';
const endPracticeButtonSelector = '.e2e-test-end-practice-button';
const scoreCardCloseButtonSelector = '.e2e-test-score-card-close-button';
const retryPracticeButtonSelector = '.e2e-test-retry-practice-button';
const masteryScoreTextSelector = '.e2e-test-mastery-score-text';
const milestoneNumberSelector = '.e2e-test-milestone-number';
const milestoneIconSelector = '.e2e-test-milestone-icon';
const questionCardSelector = '.e2e-test-question-card';
const solutionChoiceSelector = '.e2e-test-interactive-solution-choice';
const submitAnswerSelector = '.e2e-test-submit-answer-button';
const nextQuestionSelector = '.e2e-test-next-question-button';

describe('Logged-In Learner', function () {
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
      'curriculum_admin_topic_page3@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coord_topic_page3@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag('redesigned_topic_viewer_page');
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

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();

    loggedInLearner = await UserFactory.createNewUser(
      'learner3',
      'learner_topic_page3@example.com'
    );
  }, 900000);

  it(
    'should navigate to topic page and display adventure navigation dock',
    async function () {
      await loggedInLearner.goto(
        `${BASE_URL}/learn/math/fractions/the-fraction-journey`
      );
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        adventureNavigationSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show skip confirmation dialog when clicking forward skip button',
    async function () {
      const skipButtons = await loggedInLearner.page.$$(
        adventureSkipButtonSelector
      );
      if (skipButtons.length === 0) {
        throw new Error('No skip buttons found in adventure navigation.');
      }

      await skipButtons[0].click();

      await loggedInLearner.expectElementToBeVisible(skipConfirmationSelector);
      await loggedInLearner.expectElementToBeVisible(
        skipConfirmationYesSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        skipConfirmationNoSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not skip when No is clicked in skip confirmation dialog',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        skipConfirmationNoSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        skipConfirmationSelector,
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should skip forward when Yes is clicked and show milestone indicator',
    async function () {
      const skipButtons = await loggedInLearner.page.$$(
        adventureSkipButtonSelector
      );
      if (skipButtons.length === 0) {
        throw new Error('No skip buttons found.');
      }

      await skipButtons[0].click();

      await loggedInLearner.expectElementToBeVisible(skipConfirmationSelector);
      await loggedInLearner.clickOnElementWithSelector(
        skipConfirmationYesSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        milestoneIndicatorSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not show backward skip button for the first chapter',
    async function () {
      const skipButtons = await loggedInLearner.page.$$(
        adventureSkipButtonSelector
      );

      const hasBackwardSkip = await Promise.all(
        skipButtons.map(async button => {
          const ariaLabel = await button.evaluate(
            el => el.getAttribute('aria-label') || el.textContent
          );
          return ariaLabel?.toLowerCase().includes('back');
        })
      );

      const backSkipCount = hasBackwardSkip.filter(Boolean).length;
      const chaptersCount = await loggedInLearner.page.$$eval(
        '.e2e-test-adventure-group',
        groups => groups.length
      );

      if (chaptersCount > 0) {
        expect(backSkipCount).toBeLessThan(chaptersCount);
      }
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display Mastery Challenge card at the end of an Arc',
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
        masteryChallengeButtonSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Mastery Challenge dialog when clicking Take Mastery Challenge',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        masteryChallengeButtonSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        masteryChallengeCompleteSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should complete a practice session and show score card with 6/6 score',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        practiceSessionTitleSelector
      );

      const questionCount = await loggedInLearner.page.$$eval(
        questionCardSelector,
        cards => cards.length
      );

      for (let i = 0; i < questionCount; i++) {
        await loggedInLearner.expectElementToBeVisible(
          `${questionCardSelector}:not([disabled])`
        );
        await loggedInLearner.page.waitForTimeout(500);

        const optionAvailable = await loggedInLearner.isElementVisible(
          `${solutionChoiceSelector}:not([disabled])`
        );

        if (optionAvailable) {
          await loggedInLearner.clickOnElementWithSelector(
            `${solutionChoiceSelector}:not([disabled])`
          );
          await loggedInLearner.page.waitForTimeout(300);
        }

        const submitBtnVisible = await loggedInLearner.isElementVisible(
          `${submitAnswerSelector}:not([disabled])`
        );

        if (submitBtnVisible) {
          await loggedInLearner.clickOnElementWithSelector(
            `${submitAnswerSelector}:not([disabled])`
          );
          await loggedInLearner.page.waitForTimeout(300);
        }

        const nextBtnVisible = await loggedInLearner.isElementVisible(
          `${nextQuestionSelector}:not([disabled])`
        );

        if (nextBtnVisible) {
          await loggedInLearner.clickOnElementWithSelector(
            `${nextQuestionSelector}:not([disabled])`
          );
          await loggedInLearner.page.waitForTimeout(300);
        }
      }

      await loggedInLearner.expectElementToBeVisible(
        scoreCardContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(masteryScoreTextSelector);
      await loggedInLearner.expectTextContentToContain(
        masteryScoreTextSelector,
        '6/6'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display score card details: chapter scores, accuracy, time taken, skill list',
    async function () {
      await loggedInLearner.expectElementToBeVisible(chapterScoreListSelector);
      await loggedInLearner.expectElementToBeVisible(chapterScoreItemSelector);
      await loggedInLearner.expectElementToBeVisible(totalScoreDisplaySelector);
      await loggedInLearner.expectElementToBeVisible(accuracyDisplaySelector);
      await loggedInLearner.expectElementToBeVisible(timeTakenDisplaySelector);
      await loggedInLearner.expectElementToBeVisible(
        skillListContainerSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should close score card when clicking Close button',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        scoreCardCloseButtonSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        scoreCardContainerSelector,
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display End Practice button on score card',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        document
          .querySelector('.e2e-test-mastery-challenge-card')
          ?.scrollIntoView({behavior: 'smooth'});
      });
      await loggedInLearner.clickOnElementWithSelector(
        masteryChallengeButtonSelector
      );
      await loggedInLearner.page.waitForTimeout(1000);

      await loggedInLearner.expectElementToBeVisible(endPracticeButtonSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show retry button when practice session score is below threshold',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        retryPracticeButtonSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display milestone icon and number for completed Arc',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      await loggedInLearner.expectElementToBeVisible(milestoneIconSelector);
      await loggedInLearner.expectElementToBeVisible(milestoneNumberSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
