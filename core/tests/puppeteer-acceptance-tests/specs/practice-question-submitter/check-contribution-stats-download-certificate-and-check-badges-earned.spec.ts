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
 * QS.CD Check for contribution stats, download certificate, and badges earned.
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
  let questionSubmitter: PracticeQuestionSubmitter &
    Contributor &
    ExplorationEditor &
    LoggedInUser;
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
  }, 750000);

  it('should be able to check contribution stats', async function () {
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
      'What is 14 + 12'
    );
    await questionSubmitter.startAndCompleteQuestionSuggestion(
      'Addition',
      'Arithmetic Operations',
      'What is 10 - 11?'
    );
    await questionSubmitter.switchToTabInContributionDashboard(
      'My Contributions'
    );
    // Submit reviews.
    await questionReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await questionReviewer.startQuestionReview('What is 10 - 11?', 'Addition');
    await questionReviewer.submitReview(
      'reject',
      'It is not an addition problem.'
    );
    await questionReviewer.startQuestionReview('What is 14 + 12', 'Addition');
    await questionReviewer.editQuestionInReview('What is 14 + 12?');
    await questionReviewer.submitReview(
      'accept',
      'Please make sure to use full sentences.'
    );
    await questionReviewer.startQuestionReview('What is 2 + 3?', 'Addition');
    await questionReviewer.submitReview('accept', 'Test Review Message');

    // Check question status.
    await questionSubmitter.page.reload();
    await questionSubmitter.navigateToTabInMyContributions(
      'Contribution Stats'
    );
    await questionSubmitter.selectContributionTypeInContributionDashboard(
      'Question Contributions'
    );
    await questionSubmitter.expectContributionTableToContainRow([
      null,
      'Arithmetic Operations',
      '2',
      '1',
    ]);
  });

  it('should be able to download contribution certificate', async function () {
    // TODO(#22743): Currently, the download certificate functionality is not working
    // when "To" date is of today and only contribution is made today.
  });

  it('should be able to check for badges earned', async function () {
    await questionSubmitter.navigateToTabInMyContributions('Badges');
    await questionSubmitter.selectBadgeTypeInMobileView('Question');
    await questionSubmitter.expectBadgesToContain('1', 'Submission');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
