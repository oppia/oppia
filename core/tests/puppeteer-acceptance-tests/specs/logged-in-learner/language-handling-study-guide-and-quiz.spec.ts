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
    await voiceoverAdmin.addSupportedLanguageAccentPair('Hindi (India)');

    await releaseCoordinator.enableFeatureFlag('redesigned_topic_viewer_page');
    await releaseCoordinator.enableFeatureFlag('story_editor_arcs');
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

    await curriculumAdmin.splitIntoAdventure('Introduction to Fractions');

    await curriculumAdmin.addChapter(
      'Mastering Fractions',
      fifthExplorationId as string
    );

    await curriculumAdmin.saveStoryDraft();

    await releaseCoordinator.enableFeatureFlag(
      'serial_chapter_launch_curriculum_admin_view'
    );
    await UserFactory.closeBrowserForUser(releaseCoordinator);
    await curriculumAdmin.readyToPublish(
      'Multiplying Fractions',
      'The Fraction Journey',
      'Fractions',
      'Fraction skills'
    );

    await curriculumAdmin.publishChapter(
      'The Fraction Journey',
      'Fractions',
      '2'
    );

    await curriculumAdmin.addHindiTranslationToExploration(
      firstExplorationId as string
    );

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
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectStoryCardToBeVisible();
      await loggedInLearner.expectStoryTitleToContain('The Fraction Journey');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display language selector with text and voiceover dropdowns',
    async function () {
      await loggedInLearner.expectLessonLanguageSelectorToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should auto-select English as default text language when available',
    async function () {
      await loggedInLearner.expectDefaultTextLanguageToBeSelected();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show fallback info icon when lesson is not in preferred language',
    async function () {
      await loggedInLearner.expectFallbackInfoTooltipToBeShown();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should persist language selection within the same session',
    async function () {
      await loggedInLearner.expectSessionLanguageToMatchSelectedLanguage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should recall the session language when the site language is not available',
    async function () {
      // Empty out any session fallback language left over from earlier tests.
      await loggedInLearner.clearSessionLanguage();

      // Cache Portuguese as the site language before the topic page loads. No
      // server-side preferred language is stored for this learner, so the page
      // bootstraps directly with Portuguese as the preferred language (from the
      // cached local storage) and no later i18n re-application occurs. The
      // lessons offer only English and Hindi, so Portuguese is unavailable and
      // the waterfall falls back to English (the default lesson language).
      await loggedInLearner.setSiteLanguageInLocalStorage('pt-br');

      // The lesson is not available in the preferred (site) language, so the
      // fallback info icon is shown.
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectFallbackInfoIconToBeVisible();
      await loggedInLearner.expectSelectedTextLanguageToBe('en');

      // Manually choose Hindi. This persists the choice in the session, which
      // the waterfall should recall for the next lessons instead of English.
      await loggedInLearner.selectLessonTextLanguage('hi');

      // Reload the page. The session fallback language survives the reload
      // because no server-side site language preference is stored for this
      // learner, so the story section never observes an i18n language change
      // (which would clear the session) before the lesson card initializes.
      await loggedInLearner.reloadTopicPage();

      // The session fallback (Hindi) is still available, so it is re-selected
      // over English even though the preferred (site) language (Portuguese) is
      // unavailable.
      await loggedInLearner.expectTextLanguageToBeSelected('hi');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should fall back to English when the saved session language is no longer available',
    async function () {
      // Simulate a saved session language that the lesson no longer offers.
      await loggedInLearner.setSavedSessionLanguageToUnavailable('es');
      await loggedInLearner.reloadTopicPage();

      await loggedInLearner.expectSelectedTextLanguageToBe('en');

      // With English selected, there is no voiceover compatible with it (only
      // Hindi has a voiceover), so the voiceover dropdown is disabled.
      await loggedInLearner.expectVoiceoverLanguageDropdownToBeDisabled(true);

      // Switching the text language to Hindi enables the voiceover dropdown and
      // syncs it to the compatible Hindi voiceover.
      await loggedInLearner.selectLessonTextLanguage('hi');
      await loggedInLearner.expectVoiceoverLanguageDropdownToBeDisabled(false);
      // The topic reacts to the Hindi text language by syncing the voiceover to
      // the compatible Hindi (India) accent code.
      await loggedInLearner.expectSelectedVoiceoverLanguageToBe('hi-IN');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should start a lesson with the selected text and voiceover languages',
    async function () {
      // Select Hindi for both text and (compatible) voiceover so that the
      // start URL is deterministic regardless of the state left behind by the
      // previous tests.
      await loggedInLearner.selectLessonTextLanguage('hi');

      await loggedInLearner.startActiveChapterAndExpectLanguageParamsInStartUrl(
        'hi',
        'hi-IN'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Study Skills CTA in the story card header',
    async function () {
      // The previous test navigated to the lesson player, so return to the
      // topic viewer page before asserting topic-page elements.
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectStudySkillsCtaToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display new chapter badge for the most recently published lesson',
    async function () {
      await loggedInLearner.expectNewLessonBadgeToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Mastery Challenge card',
    async function () {
      await loggedInLearner.scrollMasteryChallengeCardIntoView();
      await loggedInLearner.expectMasteryChallengeCardToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
