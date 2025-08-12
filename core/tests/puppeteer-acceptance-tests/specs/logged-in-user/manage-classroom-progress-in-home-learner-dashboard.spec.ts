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
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  const chapterIds: string[] = [];

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
    ];

    for (const chapter of placeValueChapters) {
      const id =
        await curriculumAdmin.createAndPublishExplorationWithCards(chapter);
      chapterIds.push(id ?? '');
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
  }, 500000);

  it(
    'should have the correct tab title and available sections on landing',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.expectTabTitleToMatch('loggedInUser1', 'home');

      await loggedInUser.expectElementsPresence({
        expectedTexts: ['Learn Something New'],
        excludedTexts: ['Continue where you left off'],
        selector: 'tabSection',
      });

      await loggedInUser.expectElementsPresence({
        expectedTexts: ["Topics available in Oppia's Classroom"],
        selector: 'cardDisplay',
      });
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
    'should display in-progress and recommended lessons after starting lessons',
    async function () {
      await loggedInUser.navigateToClassroomPage('math');
      await loggedInUser.selectAndOpenTopic('Place Values');
      await loggedInUser.selectChapterWithinStoryToLearn(
        "Jamie's Adventures in the Arcade",
        'What are the Place Values'
      );
      await loggedInUser.continueToNextCard();
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.expectElementsPresence({
        expectedTexts: ['Continue where you left off'],
        excludedTexts: ['Learn Something New'],
        selector: 'tabSection',
      });

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Lessons in progress',
        expectedTitles: ['Chapter 1: What are the Place Values'],
      });

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Recommended for you',
        expectedTitles: ['Chapter 2: Find the Value of a Number'],
      });

      await loggedInUser.navigateToLessonByCard(
        'Lessons in progress',
        'Chapter 1: What are the Place Values'
      );

      await loggedInUser.expectToBeOnLessonPage(
        'Chapter 1: What are the Place Values',
        chapterIds[0]
      );

      await loggedInUser.continueToNextCard();
      await loggedInUser.continueToNextCard();
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();

      await loggedInUser.expectElementsPresence({
        expectedTexts: ['Lessons in progress'],
        excludedTexts: ['Recommended for you'],
        selector: 'cardDisplay',
      });

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Lessons in progress',
        expectedTitles: ['Chapter 2: Find the Value of a Number'],
      });
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
