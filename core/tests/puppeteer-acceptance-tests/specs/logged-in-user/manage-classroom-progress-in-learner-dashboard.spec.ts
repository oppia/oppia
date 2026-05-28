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
 * @fileoverview Acceptance tests for learner dashboard functionalities, specfically
 * interactions with components that use classroom data across all tabs.
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

  beforeAll(
    async function () {
      console.log('Creating curriculum admin user...');

      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculumAdmin@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );

      console.log('Curriculum admin user created.');

      console.log('Creating release coordinator user...');

      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordinator',
        'release_coordinator@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );

      console.log('Release coordinator user created.');

      console.log('Enabling feature flag...');

      await releaseCoordinator.enableFeatureFlag(
        'show_redesigned_learner_dashboard'
      );

      console.log('Feature flag enabled.');

      console.log('Creating classroom...');

      await curriculumAdmin.createNewClassroom('Math', 'math');

      console.log('Classroom created.');

      console.log('Updating classroom...');

      await curriculumAdmin.updateClassroom(
        'Math',
        'Welcome to Math classroom!',
        'This course covers basic operations.',
        'In this course, you will learn the following topics: Place Values.'
      );

      console.log('Classroom updated.');

      console.log('Creating and publishing topic...');

      await curriculumAdmin.createAndPublishTopic(
        'Place Values',
        'Place Values subtopics',
        'Place Values skills'
      );

      console.log('Topic created and published.');

      console.log('Adding topic to classroom...');

      await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');

      console.log('Topic added to classroom.');

      console.log('Publishing classroom...');

      await curriculumAdmin.publishClassroom('Math');

      console.log('Classroom published.');

      const placeValueChapters = [
        'What are the Place Values',
        'Find the Value of a Number',
        'Comparing Numbers',
      ];

      const chapterIds: (string | null)[] = [];

      console.log('Creating and publishing explorations...');

      for (const chapter of placeValueChapters) {
        console.log(`Creating exploration: ${chapter}`);

        const id =
          await curriculumAdmin.createAndPublishExplorationWithCards(chapter);

        console.log(`Exploration created and published: ${chapter}`);

        chapterIds.push(id);
      }

      console.log('All explorations created.');

      console.log('Adding story to topic...');

      await curriculumAdmin.addStoryToTopic(
        "Jamie's Adventures in the Arcade",
        'story',
        'Place Values'
      );

      console.log('Story added to topic.');

      console.log('Adding chapters to story...');

      for (const [index, id] of chapterIds.entries()) {
        console.log(`Adding chapter: ${placeValueChapters[index]}`);

        await curriculumAdmin.addChapter(
          placeValueChapters[index],
          id as string
        );

        console.log(`Chapter added: ${placeValueChapters[index]}`);
      }

      console.log('All chapters added.');

      console.log('Saving story draft...');

      await curriculumAdmin.saveStoryDraft();

      console.log('Story draft saved.');

      console.log('Publishing story draft...');

      await curriculumAdmin.publishStoryDraft();

      console.log('Story draft published.');

      console.log('Creating logged in user...');

      loggedInUser = await UserFactory.createNewUser(
        'loggedInUser1',
        'logged_in_user1@example.com'
      );

      console.log('Logged in user created.');

      console.log('beforeAll setup completed successfully.');
    },
    // Setup takes about 12 minutes to complete.
    12 * 60 * 1000
  );

  /**
   * TODO(#22070): Add tests for home tab. Interactions involving recommended
   * lessons, in-progress lessons, topics available, and saved lessons sections.
   */

  /**
   * TODO(#22070): Add tests for goals tab, all interactions.
   */

  /**
   * TODO(#22070): Add tests for progress tab. Interactions involving in-progress
   * and completed classroom lessons & skills sections.
   */
  it(
    'should navigate to the new learner dashboard',
    async function () {
      console.log('Navigating to learner dashboard...');

      await loggedInUser.navigateToLearnerDashboard();

      console.log('Successfully navigated to learner dashboard.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    console.log('Closing all browsers...');

    await UserFactory.closeAllBrowsers();

    console.log('All browsers closed.');
  });
});
