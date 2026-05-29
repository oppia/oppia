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
 * @fileoverview Acceptance tests for learner dashboard functionalities, specifically
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

jest.setTimeout(20 * 60 * 1000);

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

console.log('Test file loaded');

describe('Logged-in User', function () {
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(
    async function () {
      console.log('beforeAll START');

      try {
        console.log('Closing any existing browsers before setup...');
        await UserFactory.closeAllBrowsers();
        console.log('Existing browsers closed');
      } catch (error) {
        console.error('Error while closing existing browsers:', error);
      }

      console.log('Creating curriculum admin user...');
      curriculumAdmin = await Promise.race([
        UserFactory.createNewUser(
          'curriculumAdm',
          'curriculumAdmin@example.com',
          [ROLES.CURRICULUM_ADMIN]
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error('Timeout while creating curriculum admin user')),
            2 * 60 * 1000
          )
        ),
      ]);
      console.log('Curriculum admin created');

      console.log('Creating release coordinator...');
      releaseCoordinator = await Promise.race([
        UserFactory.createNewUser(
          'releaseCoordinator',
          'release_coordinator@example.com',
          [ROLES.RELEASE_COORDINATOR]
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error('Timeout while creating release coordinator')),
            2 * 60 * 1000
          )
        ),
      ]);
      console.log('Release coordinator created');

      console.log('Enabling feature flag...');
      await releaseCoordinator.enableFeatureFlag(
        'show_redesigned_learner_dashboard'
      );
      console.log('Feature flag enabled');

      console.log('Creating classroom...');
      await curriculumAdmin.createNewClassroom('Math', 'math');
      console.log('Classroom created');

      console.log('Updating classroom...');
      await curriculumAdmin.updateClassroom(
        'Math',
        'Welcome to Math classroom!',
        'This course covers basic operations.',
        'In this course, you will learn the following topics: Place Values.'
      );
      console.log('Classroom updated');

      console.log('Creating topic...');
      await curriculumAdmin.createAndPublishTopic(
        'Place Values',
        'Place Values subtopics',
        'Place Values skills'
      );
      console.log('Topic created');

      console.log('Adding topic to classroom...');
      await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
      console.log('Topic added to classroom');

      console.log('Publishing classroom...');
      await curriculumAdmin.publishClassroom('Math');
      console.log('Classroom published');

      const placeValueChapters = [
        'What are the Place Values',
        'Find the Value of a Number',
        'Comparing Numbers',
      ];

      const chapterIds: string[] = [];

      console.log('Creating explorations...');

      for (const chapter of placeValueChapters) {
        console.log(`Starting exploration: ${chapter}`);

        const id = await Promise.race([
          curriculumAdmin.createAndPublishExplorationWithCards(chapter),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(`Timeout while creating exploration: ${chapter}`)
                ),
              5 * 60 * 1000
            )
          ),
        ]);

        if (!id) {
          throw new Error(`Exploration ID missing for: ${chapter}`);
        }

        chapterIds.push(id);

        console.log(`Finished exploration: ${chapter}`);
      }

      console.log('All explorations created');

      console.log('Adding story to topic...');
      await curriculumAdmin.addStoryToTopic(
        "Jamie's Adventures in the Arcade",
        'story',
        'Place Values'
      );
      console.log('Story added');

      console.log('Adding chapters to story...');

      for (const [index, id] of chapterIds.entries()) {
        console.log(`Adding chapter: ${placeValueChapters[index]}`);

        await Promise.race([
          curriculumAdmin.addChapter(placeValueChapters[index], id as string),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Timeout while adding chapter: ${placeValueChapters[index]}`
                  )
                ),
              2 * 60 * 1000
            )
          ),
        ]);

        console.log(`Chapter added: ${placeValueChapters[index]}`);
      }

      console.log('Saving story draft...');
      await curriculumAdmin.saveStoryDraft();
      console.log('Story draft saved');

      console.log('Publishing story draft...');
      await curriculumAdmin.publishStoryDraft();
      console.log('Story draft published');

      console.log('Creating logged-in user...');
      loggedInUser = await Promise.race([
        UserFactory.createNewUser(
          'loggedInUser1',
          'logged_in_user1@example.com'
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout while creating logged-in user')),
            2 * 60 * 1000
          )
        ),
      ]);
      console.log('Logged-in user created');

      console.log('beforeAll COMPLETED');
    },
    20 * 60 * 1000
  );

  it(
    'should navigate to the new learner dashboard',
    async function () {
      console.log('Navigating to learner dashboard...');

      await Promise.race([
        loggedInUser.navigateToLearnerDashboard(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error('Timeout while navigating to learner dashboard')
              ),
            2 * 60 * 1000
          )
        ),
      ]);

      console.log('Navigation completed');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    console.log('afterAll START');

    try {
      console.log('Closing browsers...');
      await UserFactory.closeAllBrowsers();
      console.log('Browsers closed');
    } catch (error) {
      console.error('Error while closing browsers:', error);
    }

    console.log('afterAll COMPLETED');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);
});
