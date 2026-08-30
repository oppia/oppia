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

    await curriculumAdmin.addChapter(draftChapterName, draftExplorationId);

    await curriculumAdmin.saveStoryDraft();

    await releaseCoordinator.enableFeatureFlagWithRetries(
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

    loggedInLearner = await UserFactory.createNewUser(
      'learner1',
      'learner_topic_page1@example.com'
    );
  }, 6000000);

  it(
    'should render the topic page with correct title and vertical timeline layout',
    async function () {
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectTopicPageTitleToContain('Fractions');
      await loggedInLearner.expectTopicPageDescriptionToBePresent();
      await loggedInLearner.expectTopicPageBreadcrumbToContain('Math');
      await loggedInLearner.expectStoryCardToBeVisible();
      await loggedInLearner.expectStoryTitleToContain('The Fraction Journey');
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate to the classroom page when clicking the breadcrumb classroom link',
    async function () {
      await loggedInLearner.clickClassroomBreadcrumbLink();
      await loggedInLearner.expectToBeOnClassroomPage('math');

      // Return to the topic page so the remaining tests can run against it.
      await loggedInLearner.openTopicPage('math', 'fractions');
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display adventure navigation dock with chapter nodes',
    async function () {
      await loggedInLearner.expectAdventureNavigationDockToBeVisible();
      await loggedInLearner.expectAdventureCountToBe(4);
      await loggedInLearner.expectAdventureTitlesToBeVisible();
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display four Adventures with three lessons each',
    async function () {
      await loggedInLearner.expectAdventureCountToBe(4);
      await loggedInLearner.expectEachAdventureToHaveLessonCount(3);
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should keep the navigation dock stuck at the top with the active milestone highlighted',
    async function () {
      await loggedInLearner.expectDockToStickToTopWithActiveMilestoneHighlighted();
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should show navigation dock scroll arrows only when it overflows',
    async function () {
      await loggedInLearner.expectDockScrollArrowsToBeShownOnlyWhenOverflowing();
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should expand the first chapter card and show CTA, Practice, and Study Guide actions',
    async function () {
      await loggedInLearner.expectFirstChapterCardToShowStartAndSecondaryActions();
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display New badge for recently published lessons',
    async function () {
      await loggedInLearner.expectNewLessonBadgeToBeVisible();
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Coming Soon section with a placeholder card',
    async function () {
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
      // Coming Soon and draft lessons are not part of the navigation dock:
      // only the twelve published chapters get dock badges, so the
      // ready-to-publish (13) and the draft (14) lesson numbers are absent.
      await loggedInLearner.expectDockLessonNumbersToBe(12, [13, 14]);
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should block navigation when clicking on a Coming Soon placeholder card',
    async function () {
      await loggedInLearner.clickComingSoonCardAndExpectNoNavigation(
        '/learn/math/fractions'
      );
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should not display draft or locked downstream chapters to the learner',
    async function () {
      // The final chapter stays in DRAFT status, and draft nodes are filtered
      // out of the learner-facing topic viewer data entirely, so it must not
      // appear anywhere on the page.
      await loggedInLearner.expectPageTextNotToContain('Mastering Fractions');

      // The only "unavailable" chapter is the single Coming Soon one.
      await loggedInLearner.expectComingSoonSectionToContainChapterCount(1);
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Mastery Challenge card at the end of the story path',
    async function () {
      await loggedInLearner.scrollToEndOfTopicPage();
      await loggedInLearner.expectMasteryChallengeCardToBeVisible();
      await loggedInLearner.expectMasteryChallengeTitleToBeVisible();
      await loggedInLearner.expectMasteryChallengeButtonToBeVisible();
    },
    SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Study Skills CTA in the story card header',
    async function () {
      await loggedInLearner.scrollToTopOfTopicPage();
      await loggedInLearner.expectStudySkillsCtaToBeVisible();
    },
    SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
