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
 * FL.LT. Learner picks a lesson to learn
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const ROLES = testConstants.Roles;

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & LoggedInUser;
  let explorationId1: string;
  let explorationId2: string;

  beforeAll(async function () {
    loggedOutLearner = await UserFactory.createLoggedOutUser();

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create explorations.
    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdmin.updateCardContent('Hello, World! This is a test.');
    await curriculumAdmin.addInteraction('Continue Button');
    await curriculumAdmin.viewOppiaResponses();
    await curriculumAdmin.directLearnersToNewCard('Second Card');
    await curriculumAdmin.saveExplorationDraft();

    await curriculumAdmin.navigateToCard('Second Card');
    await curriculumAdmin.updateCardContent('Hello, World!');
    await curriculumAdmin.addTextInputInteraction();
    await curriculumAdmin.addResponsesToTheInteraction(
      'Text Input',
      'Hello, Oppia!',
      'Perfect!',
      'Last Card',
      true
    );
    await curriculumAdmin.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again.'
    );
    await curriculumAdmin.addSolutionToState(
      'Hello, Oppia!',
      'If you are reading this, you have successfully created an exploration.',
      false
    );
    await curriculumAdmin.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await curriculumAdmin.navigateToCard('Last Card');
    await curriculumAdmin.updateCardContent(
      'You have successfully created an exploration.'
    );
    await curriculumAdmin.addInteraction('End Exploration');
    await curriculumAdmin.saveExplorationDraft();

    explorationId1 = await curriculumAdmin.publishExplorationWithMetadata(
      'Fractions 1',
      'This is Fractions 1.',
      'Algebra'
    );

    explorationId2 = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Fractions 2',
      'Algebra'
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

  it('should be able to find a lesson to start learning', async function () {
    // Navigate to the classroom page.
    await loggedOutLearner.navigateToClassroomPage('math');
    await loggedOutLearner.expectTopicsToBePresent(['Fractions']);

    // Select and open the topic.
    await loggedOutLearner.selectAndOpenTopic('Fractions');
    await loggedOutLearner.selectChapterWithinStoryToLearn(
      'Learning Fractions',
      'Fractions 1'
    );

    // TODO: Learner should see first scenario conversation.

    // TODO: Learner should be able to submit an answer, then click continue.
    // TODO: Learner should see feedback and go through the lesson.

    // TODO: Exit the lesson.
    // TODO: Learner is taken back to the topic page.
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
