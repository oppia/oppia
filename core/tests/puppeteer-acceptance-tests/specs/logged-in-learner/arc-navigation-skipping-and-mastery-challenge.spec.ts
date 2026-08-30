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
 * - Smooth-scroll navigates to the selected Arc without reloading the page.
 * - Mastery Challenge card at end of story.
 * - Navigate to practice session from Mastery Challenge button.
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
      'curriculum_admin_topic_page3@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coord_topic_page3@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlagWithRetries(
      'redesigned_topic_viewer_page'
    );
    await releaseCoordinator.enableFeatureFlagWithRetries('story_editor_arcs');
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

    await curriculumAdmin.splitIntoAdventure('Introduction to Fractions');

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
      await loggedInLearner.openTopicPage('math', 'fractions');
      await loggedInLearner.expectAdventureNavigationDockToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display adventure groups with titles in the timeline',
    async function () {
      await loggedInLearner.expectAdventureTitlesToBeVisible();
      await loggedInLearner.expectAdventureCountToBeGreaterThanZero();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show skip confirmation modal when clicking a later arc node',
    async function () {
      await loggedInLearner.clickDockBadgeAndExpectSkipModalToShowThenCancel(2);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should skip to later arc and show skipped adventure cards',
    async function () {
      await loggedInLearner.skipToLaterArcAndExpectSkippedAdventureCards(2);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate to a later arc milestone with smooth scrolling and no page reload',
    async function () {
      await loggedInLearner.navigateToLaterArcMilestoneAndExpectNoPageReload(2);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should expand a skipped adventure when clicking its Start CTA',
    async function () {
      await loggedInLearner.expandSkippedAdventureByClickingStartCta();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display Mastery Challenge card at the end of the story path',
    async function () {
      await loggedInLearner.scrollMasteryChallengeCardIntoView();
      await loggedInLearner.expectMasteryChallengeCardToBeVisible();
      await loggedInLearner.expectMasteryChallengeTitleToBeVisible();
      await loggedInLearner.expectMasteryChallengeButtonToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not navigate away when clicking the locked Mastery Challenge button',
    async function () {
      await loggedInLearner.expectClickingLockedMasteryChallengeButtonToNotNavigate();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
