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
 * @fileoverview Acceptance tests for CUJ L.O.2 (part 1):
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
 * - Mastery Challenge card at the end of the story path.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

// The default per-test timeout is 5 minutes; this spec publishes twelve
// lessons across four Adventures, so a slightly larger timeout is used to
// allow the heavier topic page to render and stabilize.
const SPEC_TIMEOUT_MSECS = 420000;
const ROLES = testConstants.Roles;
const BASE_URL = testConstants.URLs.BaseURL;

const redesignedContainerSelector =
  '.e2e-test-redesigned-topic-viewer-container';
const topicHeaderTitleSelector = '.topic-header-title';
const topicHeaderDescriptionSelector = '.topic-header-description';
const topicHeaderBreadcrumbSelector =
  'nav.topic-header-breadcrumbs[aria-label="Breadcrumb"]';
const desktopClassroomBreadcrumbLinkSelector =
  '.topic-header-breadcrumbs-desktop a[href="/learn/math"]';
const mobileClassroomBreadcrumbLinkSelector =
  '.e2e-test-mobile-breadcrumbs-classroom';
const adventureNavigationSelector = '.e2e-test-adventure-navigation';
const adventureNavigationArrowLeftSelector =
  '.adventure-navigation-arrow--left';
const adventureNavigationArrowRightSelector =
  '.adventure-navigation-arrow--right';
const storyCardSelector = '.e2e-test-story-card';
const storyTitleSelector = '.e2e-test-story-title';
const lessonCardSelector = '.e2e-test-lesson-card';
const lessonCardTitleSelector = '.e2e-test-lesson-card-title';
const lessonCardDescriptionSelector = '.e2e-test-lesson-card-description';
const lessonCardStartButtonSelector = '.e2e-test-lesson-card-start-button';
const lessonCardSecondaryButtonSelector =
  '.e2e-test-lesson-card-secondary-button';
const lessonCardNewLabelSelector = '.e2e-test-lesson-card-new-label';
const comingSoonSectionSelector = '.e2e-test-coming-soon-chapters';
const comingSoonTitleSelector = '.e2e-test-coming-soon-chapters-title';
const comingSoonChaptersCountSelector = '.coming-soon-chapters-count';
const comingSoonWrapperSelector = '.e2e-test-coming-soon-lesson-card-wrapper';
const comingSoonLabelSelector = '.e2e-test-lesson-card-coming-soon-label';
const masteryChallengeCardSelector = '.e2e-test-mastery-challenge-card';
const masteryChallengeTitleSelector = '.e2e-test-mastery-challenge-title';
const masteryChallengeButtonSelector = '.e2e-test-mastery-challenge-button';
const studySkillsCtaSelector = '.e2e-test-study-skills-cta';
const adventureGroupSelector = '.e2e-test-adventure-group';
const adventureTitleSelector = '.e2e-test-adventure-title';

describe('Logged-in Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
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

    await releaseCoordinator.enableFeatureFlagWithRetries(
      'redesigned_topic_viewer_page'
    );
    await releaseCoordinator.enableFeatureFlagWithRetries('story_editor_arcs');

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
    for (const lessonName of [...publishedLessonNames, comingSoonChapterName]) {
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
    const draftExplorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        draftChapterName,
        'Algebra'
      );
    if (!draftExplorationId) {
      throw new Error(
        `Exploration with title ${draftChapterName} could not be created.`
      );
    }

    await curriculumAdmin.addStoryToTopic(
      'The Fraction Journey',
      'the-fraction-journey',
      'Fractions'
    );

    // Add the twelve published chapters plus the coming-soon chapter, then split
    // the story into four Adventures of three lessons each so that the
    // Adventure (arc) features (navigation dock, skip confirmation modal,
    // skipped-adventure cards) and a horizontally scrollable dock render for
    // the learner on the redesigned topic page. The coming-soon chapter is
    // added before the splits so it sits at linear position 13, inside the
    // final Adventure; it is marked as "Ready to Publish" below, which makes
    // the learner see it as a "Coming Soon" placeholder card.
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

    // Add a final chapter that stays in DRAFT status. Draft nodes are filtered
    // out of the learner-facing topic viewer data, so this chapter must not be
    // rendered either in the timeline or in the coming-soon/navigation sections.
    // It is added after the arc splits so that it is not part of any Adventure.
    await curriculumAdmin.addChapter(draftChapterName, draftExplorationId);

    await curriculumAdmin.saveStoryDraft();

    // The "split into adventure" action is only available in the arcs story
    // editor, which is hidden once the serial-chapter feature flag is enabled
    // (see story-editor.component.html). So the serial-chapter flag used for
    // the ready-to-publish / publish-up-to flows below must be enabled only
    // after the split has been performed.
    await releaseCoordinator.enableFeatureFlagWithRetries(
      'serial_chapter_launch_curriculum_admin_view'
    );
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    // Mark the coming-soon chapter as "Ready to Publish" so the learner sees
    // it as a "Coming Soon" placeholder card on the redesigned topic page. A
    // DRAFT chapter is filtered out of the topic viewer data, so it must be in
    // ready-to-publish status (not DRAFT, not Published) to be shown.
    await curriculumAdmin.readyToPublish(
      'Multiplying Fractions',
      'The Fraction Journey',
      'Fractions',
      'Fraction skills'
    );

    // Publish the first twelve chapters via the serial "publish up to" flow.
    // The dropdown value is the zero-based index of the last chapter to
    // publish (11 = the twelfth chapter). This sets each Published chapter's
    // first publication date, which the learner topic page needs in order to
    // render the "New" badge.
    await curriculumAdmin.publishChapter(
      'The Fraction Journey',
      'Fractions',
      '11'
    );

    loggedInLearner = await UserFactory.createNewUser(
      'learner1',
      'learner_topic_page1@example.com'
    );
  }, 6000000);

  it(
    'should render the topic page with correct title and vertical timeline layout',
    async function () {
      await loggedInLearner.goto(`${BASE_URL}/learn/math/fractions`);
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );

      // The topic header shows the topic title, description, and a breadcrumb
      // trail back to the classroom. The classroom name ("Math") is present in
      // both the desktop breadcrumb ("Classrooms / Math / Fractions") and the
      // mobile breadcrumb ("Back to Math").
      await loggedInLearner.expectElementToBeVisible(topicHeaderTitleSelector);
      await loggedInLearner.expectTextContentToContain(
        topicHeaderTitleSelector,
        'Fractions'
      );
      await loggedInLearner.expectElementToBeVisible(
        topicHeaderDescriptionSelector
      );
      const topicDescription = await loggedInLearner.page.$eval(
        topicHeaderDescriptionSelector,
        el => el.textContent?.trim() || ''
      );
      expect(topicDescription.length).toBeGreaterThan(0);
      await loggedInLearner.expectElementToBeVisible(
        topicHeaderBreadcrumbSelector
      );
      await loggedInLearner.expectTextContentToContain(
        topicHeaderBreadcrumbSelector,
        'Math'
      );

      await loggedInLearner.expectElementToBeVisible(storyCardSelector);
      await loggedInLearner.expectElementToBeVisible(storyTitleSelector);
      await loggedInLearner.expectTextContentToContain(
        storyTitleSelector,
        'The Fraction Journey'
      );
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate to the classroom page when clicking the breadcrumb classroom link',
    async function () {
      // The desktop breadcrumb (Classrooms / Math / Fractions) is hidden on
      // mobile viewports, where the mobile breadcrumb ("Back to Math") is shown
      // instead, so click whichever classroom link is visible.
      if (
        await loggedInLearner.isElementVisible(
          desktopClassroomBreadcrumbLinkSelector
        )
      ) {
        await loggedInLearner.clickOnElementWithSelector(
          desktopClassroomBreadcrumbLinkSelector
        );
      } else {
        await loggedInLearner.clickOnElementWithSelector(
          mobileClassroomBreadcrumbLinkSelector
        );
      }

      await loggedInLearner.waitForPageToFullyLoad();
      expect(loggedInLearner.page.url()).toContain('/learn/math');

      // Return to the topic page so the remaining tests can run against it.
      await loggedInLearner.goto(`${BASE_URL}/learn/math/fractions`);
      await loggedInLearner.waitForPageToFullyLoad();
      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display adventure navigation dock with chapter nodes',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        adventureNavigationSelector
      );

      const adventureGroups = await loggedInLearner.page.$$(
        adventureGroupSelector
      );
      expect(adventureGroups.length).toBe(4);

      await loggedInLearner.expectElementToBeVisible(adventureTitleSelector);
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display four Adventures with three lessons each',
    async function () {
      const adventureGroups = await loggedInLearner.page.$$(
        adventureGroupSelector
      );
      expect(adventureGroups.length).toBe(4);

      for (const group of adventureGroups) {
        let lessonCards = await group.$$(lessonCardSelector);
        if (lessonCards.length === 0) {
          // Only the first Adventure is expanded by default, so expand the
          // collapsed Adventure headers before counting their lessons.
          const adventureHeader = await group.$('.adventure-header');
          if (!adventureHeader) {
            throw new Error('Adventure header not found.');
          }
          await loggedInLearner.clickOnElement(adventureHeader);
          await loggedInLearner.page.waitForTimeout(500);
          lessonCards = await group.$$(lessonCardSelector);
        }
        expect(lessonCards.length).toBe(3);
      }
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should keep the navigation dock stuck at the top with the active milestone highlighted',
    async function () {
      // Scroll the page well past the topic header so the dock (which is
      // position: sticky) has to stick to the top of the viewport.
      await loggedInLearner.page.evaluate(() => {
        window.scrollTo(0, 700);
      });
      await loggedInLearner.page.waitForTimeout(500);

      const dockState = await loggedInLearner.page.evaluate(() => {
        const headerElement = document.querySelector('.topic-header');
        const dockElement = document.querySelector(
          '.e2e-test-adventure-navigation'
        );
        const dockBadges = document.querySelectorAll(
          '.adventure-navigation-group topic-adventure-circle-badge ' +
            '.adventure-circle-badge'
        );
        return {
          headerBottom: headerElement?.getBoundingClientRect().bottom ?? 0,
          dockPosition: dockElement
            ? getComputedStyle(dockElement).position
            : '',
          dockTop: dockElement?.getBoundingClientRect().top ?? 0,
          activeBadgeBackground: dockBadges.length
            ? (dockBadges[0] as HTMLElement).style.backgroundColor
            : '',
          activeBadgeColor: dockBadges.length
            ? (dockBadges[0] as HTMLElement).style.color
            : '',
          inactiveBadgeBackground:
            dockBadges.length > 1
              ? (dockBadges[1] as HTMLElement).style.backgroundColor
              : '',
        };
      });

      // The topic header must have been scrolled out of view.
      expect(dockState.headerBottom).toBeLessThan(0);

      // The dock sticks to the top of the viewport (sticky top is 56px).
      expect(dockState.dockPosition).toBe('sticky');
      expect(Math.abs(dockState.dockTop - 56)).toBeLessThanOrEqual(2);

      // The first badge represents the active (next) lesson, so it uses the
      // adventure's accent color with white text, while the following badge
      // (a not-yet-started lesson) keeps a white background.
      expect(dockState.activeBadgeBackground).not.toBe('rgb(255, 255, 255)');
      expect(dockState.activeBadgeColor).toBe('rgb(255, 255, 255)');
      expect(dockState.inactiveBadgeBackground).toBe('rgb(255, 255, 255)');

      await loggedInLearner.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await loggedInLearner.page.waitForTimeout(300);
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should show navigation dock scroll arrows only when it overflows',
    async function () {
      const hasRightArrow = await loggedInLearner.isElementVisible(
        adventureNavigationArrowRightSelector
      );

      if (hasRightArrow) {
        // Overflowing dock (narrow/mobile viewport): the right arrow is
        // visible. Click it and verify the dock scrolls horizontally, revealing
        // the left arrow.
        await loggedInLearner.clickOnElementWithSelector(
          adventureNavigationArrowRightSelector
        );
        await loggedInLearner.page.waitForTimeout(700);

        const scrolledState = await loggedInLearner.page.evaluate(() => {
          const wrapper = document.querySelector(
            '.adventure-navigation-wrapper'
          );
          const leftArrow = document.querySelector(
            '.adventure-navigation-arrow--left'
          );
          return {
            scrollLeft: wrapper ? wrapper.scrollLeft : 0,
            leftArrowVisible: leftArrow ? true : false,
          };
        });
        expect(scrolledState.scrollLeft).toBeGreaterThan(5);
        expect(scrolledState.leftArrowVisible).toBe(true);

        // Scroll back to the start, which hides the left arrow again.
        await loggedInLearner.clickOnElementWithSelector(
          adventureNavigationArrowLeftSelector
        );
        await loggedInLearner.page.waitForTimeout(700);

        const resetState = await loggedInLearner.page.evaluate(() => {
          const wrapper = document.querySelector(
            '.adventure-navigation-wrapper'
          );
          const leftArrow = document.querySelector(
            '.adventure-navigation-arrow--left'
          );
          return {
            scrollLeft: wrapper ? wrapper.scrollLeft : 0,
            leftArrowVisible: leftArrow ? true : false,
          };
        });
        expect(resetState.scrollLeft).toBeLessThan(5);
        expect(resetState.leftArrowVisible).toBe(false);
      } else {
        // Dock fits within the viewport (desktop): no overflow, so neither
        // arrow is shown and the wrapper is not scrollable.
        const dockState = await loggedInLearner.page.evaluate(() => {
          const wrapper = document.querySelector(
            '.adventure-navigation-wrapper'
          );
          const leftArrow = document.querySelector(
            '.adventure-navigation-arrow--left'
          );
          return {
            scrollWidth: wrapper ? wrapper.scrollWidth : 0,
            clientWidth: wrapper ? wrapper.clientWidth : 0,
            leftArrowVisible: leftArrow ? true : false,
          };
        });
        expect(dockState.leftArrowVisible).toBe(false);
        expect(dockState.scrollWidth).toBeLessThanOrEqual(
          dockState.clientWidth
        );
      }
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should expand the first chapter card and show CTA, Practice, and Study Guide actions',
    async function () {
      await loggedInLearner.expectElementToBeVisible(lessonCardSelector);
      await loggedInLearner.expectElementToBeVisible(lessonCardTitleSelector);
      await loggedInLearner.expectElementToBeVisible(
        lessonCardDescriptionSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        lessonCardStartButtonSelector
      );

      const secondaryButtons = await loggedInLearner.page.$$(
        lessonCardSecondaryButtonSelector
      );
      if (secondaryButtons.length === 0) {
        throw new Error(
          'Expected at least one secondary action button on the chapter card.'
        );
      }
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display New badge for recently published lessons',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        lessonCardNewLabelSelector
      );
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Coming Soon section with a placeholder card',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        document
          .querySelector('.e2e-test-coming-soon-chapters')
          ?.scrollIntoView({behavior: 'smooth'});
      });

      await loggedInLearner.expectElementToBeVisible(comingSoonSectionSelector);
      await loggedInLearner.expectElementToBeVisible(comingSoonTitleSelector);
      await loggedInLearner.expectTextContentToContain(
        comingSoonTitleSelector,
        'COMING SOON CHAPTERS'
      );

      await loggedInLearner.expectElementToBeVisible(comingSoonWrapperSelector);
      await loggedInLearner.expectElementToBeVisible(comingSoonLabelSelector);

      // Exactly one chapter is in "Coming Soon" status (the ready-to-publish
      // chapter), and it is shown as a separate section distinct from the
      // available lessons.
      await loggedInLearner.expectTextContentToContain(
        comingSoonChaptersCountSelector,
        '1 chapter'
      );
      const comingSoonCardCount = await loggedInLearner.page.$$eval(
        `${comingSoonSectionSelector} .e2e-test-lesson-card`,
        elements => elements.length
      );
      expect(comingSoonCardCount).toBe(1);

      // The chapter availability message renders instead of a lesson
      // description.
      await loggedInLearner.expectTextContentToContain(
        `${comingSoonSectionSelector} .e2e-test-lesson-card-description`,
        'This chapter will be available soon.'
      );

      // Coming Soon and draft lessons are not part of the navigation dock:
      // only the twelve published chapters get dock badges, so the
      // ready-to-publish (13) and the draft (14) lesson numbers are absent.
      const dockLessonNumbers = await loggedInLearner.page.$$eval(
        `${adventureNavigationSelector} .adventure-navigation-group ` +
          'topic-adventure-circle-badge .adventure-circle-badge-label',
        elements =>
          elements
            .map(el => el.textContent?.trim() || '')
            .filter(label => /^\d+$/.test(label))
      );
      expect(dockLessonNumbers.length).toBe(12);
      for (let lessonNumber = 1; lessonNumber <= 12; lessonNumber++) {
        expect(dockLessonNumbers).toContain(String(lessonNumber));
      }
      expect(dockLessonNumbers).not.toContain('13');
      expect(dockLessonNumbers).not.toContain('14');
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should block navigation when clicking on a Coming Soon placeholder card',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        comingSoonWrapperSelector
      );

      const currentUrl = loggedInLearner.page.url();
      if (!currentUrl.includes('/learn/math/fractions')) {
        throw new Error(
          'Navigation should not occur when clicking a Coming Soon card.'
        );
      }
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should not display draft or locked downstream chapters to the learner',
    async function () {
      // The final chapter stays in DRAFT status, and draft nodes are filtered
      // out of the learner-facing topic viewer data entirely, so it must not
      // appear anywhere on the page.
      const pageText = await loggedInLearner.page.evaluate(
        () => document.body.textContent || ''
      );
      expect(pageText).not.toContain('Mastering Fractions');

      // The only "unavailable" chapter is the single Coming Soon one.
      const comingSoonCardCount = await loggedInLearner.page.$$eval(
        `${comingSoonSectionSelector} .e2e-test-lesson-card`,
        elements => elements.length
      );
      expect(comingSoonCardCount).toBe(1);
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Mastery Challenge card at the end of the story path',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
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
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Study Skills CTA in the story card header',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      await loggedInLearner.expectElementToBeVisible(studySkillsCtaSelector);
    },
    SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
