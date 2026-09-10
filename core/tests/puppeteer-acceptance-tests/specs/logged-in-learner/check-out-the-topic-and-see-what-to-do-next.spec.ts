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
 * Check out the topic and see what to do next.
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
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';

const SPEC_TIMEOUT_MSECS = 6000000;
const ROLES = testConstants.Roles;

describe('Logged-in Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let voiceoverAdmin: VoiceoverAdmin;
  let loggedInLearner: LoggedInUser & LoggedOutUser;

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

    loggedInLearner = await UserFactory.createNewUser(
      'learner1',
      'learner_topic_page1@example.com'
    );
  }, SPEC_TIMEOUT_MSECS);

  it(
    'should check out the topic and see what to do next',
    async function () {
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectTopicPageTitleToContain('Fractions');
      await loggedInLearner.expectTopicPageDescriptionToBePresent();
      await loggedInLearner.expectTopicPageBreadcrumbToContain('Math');
      await loggedInLearner.expectStoryCardToBeVisible();
      await loggedInLearner.expectStoryTitleToContain('The Fraction Journey');
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageStoryCard',
        __dirname
      );

      await loggedInLearner.clickClassroomBreadcrumbLink();
      await loggedInLearner.expectToBeOnClassroomPage('math');
      await loggedInLearner.openTopicPage('math', 'fractions');

      await loggedInLearner.expectAdventureNavigationDockToBeVisible();
      await loggedInLearner.expectAdventureCountToBe(4);
      await loggedInLearner.expectAdventureTitlesToBeVisible();
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageNavigationDockBadges',
        __dirname
      );

      await loggedInLearner.expectEachAdventureToHaveLessonCount(3);

      await loggedInLearner.expectDockToStickToTopWithActiveMilestoneHighlighted();
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageDockStuckTopActiveMilestone',
        __dirname
      );

      await loggedInLearner.expectDockScrollArrowsToBeShownOnlyWhenOverflowing();
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageDockScrollArrows',
        __dirname
      );

      await loggedInLearner.expectFirstChapterCardToShowStartAndSecondaryActions();
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageExpandedChapterCardActions',
        __dirname
      );

      await loggedInLearner.expectNewLessonBadgeToBeVisible();
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageNewLessonBadge',
        __dirname
      );

      await loggedInLearner.scrollComingSoonSectionIntoView();
      await loggedInLearner.expectComingSoonSectionToBeVisible();
      await loggedInLearner.expectComingSoonSectionToShowLessonCard();
      await loggedInLearner.expectComingSoonTitleToContain(
        'COMING SOON CHAPTERS'
      );
      await loggedInLearner.expectComingSoonSectionToContainChapterCount(1);
      await loggedInLearner.expectComingSoonDescriptionToContain(
        'This chapter will be available soon.'
      );
      await loggedInLearner.expectDockLessonNumbersToBe(12, [13, 14]);
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageComingSoonSection',
        __dirname
      );

      await loggedInLearner.clickComingSoonCardAndExpectNoNavigation(
        '/learn/math/fractions'
      );

      await loggedInLearner.expectPageTextNotToContain('Mastering Fractions');
      await loggedInLearner.expectComingSoonSectionToContainChapterCount(1);

      await loggedInLearner.scrollToEndOfTopicPage();
      await loggedInLearner.expectMasteryChallengeCardToBeVisible();
      await loggedInLearner.expectMasteryChallengeTitleToBeVisible();
      await loggedInLearner.expectMasteryChallengeButtonToBeVisible();
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageMasteryChallengeCard',
        __dirname
      );

      await loggedInLearner.scrollMasteryChallengeCardIntoView();
      await loggedInLearner.expectMasteryChallengeCardToShowDescription();
      await loggedInLearner.expectScreenshotToMatch(
        'chapterMasteryChallengeLockedDescription',
        __dirname
      );

      await loggedInLearner.hoverOverLockedMasteryChallengeButtonAndExpectHelperTooltip();

      await loggedInLearner.expectClickingLockedMasteryChallengeButtonToNotNavigate();

      await loggedInLearner.scrollToTopOfTopicPage();
      await loggedInLearner.expectStudySkillsCtaToBeVisible();
      await loggedInLearner.expectScreenshotToMatch(
        'topicPageStoryCardWithStudySkillsCta',
        __dirname
      );

      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectArcTitlesToBeVisibleOnTimeline();
      await loggedInLearner.expectScreenshotToMatch(
        'chapterArcHeadersOnTimeline',
        __dirname
      );

      // The language selector only renders on chapters whose exploration has
      // translations other than English, which in this topic is only the first
      // chapter. The language checks therefore run while the first chapter is
      // still the active (uncompleted) lesson.
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectStoryCardToBeVisible();
      await loggedInLearner.expectStoryTitleToContain('The Fraction Journey');
      await loggedInLearner.expectScreenshotToMatch(
        'languageStoryCard',
        __dirname
      );

      await loggedInLearner.expectLessonLanguageSelectorToBeVisible();
      await loggedInLearner.expectScreenshotToMatch(
        'languageSelectorOnLessonCard',
        __dirname
      );

      await loggedInLearner.expectDefaultTextLanguageToBeSelected();

      await loggedInLearner.expectFallbackInfoTooltipToBeShown();

      await loggedInLearner.expectSessionLanguageToMatchSelectedLanguage();

      await loggedInLearner.clearSessionLanguage();
      await loggedInLearner.setSiteLanguageInLocalStorage('pt-br');
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectFallbackInfoIconToBeVisible();
      await loggedInLearner.expectSelectedTextLanguageToBe('en');
      await loggedInLearner.selectLessonTextLanguage('hi');
      await loggedInLearner.reloadTopicPage();
      await loggedInLearner.expectTextLanguageToBeSelected('hi');

      await loggedInLearner.setSavedSessionLanguageToUnavailable('es');
      await loggedInLearner.reloadTopicPage();
      await loggedInLearner.expectSelectedTextLanguageToBe('en');
      await loggedInLearner.expectVoiceoverLanguageDropdownToBeDisabled(true);
      await loggedInLearner.expectFallbackInfoIconToBeVisible();
      await loggedInLearner.expectScreenshotToMatch(
        'languageEnglishNoVoiceoverFallback',
        __dirname
      );
      await loggedInLearner.selectLessonTextLanguage('hi');
      await loggedInLearner.expectVoiceoverLanguageDropdownToBeDisabled(false);
      await loggedInLearner.expectSelectedVoiceoverLanguageToBe('hi-IN');
      await loggedInLearner.expectScreenshotToMatch(
        'languageHindiVoiceoverSelected',
        __dirname
      );

      await loggedInLearner.selectLessonTextLanguage('hi');
      await loggedInLearner.startActiveChapterAndExpectLanguageParamsInStartUrl(
        'hi',
        'hi-IN'
      );

      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectStudySkillsCtaToBeVisible();

      await loggedInLearner.expectNewLessonBadgeToBeVisible();

      await loggedInLearner.scrollMasteryChallengeCardIntoView();
      await loggedInLearner.expectMasteryChallengeCardToBeVisible();
      await loggedInLearner.expectMasteryChallengeTitleToBeVisible();
      await loggedInLearner.expectMasteryChallengeButtonToBeVisible();

      // Restore the default site language and clear the persisted lesson
      // language so that the remaining sections (which do not test language
      // handling) run against the same English topic page as the baseline
      // screenshots.
      await loggedInLearner.clearSessionLanguage();
      await loggedInLearner.setSiteLanguageInLocalStorage('en');
      await loggedInLearner.openTopicPage('math', 'fractions');

      await loggedInLearner.expectActiveChapterCardToShowStartAndSecondaryActions(
        2
      );
      await loggedInLearner.expectScreenshotToMatch(
        'chapterActiveCardWithActions',
        __dirname
      );

      await loggedInLearner.clickOnActiveChapterStartButton();
      await loggedInLearner.clickOnContinueButtonInInteractionCard();
      await loggedInLearner.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectCompletedLessonToBeVisible();
      await loggedInLearner.expectScreenshotToMatch(
        'chapterCompletedLessonProgression',
        __dirname
      );

      await loggedInLearner.expectCompletedChapterToBeCollapsed();
      await loggedInLearner.expectScreenshotToMatch(
        'chapterCompletedRowPlayAgain',
        __dirname
      );

      await loggedInLearner.expectNextChapterToBeActive();
      await loggedInLearner.expectScreenshotToMatch(
        'chapterNextChapterActive',
        __dirname
      );

      await loggedInLearner.expectAdventureNavigationDockToBeVisible();

      await loggedInLearner.expectAdventureTitlesToBeVisible();
      await loggedInLearner.expectAdventureCountToBeGreaterThanZero();
      await loggedInLearner.expectScreenshotToMatch(
        'arcTimelineAdventureTitles',
        __dirname
      );

      // The jump-ahead arc checks point at lesson 4, the first lesson of the
      // second adventure. The arcs group the 12 published lessons as 1-3,
      // 4-6, 7-9 and 10-12, so lesson 4 is the first lesson outside the first
      // (still incomplete) adventure and can trigger the skip flows.
      await loggedInLearner.clickDockBadgeAndExpectSkipModalToShowThenCancel(3);

      await loggedInLearner.skipToLaterArcAndExpectSkippedAdventureCards(3);

      await loggedInLearner.navigateToLaterArcMilestoneAndExpectNoPageReload(3);

      await loggedInLearner.expandSkippedAdventureByClickingStartCta();
      await loggedInLearner.expectScreenshotToMatch(
        'arcSkippedAdventureExpanded',
        __dirname
      );

      // The story has 12 published chapters. The first chapter was completed
      // above, so complete the remaining 11. The Mastery Challenge unlocks
      // only after every published chapter is completed.
      for (let completedCount = 0; completedCount < 11; completedCount++) {
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
      await loggedInLearner.openTopicPage('math', 'fractions');

      await loggedInLearner.expectPracticeTestCardToBeVisible();
      await loggedInLearner.expectScreenshotToMatch(
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
