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
 * @fileoverview Acceptance tests for home tab of learner dashboard, specfically
 * interactions with components that use classroom data.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {showMessage} from '../../utilities/common/show-message';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  jest.setTimeout(6000000);
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
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
      'show_redesigned_learner_dashboard'
    );

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    await curriculumAdmin.createAndPublishTopic(
      'Addition',
      'Addition subtopics',
      'Addition skills'
    );
    await curriculumAdmin.createAndPublishTopic(
      'Subtraction',
      'Subtraction subtopics',
      'Subtraction skills'
    );
    await curriculumAdmin.createAndPublishTopic(
      'Multiplication',
      'Multiplication subtopics',
      'Multiplication skills'
    );
    await curriculumAdmin.createAndPublishTopic(
      'Division',
      'Division subtopics',
      'Division skills'
    );
    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values subtopics',
      'Place Values skills'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Addition');
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.addTopicToClassroom('Math', 'Subtraction');
    await curriculumAdmin.addTopicToClassroom('Math', 'Multiplication');
    await curriculumAdmin.addTopicToClassroom('Math', 'Division');
    await curriculumAdmin.publishClassroom('Math');

    const placeValueChapters = [
      'What are the Place Values',
      'Find the Value of a Number',
      'Comparing Numbers',
      'Rounding Numbers part 1',
      'Rounding Numbers part 2',
      'Extra chapter',
    ];

    for (const chapter of placeValueChapters) {
      const expId = await curriculumAdmin.createAndPublishExplorationWithCards(
        chapter,
        'Algebra',
        3
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
    await curriculumAdmin.publishStoryDraft();

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  });

  it(
    'should have the correct tab title, available sections on landing and Sidebar should contain these items in this order from top to bottom: Profile picture, "Home" button, "Goals" button, "Progress" button',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.expectSidebarTabToBeActive('Home');

      await loggedInUser.expectLearnerGreetingsToBe('Welcome, loggedInUser1!');

      await loggedInUser.expectElementsToBePresent(
        ['Learn Something New'],
        'tabSection'
      );
      await loggedInUser.expectElementsToBePresent(
        ["Topics available in Oppia's Classroom"],
        'cardDisplay'
      );
      await loggedInUser.expectClassroomButtonOnRedesignedLearnerDashboardToBePresent(
        true
      );

      await loggedInUser.expectNumberOfElementsToBe(
        '.e2e-test-learer-topic-summary-tile',
        5
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate directly to math classroom',
    async function () {
      await loggedInUser.navigateToClassroomFromLearnerDashboard('math');
      await loggedInUser.expectToBeOnPage('learn/math');
      showMessage('Navigated to math classroom from learner dashboard.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate directly to the Place Values topic in the math classroom',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToTopicPageByCard('Place Values');
      await loggedInUser.expectToBeOnPage('learn/math/place-values');
      showMessage('Navigated to Place Values topic from learner dashboard.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display in-progress and recommended lessons after starting a lesson',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToTopicPageByCard('Place Values');
      await loggedInUser.expectToBeOnPage('learn/math/place-values');
      await loggedInUser.selectChapterWithinStoryToLearn(
        "Jamie's Adventures in the Arcade",
        'What are the Place Values'
      );
      await loggedInUser.continueToNextCard();
      await loggedInUser.navigateToLearnerDashboard();
      // Did not finish the chapter,So still in  In-progress section.
      await loggedInUser.expectElementsToBePresent(
        ['Continue where you left off'],
        'tabSection'
      );

      await loggedInUser.expectLessonCardProgressToBe(
        'Lessons in progress',
        ['Chapter 1: What are the Place Values'],
        0
      );

      await loggedInUser.expectLessonCardProgressToBe(
        'Recommended for you',
        ['Chapter 2: Find the Value of a Number'],
        0
      );

      await loggedInUser.navigateToLessonByCard(
        'Lessons in progress',
        'Chapter 1: What are the Place Values'
      );

      await loggedInUser.expectToBeOnLessonPage(
        'Chapter 1: What are the Place Values',
        chapterIds[0]
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not recommend any lessons if currently on last lesson',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToLessonByCard(
        'Lessons in progress',
        'Chapter 1: What are the Place Values'
      );
      await loggedInUser.continueToNextCard();
      await loggedInUser.continueToNextCard();
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();

      await loggedInUser.expectLessonCardProgressToBe(
        'Lessons in progress',
        ['Chapter 2: Find the Value of a Number'],
        0
      );
      await loggedInUser.expectLessonCardProgressToBe(
        'Recommended for you',
        ['Chapter 3: Comparing Numbers'],
        0
      );

      await loggedInUser.navigateToLessonByCard(
        'Lessons in progress',
        'Chapter 2: Find the Value of a Number'
      );
      await loggedInUser.continueToNextCard();
      await loggedInUser.continueToNextCard();
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();

      await loggedInUser.expectLessonCardProgressToBe(
        'Lessons in progress',
        ['Chapter 3: Comparing Numbers'],
        0
      );
      await loggedInUser.expectLessonCardProgressToBe(
        'Recommended for you',
        ['Chapter 4: Rounding Numbers part 1'],
        0
      );

      await loggedInUser.navigateToLessonByCard(
        'Lessons in progress',
        'Chapter 3: Comparing Numbers'
      );
      await loggedInUser.continueToNextCard();
      await loggedInUser.continueToNextCard();
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();

      await loggedInUser.expectLessonCardProgressToBe(
        'Lessons in progress',
        ['Chapter 4: Rounding Numbers part 1'],
        0
      );
      await loggedInUser.expectLessonCardProgressToBe(
        'Recommended for you',
        ['Chapter 5: Rounding Numbers part 2'],
        0
      );

      await loggedInUser.navigateToLearnerDashboard();

      await loggedInUser.navigateToLessonByCard(
        'Lessons in progress',
        'Chapter 4: Rounding Numbers part 1'
      );
      await loggedInUser.continueToNextCard();
      await loggedInUser.continueToNextCard();
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();

      await loggedInUser.expectLessonCardProgressToBe(
        'Lessons in progress',
        ['Chapter 5: Rounding Numbers part 2'],
        0
      );
      await loggedInUser.expectLessonCardProgressToBe(
        'Recommended for you',
        ['Chapter 6: Extra chapter'],
        0
      );

      await loggedInUser.navigateToLessonByCard(
        'Lessons in progress',
        'Chapter 5: Rounding Numbers part 2'
      );
      await loggedInUser.continueToNextCard();
      await loggedInUser.continueToNextCard();
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();

      await loggedInUser.expectLessonCardProgressToBe(
        'Lessons in progress',
        ['Chapter 6: Extra chapter'],
        0
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
