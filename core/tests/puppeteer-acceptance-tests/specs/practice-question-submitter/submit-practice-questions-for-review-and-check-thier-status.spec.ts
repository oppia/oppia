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
 * QS.CD Submit Practice Questions for review and check their status.
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

describe('Practice Question Submitter', function () {
  let questionSubmitter: PracticeQuestionSubmitter & Contributor & LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;
  let questionAdmin: QuestionAdmin;
  let questionReviewer: PracticeQuestionReviewer & LoggedInUser;

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
  }, 600000);

  it('should be able to submit practice questions', async function () {
    // Go to the contribution dashboard.
    await questionSubmitter.navigateToContributorDashboardUsingProfileDropdown();

    // TODO: Contribution opportunities are not visible on the first page.
    await questionSubmitter.expectScreenshotToMatch(
      'emptyPracticeQuestionOpportunities',
      __dirname
    );

    // Go to "Submit Questions" tab.
    await questionSubmitter.switchToTabInContributionDashboard(
      'Submit Question'
    );
    // Wait for the opportunities to load, so that screenshot comparasion is
    // not flaky.
    await questionSubmitter.expectOpportunityToBePresent(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.expectScreenshotToMatch(
      'practiceQuestionSubmissionTab',
      __dirname
    );

    // Submit an easy question.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Easy');
    await questionSubmitter.seedTextToQuestion('What is 2 + 3?');
    await questionSubmitter.addMultipleChoiceInteractionByQuestionSubmitter([
      '5',
      '-1',
      '6',
      '1.5',
    ]);
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState(
      'If you have 2 apples and someone gives you 3 apples, how many apples do you have?'
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Submit a medium question.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Medium');
    await questionSubmitter.seedTextToQuestion('14 + 12');
    await questionSubmitter.addMultipleChoiceInteractionByQuestionSubmitter([
      '26',
      '12',
      '16',
      '18',
    ]);
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState(
      'If you have 14 apples and someone gives you 14 apples, how many apples do you have?'
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Submit a hard question.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Hard');
    await questionSubmitter.seedTextToQuestion('What is 10 + 11?');
    await questionSubmitter.addMultipleChoiceInteractionByQuestionSubmitter([
      '13',
      '10',
      '11',
      '12',
    ]);
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState(
      'If you have 10 apples and someone gives you 11 apples, how many apples do you have?'
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Verify that the questions are submitted successfully.
    await questionSubmitter.switchToTabInContributionDashboard(
      'My Contributions'
    );
    await questionSubmitter.expectOpportunityToBePresent(
      'What is 2 + 3?',
      'Addition'
    );
    await questionSubmitter.expectContributionStatusToBe(
      'What is 2 + 3?',
      'Addition',
      'Awaiting review'
    );
  });

  it('should be able to check question status', async function () {
    // Accept the question suggestion.
    await questionReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await questionReviewer.startQuestionReview('What is 2 + 3?', 'Addition');
    await questionReviewer.submitReview('accept', 'Test Review Message');
    // Edit the question suggestion.
    await questionReviewer.startQuestionReview('14 + 12', 'Addition');
    await questionReviewer.editQuestionInReview('What is 14 + 12?');
    await questionReviewer.submitReview(
      'accept',
      'Please make sure to use full sentences.'
    );
    // Reject the question suggestion.
    await questionReviewer.startQuestionReview('What is 10 + 11?', 'Addition');
    await questionReviewer.submitReview(
      'reject',
      'It is not of Hard difficulty.'
    );

    // Check question status.
    await questionSubmitter.page.reload();
    await questionSubmitter.expectContributionStatusToBe(
      'What is 2 + 3?',
      'Addition',
      'Accepted'
    );
    await questionSubmitter.expectContributionStatusToBe(
      'What is 14 + 12?',
      'Addition',
      ' Accepted'
    );
    await questionSubmitter.expectContributionStatusToBe(
      'What is 10 + 11?',
      'Addition',
      'Revisions Requested'
    );
  });

  it('should be able to use all interactions in the question', async function () {
    await questionSubmitter.switchToTabInContributionDashboard(
      'Submit Question'
    );

    // Image Region Interaction.
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
