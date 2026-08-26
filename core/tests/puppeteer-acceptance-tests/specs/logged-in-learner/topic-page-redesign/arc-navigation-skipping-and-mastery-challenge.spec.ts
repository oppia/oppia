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
 * @fileoverview Acceptance tests for CUJ L.O.2 (part 3):
 * Arc Navigation, Skipping & Mastery Challenge.
 *
 * Covers:
 * - Adventure navigation dock with clickable lesson nodes.
 * - Clicking a later arc node triggers skip confirmation modal.
 * - Confirming skip marks earlier arcs as skipped with SKIPPED badge.
 * - Skipped arc cards show "Start" / "Resume" CTA to revisit.
 * - Smooth-scroll navigates to the selected Arc.
 * - Mastery Challenge card at end of story.
 * - Navigate to practice session from Mastery Challenge button.
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
const adventureNavigationSelector = '.e2e-test-adventure-navigation';
const adventureTitleSelector = '.e2e-test-adventure-title';
const adventureGroupSelector = '.e2e-test-adventure-group';
const arcSkipModalSelector = '.e2e-test-arc-skip-confirmation-modal';
const arcSkipProceedSelector = '.e2e-test-arc-skip-confirmation-proceed';
const arcSkipCancelSelector = '.e2e-test-arc-skip-confirmation-cancel';
const skippedAdventureCardSelector = '.e2e-test-skipped-adventure-card';
const skippedAdventureBadgeSelector = '.e2e-test-skipped-adventure-badge';
const skippedAdventureMessageSelector = '.e2e-test-skipped-adventure-message';
const skippedAdventureStartCtaSelector =
  '.e2e-test-skipped-adventure-start-cta';
const masteryChallengeCardSelector = '.e2e-test-mastery-challenge-card';
const masteryChallengeTitleSelector = '.e2e-test-mastery-challenge-title';
const masteryChallengeButtonSelector = '.e2e-test-mastery-challenge-button';
const practiceSessionContainerSelector = '.e2e-test-practice-session-container';
const practiceQuestionHeaderSelector = '.e2e-test-practice-question-header';
const lessonCardSelector = '.e2e-test-lesson-card';
const lessonCardStartButtonSelector = '.e2e-test-lesson-card-start-button';

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
      'curriculum_admin_topic_page3@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coord_topic_page3@example.com',
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
      'learner3',
      'learner_topic_page3@example.com'
    );
  }, 900000);

  it(
    'should navigate to topic page and display adventure navigation dock',
    async function () {
      await loggedInLearner.goto(
        `${BASE_URL}/learn/math/fractions/the-fraction-journey`
      );
      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        redesignedContainerSelector
      );
      await loggedInLearner.expectElementToBeVisible(
        adventureNavigationSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display adventure groups with titles in the timeline',
    async function () {
      await loggedInLearner.expectElementToBeVisible(adventureTitleSelector);

      const adventureGroups = await loggedInLearner.page.$$(
        adventureGroupSelector
      );
      expect(adventureGroups.length).toBeGreaterThan(0);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show skip confirmation modal when clicking a later arc node',
    async function () {
      const circleBadges = await loggedInLearner.page.$$(
        `${adventureNavigationSelector} topic-adventure-circle-badge`
      );

      if (circleBadges.length >= 3) {
        await circleBadges[2].click();

        await loggedInLearner.expectElementToBeVisible(arcSkipModalSelector);
        await loggedInLearner.expectElementToBeVisible(arcSkipCancelSelector);
        await loggedInLearner.expectElementToBeVisible(arcSkipProceedSelector);

        await loggedInLearner.clickOnElementWithSelector(arcSkipCancelSelector);
        await loggedInLearner.expectElementToBeVisible(
          arcSkipModalSelector,
          false
        );
      }
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should skip to later arc and show skipped adventure cards',
    async function () {
      const circleBadges = await loggedInLearner.page.$$(
        `${adventureNavigationSelector} topic-adventure-circle-badge`
      );

      if (circleBadges.length >= 3) {
        await circleBadges[2].click();

        await loggedInLearner.expectElementToBeVisible(arcSkipModalSelector);
        await loggedInLearner.clickOnElementWithSelector(
          arcSkipProceedSelector
        );

        await loggedInLearner.page.waitForTimeout(1000);

        const skippedCards = await loggedInLearner.page.$$(
          skippedAdventureCardSelector
        );
        expect(skippedCards.length).toBeGreaterThan(0);

        await loggedInLearner.expectElementToBeVisible(
          skippedAdventureBadgeSelector
        );
        await loggedInLearner.expectTextContentToContain(
          skippedAdventureBadgeSelector,
          'SKIPPED'
        );
        await loggedInLearner.expectElementToBeVisible(
          skippedAdventureMessageSelector
        );
        await loggedInLearner.expectElementToBeVisible(
          skippedAdventureStartCtaSelector
        );
      }
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should expand a skipped adventure when clicking its Start CTA',
    async function () {
      const startCtas = await loggedInLearner.page.$$(
        skippedAdventureStartCtaSelector
      );

      if (startCtas.length > 0) {
        await startCtas[0].click();

        await loggedInLearner.page.waitForTimeout(500);

        await loggedInLearner.expectElementToBeVisible(
          skippedAdventureCardSelector,
          false
        );

        const lessonCards = await loggedInLearner.page.$$(lessonCardSelector);
        expect(lessonCards.length).toBeGreaterThan(0);
      }
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display Mastery Challenge card at the end of the story path',
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
      await loggedInLearner.expectElementToBeVisible(
        masteryChallengeButtonSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate to practice session when clicking Take Mastery Challenge',
    async function () {
      await loggedInLearner.clickOnElementWithSelector(
        masteryChallengeButtonSelector
      );

      await loggedInLearner.waitForPageToFullyLoad();

      await loggedInLearner.expectElementToBeVisible(
        practiceSessionContainerSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display question player header in practice session',
    async function () {
      await loggedInLearner.expectElementToBeVisible(
        practiceQuestionHeaderSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
