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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * FL.CP. Learner discovers the website and navigates to the Math Classroom page
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const ROLES = testConstants.Roles;

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & LoggedOutUser;
  let explorationId1: string;
  let explorationId2: string;

  beforeAll(async function () {
    // Create Users.
    loggedOutLearner = await UserFactory.createLoggedOutUser();
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdmin',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create explorations.
    explorationId1 = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Fractions 1',
      'Fractions'
    );
    explorationId2 = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Fractions 2',
      'Fractions'
    );

    // Create a topic and classroom.
    await curriculumAdmin.createAndPublishTopic(
      'Fractions',
      'Fractions Chapter 1',
      'fractions'
    );
    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Fractions'
    );

    // Add explorations to classroom.
    await curriculumAdmin.addStoryToTopic(
      'Learning Fractions',
      'learn-fractions',
      'Fractions'
    );
    await curriculumAdmin.addChapter('Fractions 1', explorationId1);
    await curriculumAdmin.addChapter('Fractions 2', explorationId2);

    // Save draft.
    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
  });

  it('should be able to find list of subjects to learn', async function () {
    await loggedOutLearner.navigateToSplashPage();
    await loggedOutLearner.expectHomePageTitleToBe(
      'Free Education for Everyone'
    );
    await loggedOutLearner.expectDevModeLabelToBeVisible(
      process.env.PROD_ENV === 'true'
    );

    // Click "Explore Oppia Classrooms" button.
    await loggedOutLearner.clickBrowseLessonsButtonInHomePage();

    // TODO: Learner should be navigated to Math classroom.
    // TODO: Classroom page should have all the topics created.
  });

  it('should be able start learning from the first topic', async function () {
    // TODO: Click "Start Here" under "Don't know where to start" section.
    // TODO: Learner should see information about the first topic.
    // TODO: Learner should be able to see list of stories under the topic.
    // TODO: Learner should be able to see list of revision cards.
    // TODO: Learner should be able to see the page from which they can start learning.
  });

  it('should be able to figure out which topic would be best for them', async function () {
    // TODO: Click on "Take a Quiz" under "Already know some Math?" section.
    // TODO: Click on "Start the test" to start.
    // TODO: Go through the quiz.
    // TODO: Learner should be redirected to diagnostic test page.
    // TODO: Learner should be able to see test questions.
    // TODO: After completing the test, Learner should see the recommendation.
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
