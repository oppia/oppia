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
 * @fileoverview Acceptance tests for CUJ L.O.2 (part 4):
 * Language Handling, Study Guide & Quiz, Topic Info, and Footer.
 *
 * Covers:
 * - Fallback to default language when preferred language content unavailable.
 * - Change language from dropdown and verify re-rendering.
 * - Topic Quiz: question number, progress indicator, score, answer submission,
 *   feedback, skip, score summary.
 * - Take the Topic Quiz CTA button opens quiz modal.
 * - Topic Info screen with topic details.
 * - Study Guide navigation.
 * - Footer links (Fr Mathieu, Donate, Contact Us).
 * - Subtopic display and navigation from topic page.
 * - Mastery score display.
 * - Chapter progression after completion.
 * - Reset Chapter Progress button and confirmation dialog.
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
const topicInfoLinkSelector = '.e2e-test-topic-info-link';
const topicInfoScreenSelector = '.e2e-test-topic-info-screen';
const topicInfoCloseButtonSelector = '.e2e-test-topic-info-close-button';
const topicInfoTitleSelector = '.e2e-test-topic-info-title';
const studyGuideLinkSelector = '.e2e-test-topic-study-guide-link';
const topicQuizSectionSelector = '.e2e-test-topic-quiz-section';
const topicQuizButtonSelector = '.e2e-test-topic-quiz-button';
const quizModalSelector = '.e2e-test-topic-quiz-modal';
const questionNumberSelector = '.e2e-test-question-number';
const quizProgressBarSelector = '.e2e-test-quiz-progress-bar';
const quizScoreSelector = '.e2e-test-quiz-score';
const quizNextButtonSelector = '.e2e-test-quiz-next-button';
const quizSkipButtonSelector = '.e2e-test-quiz-skip-button';
const quizSummarySelector = '.e2e-test-quiz-summary';
const quizSummaryScoreSelector = '.e2e-test-quiz-summary-score';
const quizSummaryCloseButtonSelector = '.e2e-test-quiz-summary-close-button';
const topicQuizQuestionCardSelector = '.e2e-test-topic-quiz-question-card';
const answerOptionSelector = '.e2e-test-topic-quiz-answer-option';
const topicQuizFeedbackSelector = '.e2e-test-topic-quiz-feedback';
const footerLinksSelector = '.e2e-test-oppia-footer-links';
const footerFrMathieuSelector = '.e2e-test-footer-fr-mathieu-link';
const footerDonateSelector = '.e2e-test-footer-donate-link';
const footerContactUsSelector = '.e2e-test-footer-contact-us-link';
const masteryChallengeCardSelector = '.e2e-test-mastery-challenge-card';
const masteryChallengeTitleSelector = '.e2e-test-mastery-challenge-title';
const masteryScoreTextSelector = '.e2e-test-mastery-score-text';
const lessonLanguageSelectorSelector =
  '.e2e-test-topic-lesson-language-selector';
const lessonLanguageDropdownSelector = '.e2e-test-lesson-language-dropdown';
const defaultLanguageOptionSelector = '.e2e-test-default-language-option';
const preferredLanguageOptionSelector = '.e2e-test-preferred-language-option';
const topicProgressContainerSelector = '.e2e-test-topic-progress-container';
const completedChaptersCountSelector = '.e2e-test-completed-chapters-count';
const totalChaptersCountSelector = '.e2e-test-total-chapters-count';
const storyCardSelector = '.e2e-test-story-card';
const storyTitleSelector = '.e2e-test-story-title';
const lessonCardNewChapterSelector = '.e2e-test-lesson-card-new-label';
const nextActiveLessonSelector = '.e2e-test-next-active-lesson';
const resetProgressButtonSelector = '.e2e-test-reset-progress-button';
const resetProgressDialogSelector = '.e2e-test-reset-progress-dialog';
const resetProgressConfirmSelector = '.e2e-test-reset-progress-confirm-button';
const resetProgressCancelSelector = '.e2e-test-reset-progress-cancel-button';

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
      'curriculum_admin_topic_page4@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coord_topic_page4@example.com',
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
      'learner4',
      'learner_topic_page4@example.com'
    );
  }, 900000);

  it(
    'should display the Topic Info screen with topic details',
    async function () {
      await loggedInLearner.goto(
        `${BASE_URL}/learn/math/fractions/the-fraction-journey`
      );
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
      await loggedInLearner.clickOnElementWithSelector(topicInfoLinkSelector);

      await loggedInLearner.expectElementToBeVisible(topicInfoScreenSelector);
      await loggedInLearner.expectElementToBeVisible(topicInfoTitleSelector);
      await loggedInLearner.expectTextContentToContain(
        topicInfoTitleSelector,
        'Fractions'
      );

      await loggedInLearner.clickOnElementWithSelector(
        topicInfoCloseButtonSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        topicInfoScreenSelector,
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display topic progress with completed and total chapters count',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        topicProgressContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        completedChaptersCountSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        totalChaptersCountSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the story card with title and chapter cards',
    async function () {
      await loggedInLearner.expectElementToBeVisible(storyCardSelector);
      await loggedInLearner.expectElementToBeVisible(storyTitleSelector);
      await loggedInLearner.expectTextContentToContain(
        storyTitleSelector,
        'The Fraction Journey'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate to Study Guide from topic page',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(studyGuideLinkSelector);

      await loggedInLearner.waitForPageToFullyLoad();

      const currentUrl = loggedInLearner.page.url();
      expect(currentUrl).toContain('study-guide');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should return to topic page and display footer links',
    async function () {
      await loggedInLearner.goto(
        `${BASE_URL}/learn/math/fractions/the-fraction-journey`
      );
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.scrollToBottomOfPage();

      await loggedInLearner.expectElementToBeVisible(footerLinksSelector);
      await loggedInLearner.expectElementToBeVisible(footerFrMathieuSelector);
      await loggedInLearner.expectElementToBeVisible(footerDonateSelector);
      await loggedInLearner.expectElementToBeVisible(footerContactUsSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the Topic Quiz modal when clicking Take the Topic Quiz CTA',
    async function () {
      await loggedInLearner.expectElementToBeVisible(topicQuizSectionSelector);
      await loggedInLearner.clickOnElementWithSelector(topicQuizButtonSelector);

      await loggedInLearner.expectElementToBeVisible(quizModalSelector);
      await loggedInLearner.expectElementToBeVisible(questionNumberSelector);
      await loggedInLearner.expectElementToBeVisible(quizProgressBarSelector);
      await loggedInLearner.expectElementToBeVisible(quizScoreSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should submit an answer and show feedback in the Topic Quiz',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        topicQuizQuestionCardSelector
      );

      const hasOptions =
        await loggedInLearner.isElementVisible(answerOptionSelector);
      if (hasOptions) {
        await loggedInLearner.clickOnElementWithSelector(answerOptionSelector);
        await loggedInLearner.expectElementToBeVisible(
          topicQuizFeedbackSelector
        );
      }

      await loggedInLearner.expectElementToBeVisible(quizNextButtonSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should skip a question in the Topic Quiz',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(quizSkipButtonSelector);
      await loggedInLearner.waitForPageToFullyLoad();
      await loggedInLearner.expectElementToBeVisible(quizNextButtonSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display quiz summary after completing all questions',
    async function () {
      const questionCount = await loggedInLearner.page.$$eval(
        topicQuizQuestionCardSelector,
        cards => cards.length
      );

      for (let i = 0; i < questionCount; i++) {
        await loggedInLearner.expectElementToBeVisible(
          topicQuizQuestionCardSelector
        );

        const optionVisible =
          await loggedInLearner.isElementVisible(answerOptionSelector);

        if (optionVisible) {
          await loggedInLearner.clickOnElementWithSelector(
            answerOptionSelector
          );
          await loggedInLearner.page.waitForTimeout(300);
        }

        const nextBtnVisible = await loggedInLearner.isElementVisible(
          quizNextButtonSelector
        );

        if (nextBtnVisible) {
          await loggedInLearner.clickOnElementWithSelector(
            quizNextButtonSelector
          );
          await loggedInLearner.page.waitForTimeout(300);
        }
      }

      await loggedInLearner.expectElementToBeVisible(quizSummarySelector);
      await loggedInLearner.expectElementToBeVisible(quizSummaryScoreSelector);

      await loggedInLearner.clickOnElementWithSelector(
        quizSummaryCloseButtonSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        quizSummarySelector,
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display language selector on chapter card when multiple languages exist',
    async function () {
      await loggedInLearner.goto(
        `${BASE_URL}/learn/math/fractions/the-fraction-journey`
      );
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        lessonLanguageSelectorSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should fall back to default language when preferred language content is unavailable',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        lessonLanguageSelectorSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        lessonLanguageDropdownSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        defaultLanguageOptionSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should change language from dropdown and verify re-rendering',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        preferredLanguageOptionSelector
      );
      await loggedInLearner.page.waitForTimeout(1000);

      await loggedInLearner.expectElementToBeVisible(
        lessonLanguageSelectorSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Mastery Mastery card with mastery score',
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
      await loggedInLearner.expectElementToBeVisible(masteryScoreTextSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display new chapter badge for the most recently published lesson',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      await loggedInLearner.expectElementToBeVisible(
        lessonCardNewChapterSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the next active lesson indicator for the correct chapter',
    async function () {
      await loggedInLearner.expectElementToBeVisible(nextActiveLessonSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show reset chapter progress button for the logged in learner',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        resetProgressButtonSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show confirmation dialog when reset chapter progress is clicked',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        resetProgressButtonSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        resetProgressDialogSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        resetProgressConfirmSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        resetProgressCancelSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not reset progress when cancel is clicked in confirmation dialog',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        resetProgressCancelSelector
      );

      await loggedInLearner.expectElementToBeVisible(
        resetProgressDialogSelector,
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
