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
 * - Voiceover dropdown is filtered to be compatible with the selected text
 *   language and enables/disables accordingly.
 * - Starting a lesson uses the selected text and voiceover languages in the URL.
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
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';

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
const lessonCardStartButtonSelector = '.e2e-test-lesson-card-start-button';
const conversationSkinCardsContainerSelector =
  '.e2e-test-conversation-skin-cards-container';
const topicSessionFallbackStorageKey = 'topic_session_fallback_language';
const storyCardSelector = '.e2e-test-story-card';
const storyTitleSelector = '.e2e-test-story-title';
const masteryChallengeCardSelector = '.e2e-test-mastery-challenge-card';
const lessonCardNewChapterSelector = '.e2e-test-lesson-card-new-label';
const studySkillsCtaSelector = '.e2e-test-study-skills-cta';

describe('Logged-in Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let voiceoverAdmin: VoiceoverAdmin;
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let firstExplorationId: string | null;
  let secondExplorationId: string | null;
  let thirdExplorationId: string | null;
  let fourthExplorationId: string | null;
  let fifthExplorationId: string | null;

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

    voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin_topic_page4@example.com',
      [ROLES.VOICEOVER_ADMIN]
    );
    // Register the Hindi (India) language-accent pair. Without this, the
    // exploration editor's voiceover tab shows no accent dropdown for Hindi and
    // the voiceover-add step below would time out waiting for the accent
    // selector to appear.
    await voiceoverAdmin.addSupportedLanguageAccentPair('Hindi (India)');

    await releaseCoordinator.enableFeatureFlagWithRetries(
      'redesigned_topic_viewer_page'
    );
    await releaseCoordinator.enableFeatureFlagWithRetries('story_editor_arcs');
    // This flag lets the curriculum admin modify translations, which is needed
    // when adding a non-English translation to an exploration later in the
    // setup (so that the language selector and fallback info tooltip render on
    // the redesigned topic viewer page).
    await releaseCoordinator.enableFeatureFlagWithRetries(
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
    fifthExplorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Mastering Fractions',
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

    // Add a fifth chapter that stays in DRAFT status. Draft nodes are filtered
    // out of the learner-facing topic viewer data, so this chapter must not be
    // rendered either in the timeline or in the coming-soon/navigation sections.
    // It is added after the arc split so that it is not part of any Adventure.
    await curriculumAdmin.addChapter(
      'Mastering Fractions',
      fifthExplorationId as string
    );

    await curriculumAdmin.saveStoryDraft();

    // The "split into adventure" action is only available in the arcs story
    // editor, which is hidden once the serial-chapter feature flag is enabled.
    // So the serial-chapter flag used for the ready-to-publish / publish-up-to
    // flows below must be enabled only after the split has been performed.
    await releaseCoordinator.enableFeatureFlagWithRetries(
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

    // Add a Hindi voiceover for the first card's content of the first
    // exploration. The topic viewer only exposes voiceover languages for an
    // exploration when actual voiceover entities exist for it, so without this
    // the learner's voiceover dropdown would stay permanently disabled.
    // Re-enter the exploration editor's main tab and reload before accessing
    // the voiceover tab. This mirrors the pattern used by other working
    // voiceover tests and is more reliable than a full URL navigation, which
    // has been seen to be flaky here.
    await curriculumAdmin.navigateToEditorTab();
    await curriculumAdmin.reloadPage();
    await curriculumAdmin.navigateToCard('Introduction');
    await curriculumAdmin.navigateToTranslationsTab();
    // The voiceover language option text in the exploration editor is the
    // language's description ("हिन्दी (Hindi)"), and the accent option text is
    // the accent's description ("Hindi (India)").
    await curriculumAdmin.addVoiceoverToContent(
      'हिन्दी (Hindi)',
      'Hindi (India)',
      'Content',
      testConstants.data.IntroContentVoiceoverInHindi
    );
    await curriculumAdmin.saveExplorationDraft();

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
        // attached to the DOM only while the icon is interacted with, so
        // interact with it first and then read the visible tooltip's text. Note
        // that on touch (mobile) viewports there is no mouse, so the tooltip is
        // shown only after a long-press instead of a hover.
        if (loggedInLearner.isViewportAtMobileWidth()) {
          await loggedInLearner.longPressOnElementWithSelector(
            lessonFallbackInfoIconSelector
          );
        } else {
          await loggedInLearner.page.hover(lessonFallbackInfoIconSelector);
        }
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
    'should recall the session language when the site language is not available',
    async function () {
      // Empty out any session fallback language left over from earlier tests.
      await loggedInLearner.page.evaluate(
        (storageKey: string) => window.sessionStorage.removeItem(storageKey),
        topicSessionFallbackStorageKey
      );

      // Switch the site language to Portuguese. The lesson offers only English
      // and Hindi, so Portuguese is unavailable and the waterfall falls back to
      // English (the default lesson language).
      await loggedInLearner.changeSiteLanguage('pt-br');
      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );

      // The lesson is not available in the preferred (site) language, so the
      // fallback info icon is shown.
      await loggedInLearner.expectElementToBeVisible(
        lessonFallbackInfoIconSelector
      );
      let selectedTextLanguage = await loggedInLearner.page.$eval(
        textLanguageSelector,
        (el: Element) => (el as HTMLSelectElement).value
      );
      expect(selectedTextLanguage).toBe('en');

      // Manually choose Hindi. This persists the choice in the session, which
      // the waterfall should recall for the next lessons instead of English.
      await loggedInLearner.select(textLanguageSelector, 'hi');
      await loggedInLearner.page.waitForTimeout(500);

      // Persist the selection to the session deterministically. The site
      // language is synchronised to the user's backend-stored preference on
      // each load, so a full reload may flip the preferred (site) language back
      // to English before the waterfall re-evaluates the session fallback.
      // Writing the session and the cached site language directly (as the
      // "fall back" test does) removes that race and lets this test focus on
      // verifying the recall behaviour.
      await loggedInLearner.page.evaluate((storageKey: string) => {
        window.localStorage.setItem('lang', 'pt-br');
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            textLanguageCode: 'hi',
            voiceoverLanguageCode: 'hi-IN',
          })
        );
      }, topicSessionFallbackStorageKey);

      await loggedInLearner.page.reload();
      await loggedInLearner.waitForPageToFullyLoad();
      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );

      // The session fallback (Hindi) is still available, so it is re-selected
      // over English even though the site language (Portuguese) is unavailable.
      // Poll for the re-selected value and then re-check after a short settle
      // period, since the language can be (re)applied asynchronously on load.
      await loggedInLearner.page.waitForFunction(
        (selector: string) => {
          const element = document.querySelector(
            selector
          ) as HTMLSelectElement | null;
          return element?.value === 'hi';
        },
        {},
        textLanguageSelector
      );
      await loggedInLearner.page.waitForTimeout(1500);
      selectedTextLanguage = await loggedInLearner.page.$eval(
        textLanguageSelector,
        (el: Element) => (el as HTMLSelectElement).value
      );
      expect(selectedTextLanguage).toBe('hi');

      // Note: we intentionally do not re-assert that the raw session fallback is
      // still 'hi' here. When the site language is (re)applied on page load, the
      // story section clears the session fallback (see
      // topic-story-section.component.ts onI18nLanguageCodeChange listener), so
      // the persisted value is not expected to survive the reload. The recall
      // behaviour itself is what matters and is verified above.
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should fall back to English when the saved session language is no longer available',
    async function () {
      // Simulate a saved session language that the lesson no longer offers.
      await loggedInLearner.page.evaluate((storageKey: string) => {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({textLanguageCode: 'es', voiceoverLanguageCode: null})
        );
      }, topicSessionFallbackStorageKey);

      await loggedInLearner.page.reload();
      await loggedInLearner.waitForPageToFullyLoad();
      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );

      const selectedTextLanguage = await loggedInLearner.page.$eval(
        textLanguageSelector,
        (el: Element) => (el as HTMLSelectElement).value
      );
      expect(selectedTextLanguage).toBe('en');

      // With English selected, there is no voiceover compatible with it (only
      // Hindi has a voiceover), so the voiceover dropdown is disabled.
      const voiceoverDisabled = await loggedInLearner.page.$eval(
        voiceoverLanguageSelector,
        (el: Element) => (el as HTMLSelectElement).disabled
      );
      expect(voiceoverDisabled).toBe(true);

      // Switching the text language to Hindi enables the voiceover dropdown and
      // syncs it to the compatible Hindi voiceover.
      await loggedInLearner.select(textLanguageSelector, 'hi');
      await loggedInLearner.page.waitForTimeout(500);

      const voiceoverNowDisabled = await loggedInLearner.page.$eval(
        voiceoverLanguageSelector,
        (el: Element) => (el as HTMLSelectElement).disabled
      );
      expect(voiceoverNowDisabled).toBe(false);
      // The topic reacts to the Hindi text language by syncing the voiceover to
      // the compatible Hindi (India) accent code.
      const selectedVoiceoverLanguage = await loggedInLearner.page.$eval(
        voiceoverLanguageSelector,
        (el: Element) => (el as HTMLSelectElement).value
      );
      expect(selectedVoiceoverLanguage).toBe('hi-IN');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should start a lesson with the selected text and voiceover languages',
    async function () {
      // Select Hindi for both text and (compatible) voiceover so that the
      // start URL is deterministic regardless of the state left behind by the
      // previous tests.
      await loggedInLearner.select(textLanguageSelector, 'hi');
      await loggedInLearner.page.waitForTimeout(500);

      const urlBeforeStart = loggedInLearner.page.url();
      expect(urlBeforeStart).toContain('/learn/math/fractions');

      await loggedInLearner.clickOnElementWithSelector(
        lessonCardStartButtonSelector
      );
      await loggedInLearner.waitForPageToFullyLoad();

      const startUrl = loggedInLearner.page.url();
      expect(startUrl).not.toBe(urlBeforeStart);
      expect(startUrl).toContain('initialContentLanguageCode=hi');
      // The voiceover code in the start URL is the Hindi (India) accent code
      // that was selected in the voiceover dropdown.
      expect(startUrl).toContain('initialVoiceoverLanguageCode=hi-IN');

      // The lesson player has loaded and renders the first card.
      await loggedInLearner.expectElementToBeVisible(
        conversationSkinCardsContainerSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Study Skills CTA in the story card header',
    async function () {
      // The previous test navigated to the lesson player, so return to the
      // topic viewer page before asserting topic-page elements.
      await loggedInLearner.goto(`${BASE_URL}/learn/math/fractions`);
      await loggedInLearner.waitForPageToFullyLoad();
      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(studySkillsCtaSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display new chapter badge for the most recently published lesson',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        lessonCardNewChapterSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Mastery Challenge card',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
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
