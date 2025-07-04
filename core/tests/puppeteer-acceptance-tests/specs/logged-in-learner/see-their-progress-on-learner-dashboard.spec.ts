/**
 * @license
 * Copyright 2025 The Oppia Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview
 * Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * LI.DP. Learner sees their progress on the Learner Dashboard
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;

  let explorationId1: string;
  let explorationId2: string;

  beforeAll(async function () {
    loggedInLearner = await UserFactory.createNewUser(
      'learner',
      'learner@example.com'
    );

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create 2 Explorations.
    explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Negative Numbers'
      );
    explorationId2 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Positive Numbers',
        'Algebra',
        false
      );

    // Create "Algebra I" topic and add the topic to "Math" classroom.
    await curriculumAdmin.createAndPublishTopic(
      'Algebra I',
      'Negative Numbers',
      'Negative Numbers'
    );
    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Algebra I'
    );

    // Create a story and add above 2 explorations as chapters.
    await curriculumAdmin.addStoryToTopic(
      'Test Story 1',
      'test-story-one',
      'Algebra I'
    );
    await curriculumAdmin.addChapter(
      'Test Chapter 1',
      explorationId1 as string
    );
    await curriculumAdmin.addChapter(
      'Test Chapter 2',
      explorationId2 as string
    );
    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
  });

  it('should be able to see their progress in Learner Dashbaord', async function () {
    // Navigate to Learner Dashboard using profile dropdown.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInLearner.expectContinueWhereYouLeftOffSectionInLDToBePresent(
      false
    );
    await loggedInLearner.expectLearnSomethingNewInLDToBeEmpty();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
