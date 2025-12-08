// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance tests for learner dashboard functionalities, specifically to
 * verify the visibility and correctness of Progress section, Progress percentage, Completed lessons, Skills and skill progress percentages.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TopicManager} from '../../utilities/user/topic-manager';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  jest.setTimeout(6000000);
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );
    await releaseCoordinator.closeBrowser();

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values',
      'Place Values'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.publishClassroom('Math');

    const placeValueChapters = [
      'What are the Place Values',
      'Find the Value of a Number',
      'Comparing Numbers',
    ];

    const chapterIds: (string | null)[] = [];

    for (const chapter of placeValueChapters) {
      const id = await curriculumAdmin.createAndPublishExplorationWithCards(
        chapter,
        'Algebra',
        3
      );
      chapterIds.push(id);
    }

    await curriculumAdmin.addStoryToTopic(
      "Jamie's Adventures in the Arcade",
      'story',
      'Place Values'
    );

    for (let i = 0; i < 6; i++) {
      await curriculumAdmin.createAndPublishExplorationWithCards(
        `Explore Title ${i + 1}`,
        'Algebra',
        3
      );
    }

    for (const [index, id] of chapterIds.entries()) {
      await curriculumAdmin.addChapter(placeValueChapters[index], id as string);
    }

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
    await curriculumAdmin.closeBrowser();

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  });

  it(
    'should display empty progress message when no lessons are in progress',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.expectSidebarTabToBeActive('Home');
      await loggedInUser.navigateToProgressSection();
      await loggedInUser.expectSidebarTabToBeActive('Progress');
      await loggedInUser.expectProgressSectionToBeEmptyInNewLD();
      await loggedInUser.expectScreenshotToMatch(
        'emptyProgressSection',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it('should select "Or Explore All Lessons in Classroom" button and navigate to /learn/math', async function () {
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToProgressSection();
    await loggedInUser.expectClassroomButtonOnRedesignedLearnerDashboardToBePresent(
      true
    );
    await loggedInUser.navigateThroughClassroomButtonONRLD();
    await loggedInUser.expectToBeOnPage('/learn/math');
  });

  it('should select Place Values Topic and play "Chapter 1: What are the Place Values?" but do not finish and see It in Progress Section', async function () {
    await loggedInUser.selectAndOpenTopic('Place Values');
    await loggedInUser.selectChapterWithinStoryToLearn(
      "Jamie's Adventures in the Arcade",
      'What are the Place Values'
    );
    await loggedInUser.continueToNextCard();

    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToProgressSection();

    await loggedInUser.expectScreenshotToMatch(
      'ProgressSectionInProgressWithOnlyChapter01',
      __dirname
    );
    await loggedInUser.expectElementsToBePresent(
      ['In Progress'],
      'tabSectionInProgressTab'
    );
    await loggedInUser.expectElementsToBePresent(
      ['Classroom Lessons', 'Skills'],
      'cardDisplay'
    );

    await loggedInUser.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 1: What are the Place Values'],
      0
    );
    await loggedInUser.expectSkillCardProgressToBe(
      'Skills',
      ['Place Values'],
      0
    );
    await loggedInUser.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 1: What are the Place Values'
    );
    await loggedInUser.continueToNextCard();
    await loggedInUser.continueToNextCard();
    await loggedInUser.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToProgressSection();
    await loggedInUser.expectScreenshotToMatch(
      'ProgressSectionInProgressWithOnlyChapter02',
      __dirname
    );
    await loggedInUser.navigateToSkillByCard('Skills', 'Place Values');
  });

  it("should complete all the lessons of Place Value's Story and see Chapter 1 in the Completed Lessons section", async function () {
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToProgressSection();

    await loggedInUser.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 2: Find the Value of a Number'],
      0
    );
    await loggedInUser.expectSkillCardProgressToBe(
      'Skills',
      ['Place Values'],
      0
    );

    await loggedInUser.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 2: Find the Value of a Number'
    );
    await loggedInUser.continueToNextCard();
    await loggedInUser.continueToNextCard();
    await loggedInUser.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToProgressSection();
    await loggedInUser.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 3: Comparing Numbers'],
      0
    );
    await loggedInUser.expectSkillCardProgressToBe(
      'Skills',
      ['Place Values'],
      0
    );

    await loggedInUser.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 3: Comparing Numbers'
    );
    await loggedInUser.continueToNextCard();
    await loggedInUser.continueToNextCard();
    await loggedInUser.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToProgressSection();

    await loggedInUser.expectScreenshotToMatch(
      'inProgressTabCompletedSection',
      __dirname
    );
    await loggedInUser.expectElementsToBePresent(
      ['Completed'],
      'tabSectionInProgressTab'
    );
    await loggedInUser.expectElementsToBePresent(
      ['Classroom Lessons', 'Skills'],
      'cardDisplay'
    );

    await loggedInUser.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 1: What are the Place Values'],
      100
    );
    await loggedInUser.expectSkillCardProgressToBe(
      'Skills',
      ['Place Values'],
      0
    );
  });

  it(
    'should be able to see community lesson in Progress Tab',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToCommunityLibraryOnNavbar();
      await loggedInUser.expectToBeOnCommunityLibraryPage();

      await loggedInUser.searchForLessonInSearchBar('Explore Title 1');
      await loggedInUser.playLessonFromSearchResults('Explore Title 1');
      await loggedInUser.continueToNextCard();
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToProgressSection();
      await loggedInUser.expectScreenshotToMatch(
        'learnerDashboardHomeTabWithLessonsInProgresschapter6AndExploreTitle1',
        __dirname
      );
      await loggedInUser.expectLessonCardProgressToBe(
        'Lessons in progress',
        ['Explore Title 1'],
        0
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to see 5 community lessons in Progress Tab and use "Display More" Button to see the 6th Community Lesson',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToCommunityLibraryOnNavbar();
      await loggedInUser.expectToBeOnCommunityLibraryPage();

      await loggedInUser.searchForLessonInSearchBar('Explore Title 2');
      await loggedInUser.playLessonFromSearchResults('Explore Title 2');
      await loggedInUser.continueToNextCard();
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToProgressSection();

      await loggedInUser.navigateToCommunityLibraryOnNavbar();
      await loggedInUser.expectToBeOnCommunityLibraryPage();
      await loggedInUser.searchForLessonInSearchBar('Explore Title 3');
      await loggedInUser.playLessonFromSearchResults('Explore Title 3');
      await loggedInUser.continueToNextCard();
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToProgressSection();

      await loggedInUser.navigateToCommunityLibraryOnNavbar();
      await loggedInUser.expectToBeOnCommunityLibraryPage();
      await loggedInUser.searchForLessonInSearchBar('Explore Title 4');
      await loggedInUser.playLessonFromSearchResults('Explore Title 4');
      await loggedInUser.continueToNextCard();
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToProgressSection();

      await loggedInUser.navigateToCommunityLibraryOnNavbar();
      await loggedInUser.expectToBeOnCommunityLibraryPage();
      await loggedInUser.searchForLessonInSearchBar('Explore Title 5');
      await loggedInUser.playLessonFromSearchResults('Explore Title 5');
      await loggedInUser.continueToNextCard();
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToProgressSection();

      await loggedInUser.navigateToCommunityLibraryOnNavbar();
      await loggedInUser.expectToBeOnCommunityLibraryPage();
      await loggedInUser.searchForLessonInSearchBar('Explore Title 6');
      await loggedInUser.playLessonFromSearchResults('Explore Title 6');
      await loggedInUser.continueToNextCard();
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToProgressSection();
      await loggedInUser.expectScreenshotToMatch(
        'learnerDashboardHomeTabWithLessonsInProgresschapter6AndExploreTitle1',
        __dirname
      );
      await loggedInUser.expectLessonCardProgressToBe(
        'Lessons in progress',
        [
          'Explore Title 6',
          'Explore Title 5',
          'Explore Title 4',
          'Explore Title 3',
          'Explore Title 2',
        ],
        0
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
