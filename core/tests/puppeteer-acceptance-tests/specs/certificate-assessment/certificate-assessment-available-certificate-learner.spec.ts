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
 * @fileoverview Acceptance test for a learner taking an available certificate
 * assessment.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;

// The curriculum creation (topics, skills and questions) plus the certificate
// publishing is slow, so the whole setup needs a generous timeout.
const SETUP_TIMEOUT_MSECS = 3000000;

const CERTIFICATE_TITLE = 'Everyday Arithmetic & Number Confidence';
const CERTIFICATE_DESCRIPTION =
  "This certificate represents a learner's ability to confidently " +
  'understand, manipulate, and reason with whole numbers in everyday ' +
  'situations.';
const CERTIFICATE_OUTCOMES = [
  'Understanding of numbers and there relationship',
  'Ability to perform basic arithmetic accurately',
];
const TWO_TOPICS = ['Place Values', 'Addition and Subtraction'];

describe('Certified learner', function () {
  let curriculumAdmin: CurriculumAdmin;
  let learner: LoggedInUser;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoord',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    learner = await UserFactory.createNewUser(
      'certLearner',
      'cert_learner@example.com'
    );

    await releaseCoordinator.enableFeatureFlag('enable_certificate_assessment');

    await curriculumAdmin.createCertificateAssessmentTestSetup(
      [
        {
          topicName: 'Place Values',
          subtopicName: 'Understanding Place Value',
          skillName:
            'Identify the value of each digit in a multi-digit number.',
          questionCountsByDifficulty: {
            Easy: 2,
            Medium: 2,
            Hard: 1,
          },
          rubricDifficulties: ['Easy', 'Medium', 'Hard'],
        },
        {
          topicName: 'Addition and Subtraction',
          subtopicName: 'Basic Operations',
          skillName:
            'Add and subtract two-digit numbers with and without regrouping.',
          questionCountsByDifficulty: {
            Easy: 2,
            Medium: 2,
            Hard: 1,
          },
          rubricDifficulties: ['Easy', 'Medium', 'Hard'],
        },
      ],
      'Math',
      'math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    await curriculumAdmin.createCertificateOfferingAndPublish({
      title: CERTIFICATE_TITLE,
      description: CERTIFICATE_DESCRIPTION,
      timeLimitInMinutes: 10,
      totalQuestionCount: 10,
      classroomName: 'Math',
      outcomes: CERTIFICATE_OUTCOMES,
      topicNames: TWO_TOPICS,
    });
  }, SETUP_TIMEOUT_MSECS);

  it('should be able to discover the available certificate from the classroom page', async function () {
    await learner.gotoMathClassroomCertificateOfferings();
    await learner.expectCertificateTileWithStatus(
      CERTIFICATE_TITLE,
      'Not Attempted'
    );
  });

  it('should be able to review the certificate details before attempting', async function () {
    await learner.gotoMathClassroomCertificateOfferings();
    await learner.expectCertificateTileWithStatus(
      CERTIFICATE_TITLE,
      'Not Attempted'
    );
    await learner.openCertificateAssessment();
    await learner.expectCertificateIntroductionCard(CERTIFICATE_TITLE);
    await learner.continueToAssessmentInstructions();
  });

  it('should complete and fail the certificate assessment', async function () {
    await learner.gotoMathClassroomCertificateOfferings();
    await learner.openCertificateAssessment();
    await learner.continueToAssessmentInstructions();
    await learner.startCertificateAssessment();
    await learner.answerCertificateQuestions(7, 10);
    await learner.waitForPageToFullyLoad();
    await learner.expectCertificateAssessmentResult("Don't give up", '70%');
  });

  it('should show the failed status on the available certificate page', async function () {
    await learner.gotoMathClassroomCertificateOfferings();
    await learner.expectCertificateTileWithStatus(
      CERTIFICATE_TITLE,
      'Not Passed'
    );
  });

  it('should complete and pass the certificate assessment on retry', async function () {
    await learner.gotoMathClassroomCertificateOfferings();
    await learner.retryCertificateAssessment();
    await learner.expectCertificateIntroductionCard(CERTIFICATE_TITLE);
    await learner.continueToAssessmentInstructions();
    await learner.startCertificateAssessment();
    await learner.answerCertificateQuestions(8, 10);
    await learner.waitForPageToFullyLoad();
    await learner.expectCertificateAssessmentResult(
      'Congratulations, you passed',
      '80%'
    );
  });

  it('should show the passed status on the available certificate page', async function () {
    await learner.gotoMathClassroomCertificateOfferings();
    await learner.expectCertificateTileWithStatus(CERTIFICATE_TITLE, 'Passed');
  });

  it('should show a warning when submitting an assessment with unanswered questions', async function () {
    await learner.gotoMathClassroomCertificateOfferings();
    await learner.retryCertificateAssessment();
    await learner.continueToAssessmentInstructions();
    await learner.startCertificateAssessment();
    await learner.answerCertificateQuestions(9, 9);
    await learner.expectUnansweredQuestionsModal();
    await learner.clickOnElementWithSelector('.btn-close');
  });

  it('should show the certificate attempt history in the learner dashboard', async function () {
    await learner.navigateToMyCertificatesTab();
    await learner.expectCertificateAttemptRow(
      CERTIFICATE_TITLE,
      '80%',
      'Passed'
    );
    await learner.expectCertificateAttemptRow(
      CERTIFICATE_TITLE,
      '70%',
      'Not Passed'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
