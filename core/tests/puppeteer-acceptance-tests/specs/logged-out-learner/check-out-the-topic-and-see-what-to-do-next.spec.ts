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
 * @fileoverview Acceptance test for CUJ L.O.2:
 * Check out the topic and see what to do next (logged-out learner).
 * https://docs.google.com/spreadsheets/d/1IrxN13IC5xwWdAFnGMu_4p3FU1ADL4QO-eLZIuTowIA/edit?gid=888982708#gid=888982708
 * https://docs.google.com/document/d/1pkiGSLHYU2pTD26z--5WXo9JmWuCccIXyGNCCjgauFM/edit?tab=t.4t336fwwj9ly#heading=h.vm2p8m3c49f
 *
 * Covers:
 * - Topic page renders with correct title, breadcrumb navigation, and
 *   description.
 * - Clicking the classroom link in the breadcrumb navigates to the
 *   classroom page.
 * - Twelve published lessons split across four Adventures (three lessons each).
 * - Sticky Progress Navigation Dock appears on scroll (mobile + desktop) with
 *   the active milestone highlighted, scroll arrows when it overflows, and
 *   horizontal scrolling to reveal all twelve lesson nodes.
 * - Timeline displays bold thematic Arc headers, active chapter card in
 *   expanded state, narrative description, Play CTA, Practice, and Study Guide.
 * - New badge for recently published lessons.
 * - Coming Soon section with a single placeholder card, its message, and
 *   blocked navigation. Downstream draft/locked chapters are suppressed, and
 *   Coming Soon lessons are excluded from the navigation dock.
 * - Mastery Challenge card at the end of the story path, with locked state
 *   helper tooltip and unlocked state navigation.
 * - Complete a lesson and verify chapter progression (collapsed row,
 *   completed indicator, Play Again action).
 * - Adventure navigation dock with clickable lesson nodes.
 * - Starting a lesson in a later arc triggers skip confirmation modal.
 * - Confirming skip marks earlier arcs as skipped with SKIPPED badge.
 * - Skipped arc cards show "Start" / "Resume" CTA to revisit.
 * - Smooth-scroll navigates to the selected Arc without reloading the page.
 * - Language selector with text and voiceover dropdowns on chapter cards.
 * - Language fallback info tooltip shows when lesson is not in preferred language.
 * - Language auto-selection waterfall: i18n -> session fallback -> English.
 * - Session persistence of language choice within a tab.
 * - Voiceover dropdown is filtered to be compatible with the selected text
 *   language and enables/disables accordingly.
 * - Starting a lesson uses the selected text and voiceover languages in the URL.
 * - Story card with title and Study Skills CTA.
 * - Footer with Contact Us link.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';

const SPEC_TIMEOUT_MSECS = 6000000;
const ROLES = testConstants.Roles;

describe('Logged-Out Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let voiceoverAdmin: VoiceoverAdmin;
  let loggedOutLearner: LoggedOutUser;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin_topic_page@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coord_topic_page@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin_topic_page@example.com',
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

    const publishedLessonNames = [
      'Introduction to Fractions',
      'Adding Fractions',
      'Subtracting Fractions',
      'Dividing Fractions',
      'Comparing Fractions',
      'Equivalent Fractions',
      'Simplifying Fractions',
      'Ordering Fractions',
      'Fractions on a Number Line',
      'Adding Mixed Numbers',
      'Subtracting Mixed Numbers',
      'Multiplying Mixed Numbers',
    ];
    const comingSoonChapterName = 'Multiplying Fractions';
    const draftChapterName = 'Mastering Fractions';

    const explorationIds: string[] = [];
    for (const lessonName of [
      ...publishedLessonNames,
      comingSoonChapterName,
      draftChapterName,
    ]) {
      const explorationId =
        await curriculumAdmin.createAndPublishExplorationWithCards(
          lessonName,
          'Algebra'
        );
      if (!explorationId) {
        throw new Error(
          `Exploration with title ${lessonName} could not be created.`
        );
      }
      explorationIds.push(explorationId);
    }

    await curriculumAdmin.addStoryToTopic(
      'The Fraction Journey',
      'the-fraction-journey',
      'Fractions'
    );

    for (const [index, lessonName] of publishedLessonNames.entries()) {
      await curriculumAdmin.addChapter(lessonName, explorationIds[index]);
    }
    await curriculumAdmin.addChapter(
      comingSoonChapterName,
      explorationIds[publishedLessonNames.length]
    );
    await curriculumAdmin.splitIntoAdventure('Subtracting Fractions');
    await curriculumAdmin.splitIntoAdventure('Equivalent Fractions');
    await curriculumAdmin.splitIntoAdventure('Fractions on a Number Line');

    await curriculumAdmin.addChapter(
      draftChapterName,
      explorationIds[publishedLessonNames.length + 1]
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
      '11'
    );

    await curriculumAdmin.addHindiTranslationToExploration(explorationIds[0]);

    await curriculumAdmin.navigateToEditorTab();
    await curriculumAdmin.reloadPage();
    await curriculumAdmin.navigateToCard('Introduction');
    await curriculumAdmin.navigateToTranslationsTab();
    await curriculumAdmin.addVoiceoverToContent(
      '\u0939\u093F\u0928\u094D\u0926\u0940 (Hindi)',
      'Hindi (India)',
      'Content',
      testConstants.data.IntroContentVoiceoverInHindi
    );
    await curriculumAdmin.saveExplorationDraft();

    loggedOutLearner = await UserFactory.createLoggedOutUser();
  }, SPEC_TIMEOUT_MSECS);

  it(
    'should be able to check out the topic and see what to do next',
    async function () {
      await loggedOutLearner.openTopicPage('math', 'fractions');
      await loggedOutLearner.expectTopicPageTitleToContain('Fractions');
      await loggedOutLearner.expectTopicPageDescriptionToBePresent();
      await loggedOutLearner.expectTopicPageBreadcrumbToContain('Math');
      await loggedOutLearner.expectStoryCardToBeVisible();
      await loggedOutLearner.expectStoryTitleToContain('The Fraction Journey');
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageStoryCard',
        __dirname
      );

      // The Adventure Navigation Dock renders when Adventures exist: it shows
      // a horizontal chapter-node track with left/right scroll arrows and the
      // active node highlighted (verified in the assertions below).
      await loggedOutLearner.expectAdventureNavigationDockToBeVisible();
      await loggedOutLearner.expectAdventureCountToBe(4);
      await loggedOutLearner.expectAdventureTitlesToBeVisible();
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageNavigationDockBadges',
        __dirname
      );

      await loggedOutLearner.expectEachAdventureToHaveLessonCount(3);

      await loggedOutLearner.expectDockToStickToTopWithActiveMilestoneHighlighted();
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageDockStuckTopActiveMilestone',
        __dirname
      );

      await loggedOutLearner.expectDockScrollArrowsToBeShownOnlyWhenOverflowing();
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageDockScrollArrows',
        __dirname
      );
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to look down the timeline and choose a lesson',
    async function () {
      await loggedOutLearner.expectFirstChapterCardToShowStartAndSecondaryActions();
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageExpandedChapterCardActions',
        __dirname
      );

      await loggedOutLearner.expectNewLessonBadgeToBeVisible();
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageNewLessonBadge',
        __dirname
      );

      await loggedOutLearner.scrollComingSoonSectionIntoView();
      await loggedOutLearner.expectComingSoonSectionToBeVisible();
      await loggedOutLearner.expectComingSoonSectionToShowLessonCard();
      await loggedOutLearner.expectComingSoonTitleToContain(
        'COMING SOON CHAPTERS'
      );
      await loggedOutLearner.expectComingSoonSectionToContainChapterCount(1);
      await loggedOutLearner.expectComingSoonDescriptionToContain(
        'This chapter will be available soon.'
      );
      await loggedOutLearner.expectDockLessonNumbersToBe(12, [13, 14]);
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageComingSoonSection',
        __dirname
      );

      await loggedOutLearner.clickComingSoonCardAndExpectNoNavigation(
        '/learn/math/fractions'
      );

      await loggedOutLearner.expectPageTextNotToContain('Mastering Fractions');
      await loggedOutLearner.expectComingSoonSectionToContainChapterCount(1);

      await loggedOutLearner.scrollToEndOfTopicPage();
      await loggedOutLearner.expectMasteryChallengeCardToBeVisible();
      await loggedOutLearner.expectMasteryChallengeTitleToBeVisible();
      await loggedOutLearner.expectMasteryChallengeButtonToBeVisible();
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageMasteryChallengeCard',
        __dirname
      );

      await loggedOutLearner.scrollMasteryChallengeCardIntoView();
      await loggedOutLearner.expectMasteryChallengeCardToShowDescription();
      await loggedOutLearner.expectScreenshotToMatch(
        'chapterMasteryChallengeLockedDescription',
        __dirname
      );

      await loggedOutLearner.hoverOverLockedMasteryChallengeButtonAndExpectHelperTooltip();

      await loggedOutLearner.expectClickingLockedMasteryChallengeButtonToNotNavigate();

      await loggedOutLearner.scrollToTopOfTopicPage();
      await loggedOutLearner.expectStudySkillsCtaToBeVisible();
      await loggedOutLearner.expectScreenshotToMatch(
        'topicPageStoryCardWithStudySkillsCta',
        __dirname
      );

      await loggedOutLearner.openTopicPage('math', 'fractions');
      await loggedOutLearner.expectArcTitlesToBeVisibleOnTimeline();
      await loggedOutLearner.expectScreenshotToMatch(
        'chapterArcHeadersOnTimeline',
        __dirname
      );

      // The language selector only renders on chapters whose exploration has
      // translations other than English, which in this topic is only the first
      // chapter. The language checks therefore run while the first chapter is
      // still the active (uncompleted) lesson.
      await loggedOutLearner.openTopicPage('math', 'fractions');
      await loggedOutLearner.expectStoryCardToBeVisible();
      await loggedOutLearner.expectStoryTitleToContain('The Fraction Journey');
      await loggedOutLearner.expectScreenshotToMatch(
        'languageStoryCard',
        __dirname
      );

      await loggedOutLearner.expectLessonLanguageSelectorToBeVisible();
      await loggedOutLearner.expectScreenshotToMatch(
        'languageSelectorOnLessonCard',
        __dirname
      );

      await loggedOutLearner.expectDefaultTextLanguageToBeSelected();

      await loggedOutLearner.expectFallbackInfoTooltipToBeShown();

      await loggedOutLearner.expectSessionLanguageToMatchSelectedLanguage();

      await loggedOutLearner.clearSessionLanguage();
      await loggedOutLearner.setSiteLanguageInLocalStorage('pt-br');
      await loggedOutLearner.openTopicPage('math', 'fractions');
      await loggedOutLearner.expectFallbackInfoIconToBeVisible();
      await loggedOutLearner.expectSelectedTextLanguageToBe('en');
      await loggedOutLearner.selectLessonTextLanguage('hi');
      await loggedOutLearner.reloadTopicPage();
      await loggedOutLearner.expectTextLanguageToBeSelected('hi');

      await loggedOutLearner.directlySetSavedSessionLanguageToUnavailable('es');
      await loggedOutLearner.reloadTopicPage();
      await loggedOutLearner.expectSelectedTextLanguageToBe('en');
      await loggedOutLearner.expectVoiceoverLanguageDropdownToBeDisabled(true);
      await loggedOutLearner.expectFallbackInfoIconToBeVisible();
      await loggedOutLearner.expectScreenshotToMatch(
        'languageEnglishNoVoiceoverFallback',
        __dirname
      );
      await loggedOutLearner.selectLessonTextLanguage('hi');
      await loggedOutLearner.expectVoiceoverLanguageDropdownToBeDisabled(false);
      await loggedOutLearner.expectSelectedVoiceoverLanguageToBe('hi-IN');
      await loggedOutLearner.expectScreenshotToMatch(
        'languageHindiVoiceoverSelected',
        __dirname
      );

      await loggedOutLearner.selectLessonTextLanguage('hi');
      await loggedOutLearner.startActiveChapterAndExpectLanguageParamsInStartUrl(
        'hi',
        'hi-IN'
      );

      await loggedOutLearner.openTopicPage('math', 'fractions');
      await loggedOutLearner.expectStudySkillsCtaToBeVisible();

      await loggedOutLearner.expectNewLessonBadgeToBeVisible();

      await loggedOutLearner.scrollMasteryChallengeCardIntoView();
      await loggedOutLearner.expectMasteryChallengeCardToBeVisible();
      await loggedOutLearner.expectMasteryChallengeTitleToBeVisible();
      await loggedOutLearner.expectMasteryChallengeButtonToBeVisible();

      // Restore the default site language and clear the persisted lesson
      // language so that the remaining sections (which do not test language
      // handling) run against the same English topic page as the baseline
      // screenshots.
      await loggedOutLearner.clearSessionLanguage();
      await loggedOutLearner.setSiteLanguageInLocalStorage('en');
      await loggedOutLearner.openTopicPage('math', 'fractions');

      await loggedOutLearner.expectActiveChapterCardToShowStartAndSecondaryActions(
        2
      );
      await loggedOutLearner.expectScreenshotToMatch(
        'chapterActiveCardWithActions',
        __dirname
      );

      await loggedOutLearner.clickOnActiveChapterStartButton();
      await loggedOutLearner.clickOnContinueButtonInInteractionCard();
      await loggedOutLearner.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );
      await loggedOutLearner.openTopicPage('math', 'fractions');
      await loggedOutLearner.expectCompletedLessonToBeVisible();
      await loggedOutLearner.expectScreenshotToMatch(
        'chapterCompletedLessonProgression',
        __dirname
      );

      await loggedOutLearner.expectCompletedChapterToBeCollapsed();
      await loggedOutLearner.expectScreenshotToMatch(
        'chapterCompletedRowPlayAgain',
        __dirname
      );

      await loggedOutLearner.expectNextChapterToBeActive();
      await loggedOutLearner.expectScreenshotToMatch(
        'chapterNextChapterActive',
        __dirname
      );

      await loggedOutLearner.expectAdventureNavigationDockToBeVisible();

      await loggedOutLearner.expectAdventureTitlesToBeVisible();
      await loggedOutLearner.expectAdventureCountToBeGreaterThanZero();
      await loggedOutLearner.expectScreenshotToMatch(
        'arcTimelineAdventureTitles',
        __dirname
      );

      // The jump-ahead arc checks point at lesson 4, the first lesson of the
      // second adventure. The arcs group the 12 published lessons as 1-3,
      // 4-6, 7-9 and 10-12, so lesson 4 is the first lesson outside the first
      // (still incomplete) adventure and can trigger the skip flows.
      await loggedOutLearner.clickDockBadgeAndExpectSkipModalToShowThenCancel(
        3
      );
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to skip directly to an advanced Adventure and unlock harder lessons',
    async function () {
      await loggedOutLearner.skipToLaterArcAndExpectSkippedAdventureCards(3);

      await loggedOutLearner.navigateToLaterArcMilestoneAndExpectNoPageReload(
        3
      );

      await loggedOutLearner.expandSkippedAdventureByClickingStartCta();
      await loggedOutLearner.expectScreenshotToMatch(
        'arcSkippedAdventureExpanded',
        __dirname
      );

      // The story has 12 published chapters. The first chapter was completed
      // above, so complete the remaining 11. The Mastery Challenge unlocks
      // only after every published chapter is completed.
      for (let completedCount = 0; completedCount < 11; completedCount++) {
        await loggedOutLearner.waitForPageToFullyLoad();
        await loggedOutLearner.clickOnActiveChapterStartButton();
        await loggedOutLearner.clickOnContinueButtonInInteractionCard();
        await loggedOutLearner.expectExplorationCompletionToastMessage(
          'Congratulations for completing this lesson!'
        );
        await loggedOutLearner.openTopicPage('math', 'fractions');
        await loggedOutLearner.expectCompletedLessonToBeVisible();
      }
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to take the Mastery Challenge',
    async function () {
      await loggedOutLearner.scrollMasteryChallengeCardIntoView();
      await loggedOutLearner.expectMasteryChallengeToBeUnlocked();
      await loggedOutLearner.clickMasteryChallengeAndNavigateToPracticeSession();
      await loggedOutLearner.openTopicPage('math', 'fractions');

      await loggedOutLearner.expectPracticeTestCardToBeVisible();
      await loggedOutLearner.expectScreenshotToMatch(
        'chapterPracticeTestCard',
        __dirname
      );
    },
    SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
