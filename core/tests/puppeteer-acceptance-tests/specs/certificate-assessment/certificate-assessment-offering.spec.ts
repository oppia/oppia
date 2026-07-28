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
 * @fileoverview Acceptance test for certificate assessment
 *
 * CA.5. Can Create, Edit and Delete Certificate
 *
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;
const certificateDashboardLink = '.e2e-test-certificate-dashboard-link';
const certificateDashboardTitle =
  '.e2e-test-certificate-offering-dashboard-title';
const newCertificateButton = '.e2e-test-new-certificate-btn';
const createDetailsNextButton =
  '.e2e-test-certificate-offering-details-next-button';
const certificateReviewContainer = '.e2e-test-certificate-review-container';
const certificateReviewSaveButton = '.e2e-test-certificate-review-save-btn';
const confirmCreateCertificateButton = '.e2e-test-confirm-save-certificate';
const certificateTitleSelector = '.oppia-certificate-title';
const certificateStatusSelector = '.oppia-status-badge';
const certificateRowSelector = '.oppia-certificate-offering-table tbody tr';
const certificateTitleInput = '.e2e-test-certificate-title-input';
const certificateDescriptionInput = '.e2e-test-certificate-description-input';
const certificateTimeLimitInput = '.e2e-test-certificate-time-limit-input';
const certificateTotalQuestionsInput =
  '.e2e-test-certificate-total-questions-input';
const classroomSelect = '.e2e-test-certificate-classroom-select';
const certificateOutcomeInput = '.e2e-test-certificate-outcome-input';
const addOutcomeButton = '.e2e-test-certificate-add-outcome';
const editCertificateButton = '.e2e-test-edit-certificate-btn';
const deleteCertificateButton = '.e2e-test-delete-certificate-btn';
const certificateTimeLabel = '.e2e-test-certificate-time-label';

describe('Certificate Assessment', function () {
  let curriculumAdmin: CurriculumAdmin;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
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
            Easy: 1,
            Medium: 1,
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
            Easy: 1,
            Medium: 1,
            Hard: 1,
          },
          rubricDifficulties: ['Easy', 'Medium', 'Hard'],
        },
        {
          topicName: 'Fraction',
          subtopicName: 'Basic Fraction Operations',
          skillName: 'Compare whole numbers using symbols.',
          questionCountsByDifficulty: {
            Easy: 2,
            Medium: 1,
            Hard: 0,
          },
          rubricDifficulties: ['Easy', 'Medium'],
        },
      ],
      'Math',
      'math'
    );
  }, 2100000);

  it('should let the curriculum admin access the certificate dashboard', async function () {
    await curriculumAdmin.goto(testConstants.URLs.Home);
    await curriculumAdmin.expectElementToBeVisible(
      '.e2e-test-profile-dropdown'
    );
    await curriculumAdmin.clickOnElementWithSelector(
      '.e2e-test-profile-dropdown'
    );
    await curriculumAdmin.clickAndWaitForNavigation(
      certificateDashboardLink,
      true
    );
    await curriculumAdmin.expectElementToBeVisible(certificateDashboardTitle);
    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Creator Dashboard'
    );
  });

  it('should create a certificate offering and show it on the dashboard', async function () {
    await curriculumAdmin.goto('/certificate-creator-dashboard');
    await curriculumAdmin.clickAndWaitForNavigation(newCertificateButton, true);
    await curriculumAdmin.expectTextContentToBe(
      '.oppia-certificate-offering-title',
      'Create Certificate'
    );
    await curriculumAdmin.expectTextContentToBe(
      'h3.oppia-certificate-section-title',
      'Add Certificate Details'
    );

    await curriculumAdmin.typeInInputField(
      certificateTitleInput,
      'Everyday Arithmetic & Number Confidence'
    );
    await curriculumAdmin.typeInInputField(
      certificateDescriptionInput,
      "This certificate represents a learner's ability to confidently understand, manipulate, and reason with whole numbers in everyday situations."
    );
    await curriculumAdmin.typeInInputField(certificateTimeLimitInput, '10');
    await curriculumAdmin.typeInInputField(certificateTotalQuestionsInput, '6');

    const classroomId = await curriculumAdmin.page.$eval(
      classroomSelect,
      selectElement => {
        const option = Array.from(
          (selectElement as HTMLSelectElement).options
        ).find(option => option.textContent?.trim() === 'Math');
        if (!option) {
          throw new Error('Math classroom option not found.');
        }
        return option.value;
      }
    );
    await curriculumAdmin.select(classroomSelect, classroomId);

    await curriculumAdmin.typeInInputField(
      `${certificateOutcomeInput}:first-of-type`,
      'Understanding of numbers and there relationship'
    );
    await curriculumAdmin.clickOnElementWithSelector(addOutcomeButton);
    await curriculumAdmin.typeInInputField(
      `${certificateOutcomeInput}:last-of-type`,
      'Ability to perform basic arithmetic accurately'
    );
    await curriculumAdmin.clickOnElementWithSelector(createDetailsNextButton);
    await curriculumAdmin.expectElementToBeVisible(certificateReviewContainer);
    await curriculumAdmin.expectTextContentToBe(
      certificateReviewContainer,
      'Requirements Met'
    );
    await curriculumAdmin.clickOnElementWithSelector(
      certificateReviewSaveButton
    );
    await curriculumAdmin.expectElementToBeVisible('.e2e-test-modal-header');
    await curriculumAdmin.clickOnElementWithSelector(
      confirmCreateCertificateButton
    );
    await curriculumAdmin.page.keyboard.press('Escape');
    await curriculumAdmin.page.waitForNavigation({
      waitUntil: ['networkidle2', 'load'],
      timeout: 60000,
    });

    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Offering Dashboard'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateTitleSelector,
      'Everyday Arithmetic & Number Confidence'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateStatusSelector,
      'Available'
    );
  });

  it('should edit an existing certificate offering and show the updated values on the dashboard', async function () {
    await curriculumAdmin.goto('/certificate-offering-dashboard');
    await curriculumAdmin.clickAndWaitForNavigation(
      editCertificateButton,
      true
    );
    await curriculumAdmin.expectTextContentToBe(
      'h1',
      'Edit Certificate Offering'
    );
    await curriculumAdmin.expectTextContentToBe(
      'h3.oppia-certificate-section-title',
      'Add Certificate Details'
    );

    await curriculumAdmin.typeInInputField(
      certificateTitleInput,
      'Real-World Quantities, Fractions & Percentages'
    );
    await curriculumAdmin.typeInInputField(
      certificateDescriptionInput,
      'Understanding and reasoning about quantities that are proportional or relative rather than whole.'
    );
    await curriculumAdmin.typeInInputField(certificateTimeLimitInput, '15');
    await curriculumAdmin.clickOnElementWithSelector(createDetailsNextButton);
    await curriculumAdmin.expectElementToBeVisible(certificateReviewContainer);
    await curriculumAdmin.clickOnElementWithSelector(
      certificateReviewSaveButton
    );
    await curriculumAdmin.expectElementToBeVisible('.e2e-test-modal-header');
    await curriculumAdmin.clickOnElementWithSelector(
      confirmCreateCertificateButton
    );
    await curriculumAdmin.page.keyboard.press('Escape');
    await curriculumAdmin.page.waitForNavigation({
      waitUntil: ['networkidle2', 'load'],
      timeout: 60000,
    });

    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Offering Dashboard'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateTitleSelector,
      'Real-World Quantities, Fractions & Percentages'
    );
    await curriculumAdmin.expectTextContentToBe(certificateTimeLabel, '15 min');
  });

  it('should save an insufficiently covered certificate offering as not ready', async function () {
    await curriculumAdmin.goto('/certificate-offering-dashboard');
    await curriculumAdmin.clickAndWaitForNavigation(
      editCertificateButton,
      true
    );
    await curriculumAdmin.expectTextContentToBe(
      'h1',
      'Edit Certificate Offering'
    );

    await curriculumAdmin.typeInInputField(
      certificateTotalQuestionsInput,
      '50'
    );
    await curriculumAdmin.clickOnElementWithSelector(createDetailsNextButton);
    await curriculumAdmin.expectElementToBeVisible(certificateReviewContainer);
    await curriculumAdmin.expectTextContentToBe(
      certificateReviewContainer,
      'Requirements Not Met'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateReviewContainer,
      'Place Values'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateReviewContainer,
      'Only 5 hard questions (minimum 8 required)'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateReviewContainer,
      'Not Ready'
    );

    await curriculumAdmin.clickOnElementWithSelector(
      certificateReviewSaveButton
    );
    await curriculumAdmin.expectElementToBeVisible('.e2e-test-modal-header');
    await curriculumAdmin.expectTextContentToBe(
      '.e2e-test-modal-header',
      'Update Certificate'
    );
    await curriculumAdmin.expectTextContentToBe(
      '.e2e-test-modal-body',
      'Save as Not Ready'
    );

    const confirmUpdateButtonIsDisabled = await curriculumAdmin.page.$eval(
      '.btn.btn-success.e2e-test-confirm-save-certificate',
      element => (element as HTMLButtonElement).disabled
    );
    expect(confirmUpdateButtonIsDisabled).toBe(true);
    await curriculumAdmin.clickOnElementWithText('Save as Not Ready');
    await curriculumAdmin.expectTextContentToBe(
      '.toast-message',
      'Certificate saved as not ready'
    );

    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Offering Dashboard'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateTitleSelector,
      'Real-World Quantities, Fractions & Percentages'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateStatusSelector,
      'Not Ready'
    );
  });

  it('should delete the edited certificate offering from the dashboard', async function () {
    await curriculumAdmin.goto('/certificate-offering-dashboard');
    await curriculumAdmin.clickOnElementWithSelector(deleteCertificateButton);
    await curriculumAdmin.expectElementToBeVisible('.e2e-test-modal-header');
    await curriculumAdmin.expectTextContentToBe(
      '.e2e-test-modal-header',
      'Delete Certificate'
    );

    await curriculumAdmin.clickOnElementWithText('Delete Certificate');
    await curriculumAdmin.expectTextContentToBe(
      '.toast-message',
      'Certificate deleted successfully'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Offering Dashboard'
    );
    await curriculumAdmin.expectElementToBeVisible(
      certificateRowSelector,
      false
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
