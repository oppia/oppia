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
 * - Topic page renders with correct title, vertical timeline, and Arc blocks.
 * - Sticky Progress Navigation Dock appears on scroll (mobile + desktop).
 * - Timeline displays bold thematic Arc headers, active chapter card in
 *   expanded state, narrative description, Play CTA, Practice, and Study Guide.
 * - New badge for recently published lessons.
 * - Coming Soon section with placeholder card and blocked navigation.
 * - Mastery Challenge card at the end of the story path.
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
const topicHeaderTitleSelector = '.topic-header-title';
const adventureNavigationSelector = '.e2e-test-adventure-navigation';
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
const comingSoonWrapperSelector = '.e2e-test-coming-soon-lesson-card-wrapper';
const comingSoonLabelSelector = '.e2e-test-lesson-card-coming-soon-label';
const masteryChallengeCardSelector = '.e2e-test-mastery-challenge-card';
const masteryChallengeTitleSelector = '.e2e-test-mastery-challenge-title';
const masteryChallengeButtonSelector = '.e2e-test-mastery-challenge-button';
const studySkillsCtaSelector = '.e2e-test-study-skills-cta';
const adventureGroupSelector = '.e2e-test-adventure-group';
const adventureTitleSelector = '.e2e-test-adventure-title';

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
      'curriculum_admin_topic_page@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coord_topic_page@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag('redesigned_topic_viewer_page');
    await releaseCoordinator.enableFeatureFlag('story_editor_arcs');
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

    // Split the story into two Adventures so that the Adventure (arc) features
    // (navigation dock, skip confirmation modal, skipped-adventure cards)
    // render for the learner on the redesigned topic page.
    await curriculumAdmin.splitIntoAdventure('Introduction to Fractions');

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();

    loggedInLearner = await UserFactory.createNewUser(
      'learner1',
      'learner_topic_page1@example.com'
    );
  }, 900000);

  it(
    'should render the topic page with correct title and vertical timeline layout',
    async function () {
      await loggedInLearner.goto(
        `${BASE_URL}/learn/math/fractions/the-fraction-journey`
      );
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );

      await loggedInLearner.expectElementToBeVisible(topicHeaderTitleSelector);
      await loggedInLearner.expectTextContentToContain(
        topicHeaderTitleSelector,
        'Fractions'
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
    'should display adventure navigation dock with chapter nodes',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        adventureNavigationSelector
      );

      const adventureGroups = await loggedInLearner.page.$$(
        adventureGroupSelector
      );
      if (adventureGroups.length === 0) {
        throw new Error(
          'Expected at least one adventure group (arc) in the timeline.'
        );
      }

      await loggedInLearner.expectElementToBeVisible(adventureTitleSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
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
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display New badge for recently published lessons',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        lessonCardNewLabelSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
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
        'Coming Soon'
      );

      await loggedInLearner.expectElementToBeVisible(comingSoonWrapperSelector);
      await loggedInLearner.expectElementToBeVisible(comingSoonLabelSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
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
    DEFAULT_SPEC_TIMEOUT_MSECS
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
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display the Study Skills CTA in the story card header',
    async function () {
      await loggedInLearner.page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      await loggedInLearner.expectElementToBeVisible(studySkillsCtaSelector);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
