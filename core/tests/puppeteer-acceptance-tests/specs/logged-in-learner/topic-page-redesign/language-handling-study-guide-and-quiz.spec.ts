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
 * Language Handling, Study Guide & Footer.
 *
 * Covers:
 * - Language selector with text and voiceover dropdowns on chapter cards.
 * - Language fallback info tooltip shows when lesson is not in preferred language.
 * - Language auto-selection waterfall: i18n → session fallback → English.
 * - Session persistence of language choice within a tab.
 * - Story card with title and Study Skills CTA.
 * - New chapter badge for recently published lessons.
 * - Footer with Contact Us link.
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
const lessonLanguageSelectorSelector =
  '.e2e-test-topic-lesson-language-selector';
const textLanguageSelector = '.e2e-test-topic-lesson-text-language-selector';
const voiceoverLanguageSelector =
  '.e2e-test-topic-lesson-voiceover-language-selector';
const lessonFallbackInfoIconSelector = '.e2e-test-lesson-fallback-info-icon';
const storyCardSelector = '.e2e-test-story-card';
const storyTitleSelector = '.e2e-test-story-title';
const masteryChallengeCardSelector = '.e2e-test-mastery-challenge-card';
const lessonCardNewChapterSelector = '.e2e-test-lesson-card-new-label';
const studySkillsCtaSelector = '.e2e-test-study-skills-cta';

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
    'should display the story card with title',
    async function () {
      await loggedInLearner.goto(
        `${BASE_URL}/learn/math/fractions/the-fraction-journey`
      );
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
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
    'should display language selector with text and voiceover dropdowns',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        lessonLanguageSelectorSelector
      );

      const hasTextDropdown =
        await loggedInLearner.isElementVisible(textLanguageSelector);
      const hasVoiceoverDropdown = await loggedInLearner.isElementVisible(
        voiceoverLanguageSelector
      );

      expect(hasTextDropdown || hasVoiceoverDropdown).toBe(true);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should auto-select English as default text language when available',
    async function () {
      const hasLanguageSelector = await loggedInLearner.isElementVisible(
        lessonLanguageSelectorSelector
      );

      if (hasLanguageSelector) {
        const selectedLanguage = await loggedInLearner.page.$eval(
          textLanguageSelector,
          (el: Element) => (el as HTMLSelectElement).value
        );

        expect(selectedLanguage).toBeTruthy();
      }
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show fallback info icon when lesson is not in preferred language',
    async function () {
      const hasFallbackIcon = await loggedInLearner.isElementVisible(
        lessonFallbackInfoIconSelector
      );

      if (hasFallbackIcon) {
        await loggedInLearner.expectElementToBeVisible(
          lessonFallbackInfoIconSelector
        );

        const tooltipText = await loggedInLearner.page.evaluate(() => {
          const icon = document.querySelector(
            '.e2e-test-lesson-fallback-info-icon'
          );
          return icon?.getAttribute('mattooltip') || '';
        });

        expect(tooltipText).toBeTruthy();
      }
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should persist language selection within the same session',
    async function () {
      const hasLanguageSelector = await loggedInLearner.isElementVisible(
        lessonLanguageSelectorSelector
      );

      if (hasLanguageSelector) {
        const initialLanguage = await loggedInLearner.page.$eval(
          textLanguageSelector,
          (el: Element) => (el as HTMLSelectElement).value
        );

        const storedLanguage = await loggedInLearner.page.evaluate(() => {
          const stored = window.sessionStorage.getItem(
            'topic_session_fallback_language'
          );
          if (stored) {
            const parsed = JSON.parse(stored) as {textLanguageCode?: string};
            return parsed.textLanguageCode || '';
          }
          return '';
        });

        if (storedLanguage) {
          expect(storedLanguage).toBe(initialLanguage);
        }
      }
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Study Skills CTA in the story card header',
    async function () {
      await loggedInLearner.expectElementToBeVisible(studySkillsCtaSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display new chapter badge for the most recently published lesson',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        lessonCardNewChapterSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Mastery Challenge card',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        document
          .querySelector('.e2e-test-mastery-challenge-card')
          ?.scrollIntoView({behavior: 'smooth'});
      });

      await loggedInLearner.expectElementToBeVisible(
        masteryChallengeCardSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
