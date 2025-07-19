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

  beforeAll(
    async function () {
      loggedOutLearner = await UserFactory.createLoggedOutUser();

      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculum_admin@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );

      // Create explorations.
      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.updateCardContent('Hello, World! This is a test.');
      await curriculumAdmin.addInteraction('Continue Button');
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard('Second Card');
      await curriculumAdmin.saveExplorationDraft();

      await curriculumAdmin.navigateToCard('Second Card');
      await curriculumAdmin.setTheStateAsCheckpoint();
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
        'Exploration 1',
        'This is Exploration 1.',
        'Algebra',
        'growth'
      );

      explorationId2 =
        await curriculumAdmin.createAndPublishExplorationWithCards(
          'Exploration 2',
          'Algebra'
        );

      // Create a topic and classroom.
      await curriculumAdmin.createAndPublishTopic(
        'Length Measurement',
        'Basics of Length Measurement',
        'length-measurement'
      );
      await curriculumAdmin.createAndPublishClassroom(
        'Math',
        'math',
        'Length Measurement'
      );

      // Add explorations to classroom.
      await curriculumAdmin.addStoryToTopic(
        'Learning Length Measurement',
        'learn-length-measurement',
        'Length Measurement'
      );
      await curriculumAdmin.addChapter('Exploration 1', explorationId1);
      await curriculumAdmin.addChapter('Exploration 2', explorationId2);

      // Save draft.
      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.publishStoryDraft();
    },
    // Test takes longer than default timeout.
    450000
  );

  it('should be able to find a lesson to start learning', async function () {
    // Navigate to the classroom page.
    await loggedOutLearner.navigateToClassroomPage('math');
    await loggedOutLearner.expectTopicsToBePresent(['Length Measurement']);

    // Select and open the topic.
    await loggedOutLearner.selectAndOpenTopic('Length Measurement');
    await loggedOutLearner.selectChapterWithinStoryToLearn(
      'Learning Length Measurement',
      'Exploration 1'
    );

    await loggedOutLearner.expectCardContentToMatch(
      'Hello, World! This is a test.'
    );
    await loggedOutLearner.continueToNextCard();
    await loggedOutLearner.verifyCheckpointModalAppears();
    await loggedOutLearner.submitAnswerInTextArea('Hello, Oppia!');
    await loggedOutLearner.continueToNextCard();

    await loggedOutLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );
    await loggedOutLearner.returnToStoryFromLastState();
    await loggedOutLearner.expectToBeOnStoryPage('Learning Length Measurement');
  });

  it('should be able to reach checkpoint', async function () {
    await loggedOutLearner.playChapterFromStory('Exploration 1');

    await loggedOutLearner.openLessonInfoModal();

    // Check basic lesson info.
    await loggedOutLearner.expectLessonInfoToShowRating('Unrated');
    // TODO (#22565): Views count is not updating properly.
    // Once fixed, uncomment the following line.
    // await loggedOutLearner.expectLessonInfoToShowNoOfViews(1);
    await loggedOutLearner.expectLessonInfoToShowLastUpdated();
    await loggedOutLearner.expectContributorsInLessonInfoModalToBe(
      'curriculumAdm',
      1
    );
    await loggedOutLearner.expectLessonInfoToShowTags(['growth']);

    // Check share options.
    await loggedOutLearner.shareExplorationFromLessonInfoModal(
      'Facebook',
      explorationId1
    );
    await loggedOutLearner.shareExplorationFromLessonInfoModal(
      'Twitter',
      explorationId1
    );
    await loggedOutLearner.shareExplorationFromLessonInfoModal(
      'Classroom',
      explorationId1
    );
    await loggedOutLearner.expectEmbedClassroomInLessonInfoToWorkProperly(
      explorationId1
    );

    // Progress Info.
    await loggedOutLearner.expectNoSaveProgressBeforeCheckpointInfo();
    await loggedOutLearner.closeLessonInfoModal();
    await loggedOutLearner.continueToNextCard();
    await loggedOutLearner.verifyCheckpointModalAppears();
    await loggedOutLearner.openLessonInfoModal();
    await loggedOutLearner.saveProgress();
    await loggedOutLearner.expectSignInButtonToBePresent();
    await loggedOutLearner.expectCreateAccountToBePresent();
    await loggedOutLearner.checkProgressUrlValidityInfo(
      'Use the link below to save progress for 72 hours.'
    );
    await loggedOutLearner.closeSaveProgressMenu();
    await loggedOutLearner.closeLessonInfoModal();
  });

  it('should be able to go to the next lesson', async function () {
    await loggedOutLearner.submitAnswerInTextArea('Hello, Oppia!');
    await loggedOutLearner.continueToNextCard();

    await loggedOutLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedOutLearner.continueToNextRecommendedLesson();

    await loggedOutLearner.expectCardContentToMatch('Content 0');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
