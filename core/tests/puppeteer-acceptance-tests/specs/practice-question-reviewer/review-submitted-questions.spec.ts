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
 * QR.CD. Review submitted questions.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {Contributor} from '../../utilities/user/contributor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {PracticeQuestionReviewer} from '../../utilities/user/practice-question-reviewer';
import {PracticeQuestionSubmitter} from '../../utilities/user/practice-question-submitter';
import {QuestionAdmin} from '../../utilities/user/question-admin';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Practice Question Reviewer', function () {
  let questionReviewer: PracticeQuestionReviewer & LoggedInUser;
  let questionSubmitter: PracticeQuestionSubmitter &
    Contributor &
    ExplorationEditor &
    LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;
  let questionAdmin: QuestionAdmin;

  beforeAll(async function () {
    // Create users.
    questionSubmitter = await UserFactory.createNewUser(
      'questionSubmitter',
      'question_submitter@example.com'
    );

    questionReviewer = await UserFactory.createNewUser(
      'questionReviewer',
      'question_reviewer@example.com'
    );

    questionAdmin = await UserFactory.createNewUser(
      'questionAdm',
      'question_admin@example.com',
      [ROLES.QUESTION_ADMIN]
    );

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Add submit question rights to the question submitter.
    await questionAdmin.navigateToContributorDashboardAdminPage();
    await questionAdmin.addSubmitQuestionRights('questionSubmitter');
    await questionAdmin.addReviewQuestionRights('questionReviewer');

    // Create a topic and add story with a chapter.
    const explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Test Exploration 1'
      );

    await curriculumAdmin.createAndPublishTopic(
      'Arithmetic Operations',
      'Addition and Subtraction',
      'Addition'
    );
    await curriculumAdmin.addStoryToTopic(
      'The Broken Calculator',
      'the-broken-calculator',
      'Arithmetic Operations'
    );
    await curriculumAdmin.openStoryEditor(
      'The Broken Calculator',
      'Arithmetic Operations'
    );
    await curriculumAdmin.addChapter(
      'Addition without a calculator',
      explorationId1
    );

    // Update skill rubric.
    await curriculumAdmin.openSkillEditor('Addition');
    await curriculumAdmin.updateRubric('Hard', 'This is for hard questions');
    await curriculumAdmin.updateRubric('Easy', 'This is for easy questions');
    await curriculumAdmin.updateRubric(
      'Medium',
      'This is for medium questions'
    );
    await curriculumAdmin.updateRubric('Hard', 'This is for hard questions');
    await curriculumAdmin.publishUpdatedSkill('Added rubrics to skill');

    // Add topic the Math classroom.
    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math-classroom',
      'Arithmetic Operations'
    );

    // Submit question suggestions.
    await questionSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await questionSubmitter.switchToTabInContributionDashboard(
      'Submit Question'
    );
    await questionSubmitter.startAndCompleteQuestionSuggestion(
      'Addition',
      'Arithmetic Operations',
      'What is 2 + 3?'
    );
    await questionSubmitter.startAndCompleteQuestionSuggestion(
      'Addition',
      'Arithmetic Operations',
      '12 + 4'
    );
    await questionSubmitter.startAndCompleteQuestionSuggestion(
      'Addition',
      'Arithmetic Operations',
      'What is 231 + 12?'
    );
  }, 900000);

  it('should be able to navigate between questions to review', async function () {
    await questionReviewer.navigateToContributorDashboardUsingProfileDropdown();

    await questionReviewer.startQuestionReview('What is 231 + 12?', 'Addition');
    await questionReviewer.clickOnElementWithText('Next');
    await questionReviewer.expectQuestionInReviewModalToBe('12 + 4');
  });

  it('should be able to review the submitted questions', async function () {
    // Reject the question suggestion.
    await questionReviewer.submitReview(
      'reject',
      'Well, the question is correct, but I am required as per CUJ'
    );

    await questionReviewer.expectQuestionReviewModalToBePresent(false);
    await questionReviewer.expectOpportunityToBePresent(
      // TODO(#23345): Currently, the wrong question gets rejected instead of the correct one.
      // Once fixed, replace the 'What is 231 + 12?' with '12 + 4'.
      'What is 231 + 12?',
      // '12 + 4',
      'Addition',
      false
    );

    // Modify and accept the question suggestion.
    await questionReviewer.startQuestionReview('What is 2 + 3?', 'Addition');
    await questionReviewer.editQuestionInReview('Updated Question');
    await questionReviewer.editQuestionInteractionInReview();
    await questionReviewer.submitReview(
      'accept',
      'Please make sure to use full sentences.'
    );
    await questionSubmitter.page.reload();
    await questionSubmitter.expectOpportunityToBePresent(
      'Updated Question',
      'Addition'
    );
    await questionSubmitter.viewSubmittedQuestion(
      'Updated Question',
      'Addition'
    );
    await questionSubmitter.expectSelectedInteractionNameToBe('Number Input');
    await questionSubmitter.closePracticeQuestionModal();
    // Accept the question suggestion.
    // TODO(#23345): Currently, the wrong question gets rejected instead of the correct one.
    // Once fixed, replace the '12 + 4' with 'What is 231 + 12?'.
    // Do this by uncommenting the line below and removing the line next to it.
    // await questionReviewer.startQuestionReview('What is 231 + 12?', 'Addition');
    await questionReviewer.startQuestionReview('12 + 4', 'Addition');
    await questionReviewer.submitReview('accept', 'Test Review Message');

    // Checks if questions are visible in question skill editor.
    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.openSkillEditor('Addition');
    await curriculumAdmin.navigateToSkillQuestionEditorTab();
    await curriculumAdmin.expectQuestionToBePresent('Updated Question');
    // TODO(#23345): Currently, the wrong question gets rejected instead of the correct one.
    // Once fixed, replace the 'What is 231 + 12?' with '12 + 4'.
    // Do this by uncommenting the line below and removing the line next to it.
    // await curriculumAdmin.expectQuestionToBePresent('What is 231 + 12?');
    await curriculumAdmin.expectQuestionToBePresent('12 + 4');
    await curriculumAdmin.expectQuestionToBePresent('What is 2 + 3?', false);
  });
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
