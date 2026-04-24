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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * TODO(#24785): This has to set this after adding the CUJs in v3 docs.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const returnToStoryFromLastStateSelector =
  '.e2e-test-end-chapter-return-to-story';
const studyGuideRecommendationSelector =
  '.e2e-test-study-guide-recommendation-text';
const topicPageRevisionTabContentSelector =
  '.e2e-test-topic-viewer-revision-tab';
const studyGuideRecommendationLinkSelector =
  '.e2e-test-study-guide-recommendation-link';

describe('Logged-In Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  let loggedInLearner1: LoggedInUser & LoggedOutUser;
  let loggedInLearner2: LoggedInUser & LoggedOutUser;
  const chapterIds: string[] = [];

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseAdm',
      'releaseAdm@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'serial_chapter_launch_curriculum_admin_view'
    );

    await releaseCoordinator.enableFeatureFlag(
      'serial_chapter_launch_learner_view'
    );

    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );

    await UserFactory.closeBrowserForUser(releaseCoordinator);

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values subtopics',
      'Place Values skills'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.publishClassroom('Math');

    const placeValueChapters = [
      'What are the Place Values',
      'Find the Value of a Number',
      'Comparing Numbers',
      'Rounding Numbers part 1',
      'Rounding Numbers part 2',
      'Jaya at the Market',
    ];

    for (const chapter of placeValueChapters) {
      const expId = await curriculumAdmin.createAndPublishExplorationWithCards(
        chapter,
        'Algebra',
        1
      );
      chapterIds.push(expId ?? '');
    }

    await curriculumAdmin.addStoryToTopic(
      "Jamie's Adventures in the Arcade",
      'story',
      'Place Values'
    );

    for (const [index, id] of chapterIds.entries()) {
      await curriculumAdmin.addChapter(placeValueChapters[index], id as string);
    }

    await curriculumAdmin.saveStoryDraft();

    await curriculumAdmin.readyToPublish(
      'What are the Place Values',
      "Jamie's Adventures in the Arcade",
      'Place Values'
    );
    await curriculumAdmin.readyToPublish(
      'Find the Value of a Number',
      "Jamie's Adventures in the Arcade",
      'Place Values'
    );

    await curriculumAdmin.publishChapter(
      "Jamie's Adventures in the Arcade",
      'Place Values',
      '0'
    );
    loggedInLearner1 = await UserFactory.createNewUser(
      'loggedInLearner1',
      'logged_in_learner1@example.com'
    );
    loggedInLearner2 = await UserFactory.createNewUser(
      'loggedInLearner2',
      'logged_in_learner2@example.com'
    );
  }, 6000000);

  it(
    'should set goal, select topic with all chapter types and play published chapter successfully',
    async function () {
      await loggedInLearner1.navigateToLearnerDashboard();

      await loggedInLearner1.navigateToGoalsSection();
      await loggedInLearner1.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

      await loggedInLearner1.clickOnGoalCheckboxInRedesignedLearnerDashboard(
        'Place Values',
        true
      );

      await loggedInLearner1.submitGoalInRedesignedLearnerDashboard();

      await loggedInLearner1.clickOnGoalCard('Place Values');

      await loggedInLearner1.expectScreenshotToMatch(
        'FirstChapterStartOthersComingSoon',
        __dirname
      );
      await loggedInLearner1.clickLessonCardButton('What are the Place Values');

      await loggedInLearner1.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInLearner1.returnToStoryFromLastState();

      await loggedInLearner1.expectChapterToBeClickable(
        'What are the Place Values'
      );

      // Todo:After Resolving issue #24423
      // await loggedInLearner1.expectChapterToBeClickable(
      //   'Find the Value of a Number' , false
      // );

      await loggedInLearner1.navigateToLearnerDashboard();
      await loggedInLearner1.expectScreenshotToMatch(
        'Chap2ContinueWhereYouLeftOff',
        __dirname
      );
      await loggedInLearner1.expectContinueWhereYouLeftOffSectionToContainLessonCards(
        ['Find the Value of a Number']
      );

      await loggedInLearner1.navigateToGoalsSection();
      await loggedInLearner1.clickOnGoalCard('Place Values');

      await loggedInLearner1.expectLessonCardButtonLabel(
        'Find the Value of a Number',
        'Coming Soon'
      );

      await loggedInLearner1.expectLessonProgressInRedesignedDashboardToBe(
        ' Chapter 1: What are the Place Values ',
        '100%'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  it(
    'should learner sees available and coming soon chapters in a topic',
    async function () {
      await loggedInLearner2.navigateToClassroomPage('math');
      await loggedInLearner2.selectAndOpenTopic('Place Values');

      // Story Summary Section.
      await loggedInLearner2.expectChaptersInAvailableChapterList([
        'What are the Place Values',
      ]);
      await loggedInLearner2.comingSoonLessonListHasChapters([
        'Find the Value of a Number',
      ]);

      // Todo:After Resolving issue #24423
      // await loggedInLearner2.expectChapterToBeClickable(
      //   'Find the Value of a Number' , false
      // );

      await loggedInLearner2.expectScreenshotToMatch(
        'Chap1AvailableChap2ComingSoon',
        __dirname
      );

      await loggedInLearner2.clickOnElementWithText(
        'What are the Place Values'
      );

      await loggedInLearner2.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson! You will now start the lesson from the beginning the next time you come back'
      );
      await loggedInLearner2.expectElementToBeVisible(
        returnToStoryFromLastStateSelector
      );
      await loggedInLearner2.expectElementToBeVisible(
        studyGuideRecommendationSelector
      );
      await loggedInLearner2.returnToStoryFromLastState();

      // Story viewer section.
      // Todo:After Resolving issue #24423
      // await loggedInLearner2.expectChapterToBeClickable(
      //   'Find the Value of a Number'
      // );

      await loggedInLearner2.expectChapterToBeClickable(
        'What are the Place Values'
      );
      await loggedInLearner2.expectScreenshotToMatch(
        'Chap2GrayedOut',
        __dirname
      );

      await loggedInLearner2.clickOnElementWithText(
        'What are the Place Values'
      );

      await loggedInLearner2.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson! You will now start the lesson from the beginning the next time you come back'
      );
      await loggedInLearner2.clickOnElementWithSelector(
        studyGuideRecommendationLinkSelector
      );
      await loggedInLearner2.expectElementToBeVisible(
        topicPageRevisionTabContentSelector
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  it(
    'should continue learning when new chapters are published',
    async function () {
      await curriculumAdmin.readyToPublish(
        'Comparing Numbers',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.readyToPublish(
        'Rounding Numbers part 1',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.readyToPublish(
        'Rounding Numbers part 2',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );

      await curriculumAdmin.publishChapter(
        "Jamie's Adventures in the Arcade",
        'Place Values',
        '2'
      );
      await UserFactory.closeBrowserForUser(curriculumAdmin);

      await loggedInLearner2.navigateToClassroomPage('math');
      await loggedInLearner2.selectAndOpenTopic('Place Values');
      await loggedInLearner2.expectChaptersInAvailableChapterList([
        'What are the Place Values',
        'Find the Value of a Number',
        'Comparing Numbers',
      ]);
      await loggedInLearner2.comingSoonLessonListHasChapters([
        'Rounding Numbers part 1',
        'Rounding Numbers part 2',
      ]);

      // Todo:After Resolving issue #24423
      // await loggedInLearner1.expectLessonCardToHaveNewLabel(
      //   'Find the Value of a Number'
      // );

      await loggedInLearner1.navigateToLearnerDashboard();

      await loggedInLearner1.expectScreenshotToMatch(
        'Chap2InProgressSectionChap3InRecommendedSection',
        __dirname
      );
      await loggedInLearner1.expectChapterToBePresentInRecommendedSection(
        'Comparing Numbers'
      );
      await loggedInLearner1.resumeLessonFromLearnerDashboard(
        ' Chapter 2: Find the Value of a Number '
      );
      await loggedInLearner1.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson! You will now start the lesson from the beginning the next time you come back'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
