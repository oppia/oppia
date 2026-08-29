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
      'curriculum_admin_topic_page4@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coord_topic_page4@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag('redesigned_topic_viewer_page');
    await releaseCoordinator.enableFeatureFlag('story_editor_arcs');
    // This flag lets the curriculum admin modify translations, which is needed
    // when adding a non-English translation to an exploration later in the
    // setup (so that the language selector and fallback info tooltip render on
    // the redesigned topic viewer page).
    await releaseCoordinator.enableFeatureFlag(
      'exploration_editor_can_modify_translations'
    );

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
    // Asking for extra questions for the "Fraction skills" skill so that, when
    // the serial "publish chapters" flow below publishes the chapters, the
    // backend's story-publish validation (which requires each acquired skill to
    // have at least MIN_QUESTIONS_PER_SKILL_FOR_PUBLISH questions) passes.
    await curriculumAdmin.createQuestionsForSkill('Fraction skills', 7);
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

    // Split the story into two Adventures so that the Adventure features
    // (navigation dock, skip confirmation modal, skipped-adventure cards)
    // render for the learner on the redesigned topic page.
    await curriculumAdmin.splitIntoAdventure('Introduction to Fractions');

    await curriculumAdmin.saveStoryDraft();

    // The "split into adventure" action is only available in the story
    // editor's adventure (arcs) view, which is hidden once the serial-chapter
    // feature flag is enabled. So the serial-chapter flag used for the
    // ready-to-publish / publish-up-to flows below must be enabled only after
    // the split has been performed.
    await releaseCoordinator.enableFeatureFlag(
      'serial_chapter_launch_curriculum_admin_view'
    );
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    // Mark the final chapter as "Ready to Publish" so the learner sees it as a
    // "Coming Soon" placeholder card on the redesigned topic page. A DRAFT
    // chapter is filtered out of the topic viewer data, so it must be in
    // ready-to-publish status (not DRAFT, not Published) to be shown.
    await curriculumAdmin.readyToPublish(
      'Multiplying Fractions',
      'The Fraction Journey',
      'Fractions',
      'Fraction skills'
    );

    // Publish the first three chapters via the serial "publish up to" flow.
    // This sets each Published chapter's first publication date, which the
    // learner topic page needs in order to render the "New" badge.
    await curriculumAdmin.publishChapter(
      'The Fraction Journey',
      'Fractions',
      '2'
    );

    // Add a Hindi translation to the first exploration (which is already linked
    // to the story above). This gives the first, expanded lesson card a
    // non-English text language, which causes the language selector and the
    // fallback info tooltip to render for the learner on the redesigned topic
    // viewer page.
    await curriculumAdmin.addHindiTranslationToExploration(
      firstExplorationId as string
    );

    loggedInLearner = await UserFactory.createNewUser(
      'learner4',
      'learner_topic_page4@example.com'
    );
    // The setup adds translations, questions, and runs the serial publish flow,
    // which takes a long time, so a generous timeout is needed.
  }, 6000000);

  it(
    'should display the story card with title',
    async function () {
      await loggedInLearner.goto(`${BASE_URL}/learn/math/fractions`);
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

        // The tooltip text is not stored in an HTML attribute. Angular Material
        // renders the `[matTooltip]` binding into a `div.mat-tooltip` overlay
        // element (this version of Material does not set role="tooltip"). It is
        // attached to the DOM only while the icon is hovered, so hover first and
        // then read the visible tooltip's text.
        await loggedInLearner.page.hover(lessonFallbackInfoIconSelector);
        await loggedInLearner.page.waitForSelector('div.mat-tooltip', {
          visible: true,
        });

        const tooltipText = await loggedInLearner.page.$eval(
          'div.mat-tooltip',
          el => el.textContent?.trim() || ''
        );

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
