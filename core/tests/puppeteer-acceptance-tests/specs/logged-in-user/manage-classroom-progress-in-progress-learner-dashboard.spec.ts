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
 * @fileoverview Acceptance tests for progress tab of learner dashboard, specfically
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
        await curriculumAdmin.createAndPublishExplorationWithThreeCards(
          chapter
        );
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
    'should navigate to the progress tab and see correct tab with no lessons and can navigate to math classroom',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToTab('progress');
      await loggedInUser.expectTabTitleToMatch('loggedInUser1', 'progress');

      await loggedInUser.expectElementsPresence({
        expectedTexts: [
          "It looks like you don't have any lessons in progress or completed. Head over to Oppia's Classroom to start your first lesson!",
        ],
        selector: 'emptyProgress',
      });

      await loggedInUser.navigateToClassroomFromLearnerDashboard('math');
      await loggedInUser.expectToBeOnPage('learn/math/place-values');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // TODO(#18384) - Currently fails because it cannot differentiate between classroom and exploration lessons.
  // This results in classroom lessons being duplicated as exploration lessons (with metadata).
  /*
    it(
    'should show in progress classroom lessons and skills',
    async function () {
      await loggedInUser.navigateToClassroomPage('math');
      await loggedInUser.selectAndOpenTopic('Place Values');
      await loggedInUser.selectChapterWithinStoryToLearn(
        "Jamie's Adventures in the Arcade",
        'What are the Place Values'
      );
      await loggedInUser.continueToNextCard();

      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToTab('progress');

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Classroom Lessons',
        expectedTitles: ['Chapter 1: What are the Place Values'],
        section: 'In Progress',
      });

      await loggedInUser.expectSkillCardsToBePresent({
        subsection: 'Skills',
        expectedTitles: ['Place Value skills'],
        section: 'In Progress',
      });

      await loggedInUser.navigateToLessonByCard(
        'Classroom Lessons',
        'Chapter 1: What are the Place Values',
        'In Progress'
      );

      await loggedInUser.continueToNextCard();
      await loggedInUser.continueToNextCard();
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToTab('progress');

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Classroom Lessons',
        expectedTitles: ['Chapter 2: Find the Value of a Number'],
        section: 'In Progress',
      });

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Classroom Lessons',
        expectedTitles: ['Chapter 1: What are the Place Values'],
        section: 'Completed',
      });

      await loggedInUser.navigateToLessonByCard(
        'Classroom Lessons',
        'Chapter 2: Find the Value of a Number',
        'In Progress'
      );

      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToTab('progress');

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Classroom Lessons',
        expectedTitles: ['Chapter 2: Find the Value of a Number'],
        section: 'Completed',
      });

      await loggedInUser.expectSkillCardsToBePresent({
        subsection: 'Skills',
        expectedTitles: ['Place Value skills'],
        section: 'Completed',
      });
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );*/

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
