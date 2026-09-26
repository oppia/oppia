// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * QR.CD.02 Check contribution stats and badges earned.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {Contributor} from '../../utilities/user/contributor';
import {ContributorAdmin} from '../../utilities/user/contributor-admin';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {PracticeQuestionReviewer} from '../../utilities/user/practice-question-reviewer';
import {PracticeQuestionSubmitter} from '../../utilities/user/practice-question-submitter';
import {QuestionAdmin} from '../../utilities/user/question-admin';
import {TopicManager} from '../../utilities/user/topic-manager';

test.describe.configure({mode: 'serial'});

test.describe('Practice Question Reviewer Stats & Badges', function () {
  let questionReviewer: PracticeQuestionReviewer & LoggedInUser;
  let questionSubmitter: PracticeQuestionSubmitter &
    Contributor &
    ExplorationEditor &
    LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;
  let questionAdmin: QuestionAdmin & ContributorAdmin;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(900000);

    // Create users.
    questionSubmitter = await UserFactory.createNewUser(
      'questionSubmitter',
      'question_submitter@example.com',
      browser
    );

    questionReviewer = await UserFactory.createNewUser(
      'questionReviewer',
      'question_reviewer@example.com',
      browser
    );

    questionAdmin = await UserFactory.createNewUser(
      'questionAdm',
      'question_admin@example.com',
      browser,
      [testConstants.Roles.QUESTION_ADMIN]
    );

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      browser,
      [testConstants.Roles.CURRICULUM_ADMIN]
    );

    // Add submit question rights to the question submitter.
    await questionAdmin.navigateToContributorDashboardAdminPage();
    await questionAdmin.addSubmitQuestionRights(
      questionSubmitter.username ?? ''
    );
    await questionAdmin.addReviewQuestionRights(
      questionReviewer.username ?? ''
    );

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
  });

  test('should be able to check contribution stats', async function () {
    await questionReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await questionReviewer.navigateToTabInMyContributions('Review Questions');

    // Reject the question suggestion.
    await questionReviewer.startQuestionReview('12 + 4', 'Addition');
    await questionReviewer.submitReview(
      'reject',
      'Well, the question is correct, but I am required as per CUJ'
    );

    await questionReviewer.expectQuestionReviewModalToBePresent(false);
    await questionReviewer.expectOpportunityToBePresent(
      '12 + 4',
      'Addition',
      false
    );
    // Modify and accept the question suggestion.
    await questionReviewer.startQuestionReview('What is 2 + 3?', 'Addition');
    await questionReviewer.editQuestionInReview('Updated Question');
    await questionReviewer.submitReview(
      'accept',
      'Please make sure to use full sentences.'
    );
    await questionSubmitter.reloadPage();
    await questionSubmitter.expectOpportunityToBePresent(
      'Updated Question',
      'Addition'
    );
    // Accept the question suggestion.
    await questionReviewer.startQuestionReview('What is 231 + 12?', 'Addition');
    await questionReviewer.submitReview('accept', 'Test Review Message');

    // Check contribution stats.
    await questionReviewer.navigateToTabInMyContributions('Contribution Stats');
    await questionReviewer.selectContributionTypeInContributionDashboard(
      'Question Reviews'
    );
    await questionReviewer.expectContributionTableToContainRow([
      null,
      'Arithmetic Operations', // Topic.
      '3', // Questions reviewed.
      '2', // Questions accepted.
    ]);
  });

  test('should be able to check badges earned', async function () {
    await questionReviewer.navigateToTabInMyContributions('Badges');
    await questionReviewer.selectBadgeTypeInMobileView('Question');
    await questionReviewer.expectBadgesToContain('1', 'Review');
    await questionReviewer.expectBadgesToContain('1', 'Correction');
  });

  test.afterAll(async () => {
    // Close user contexts explicitly so that video recordings are finalized.
    await UserFactory.closeAllBrowsers();
  });
});
