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

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  jest.setTimeout(600000000);
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
      'Percentage',
      'Percentage subtopics',
      'Percentage skills'
    );
    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values subtopics',
      'Place Values skills'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.addTopicToClassroom('Math', 'Addition');
    await curriculumAdmin.addTopicToClassroom('Math', 'Subtraction');
    await curriculumAdmin.addTopicToClassroom('Math', 'Multiplication');
    await curriculumAdmin.addTopicToClassroom('Math', 'Division');
    await curriculumAdmin.addTopicToClassroom('Math', 'Percentage');
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
      const exp_id =
        await curriculumAdmin.createAndPublishExplorationWithCards(chapter);
      chapterIds.push(exp_id ?? '');
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

  it('should be able to see Home tab', async function () {
    await loggedInUser.navigateToLearnerDashboard();

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
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
