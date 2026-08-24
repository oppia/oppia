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
const confirmSaveCertificateButton = '.e2e-test-confirm-save-certificate';
const saveAsNotReadyButton = '.e2e-test-save-as-not-ready-button';
const certificateTitleSelector = '.oppia-certificate-title';
const certificateStatusSelector = '.oppia-status-badge';
const certificateRowSelector = '.oppia-certificate-creator-table tbody tr';
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
const deleteCertificateConfirmButton =
  '.e2e-test-delete-certificate-confirm-button';
const certificateTimeLabel = '.e2e-test-certificate-time-label';
const topicRowSelector = '.e2e-test-topic-row';
const addTopicButton = '.e2e-test-add-topic-button';
const selectedTopicsSummary = '.e2e-test-selected-topics-summary';
const selectedTopicCardSelector = '.e2e-test-selected-topic-card';
const removeTopicButton = '.e2e-test-remove-topic-button';
const topicsNextButton = '.e2e-test-topics-next-button';
const reviewOverallStatusSelector = '.e2e-test-review-overall-status';
const topicReadinessRowSelector = '.e2e-test-topic-readiness-row';
const topicReadinessHardCellSelector = '.e2e-test-topic-readiness-hard-cell';

const CREATE_CERTIFICATE_TITLE = 'Everyday Arithmetic & Number Confidence';
const UPDATED_CERTIFICATE_TITLE =
  'Real-World Quantities, Fractions & Percentages';
const TWO_TOPICS_SELECTED = 'All 2 topics selected.';
const ONE_TOPIC_SELECTED = 'All 1 topics selected.';

describe('Certificate Assessment', function () {
  let curriculumAdmin: CurriculumAdmin;
  let releaseCoordinator: ReleaseCoordinator;

  const clickAddTopicButton = async (topicName: string): Promise<void> => {
    await curriculumAdmin.page.evaluate(
      (topicName, rowSelector, buttonSelector) => {
        const topicRows = Array.from(
          document.querySelectorAll<HTMLElement>(rowSelector)
        );
        const topicRow = topicRows.find(row =>
          row.textContent?.includes(topicName)
        );
        const button =
          topicRow?.querySelector<HTMLButtonElement>(buttonSelector);
        if (!button) {
          throw new Error(`Could not find the add button for ${topicName}.`);
        }
        button.click();
      },
      topicName,
      topicRowSelector,
      addTopicButton
    );
  };

  const expectTopicToNotBeSelected = async (
    topicName: string
  ): Promise<void> => {
    await curriculumAdmin.page.waitForFunction(
      (topicName: string, cardSelector: string) => {
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>(cardSelector)
        );
        return cards.every(card => !card.textContent?.includes(topicName));
      },
      {},
      topicName,
      selectedTopicCardSelector
    );
  };

  const clickRemoveTopicButton = async (topicName: string): Promise<void> => {
    await curriculumAdmin.page.evaluate(
      (topicName, cardSelector, buttonSelector) => {
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>(cardSelector)
        );
        const card = cards.find(card => card.textContent?.includes(topicName));
        const button = card?.querySelector<HTMLButtonElement>(buttonSelector);
        if (!button) {
          throw new Error(`Could not find the remove button for ${topicName}.`);
        }
        button.click();
      },
      topicName,
      selectedTopicCardSelector,
      removeTopicButton
    );
  };

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
      'math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );
  }, 3000000);

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

    await curriculumAdmin.expectScreenshotToMatch(
      'noCertificateCreatedYet',
      __dirname
    );
  });

  it('should create a certificate offering and show it on the dashboard', async function () {
    await curriculumAdmin.goto(testConstants.URLs.CertificateCreatorDashboard);
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
      CREATE_CERTIFICATE_TITLE
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
    await curriculumAdmin.expectScreenshotToMatch(
      'certificateDetailsFilled',
      __dirname
    );

    await curriculumAdmin.clickOnElementWithSelector(createDetailsNextButton);
    await curriculumAdmin.expectElementToBeVisible(topicRowSelector);
    await clickAddTopicButton('Place Values');
    await clickAddTopicButton('Addition and Subtraction');
    await curriculumAdmin.expectTextContentToBe(
      selectedTopicsSummary,
      TWO_TOPICS_SELECTED
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'certificateTopicsSelected',
      __dirname
    );
    await curriculumAdmin.clickOnElementWithSelector(topicsNextButton);

    await curriculumAdmin.expectElementToBeVisible(certificateReviewContainer);
    await curriculumAdmin.expectElementContentToContain(
      reviewOverallStatusSelector,
      'Requirements Met'
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'certificateReviewRequirementsMet',
      __dirname
    );
    await curriculumAdmin.clickOnElementWithSelector(
      certificateReviewSaveButton
    );
    await curriculumAdmin.expectTextContentToBe(
      '.e2e-test-modal-header',
      'Publish Certificate'
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'publishCertificateModal',
      __dirname
    );
    await curriculumAdmin.clickOnElementWithSelector(
      confirmSaveCertificateButton
    );
    await curriculumAdmin.expectTextContentToBe(
      '.toast-message',
      'Certificate created.'
    );
    await curriculumAdmin.page.keyboard.press('Escape');
    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Creator Dashboard'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateTitleSelector,
      CREATE_CERTIFICATE_TITLE
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateStatusSelector,
      'Available'
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'certificateDashboardWithCertificate',
      __dirname
    );
  });

  it('should edit an existing certificate offering and show the updated values on the dashboard', async function () {
    await curriculumAdmin.goto(testConstants.URLs.CertificateCreatorDashboard);
    await curriculumAdmin.clickAndWaitForNavigation(
      editCertificateButton,
      true
    );
    await curriculumAdmin.expectTextContentToBe(
      '.oppia-certificate-offering-title',
      'Edit Certificate'
    );
    await curriculumAdmin.expectTextContentToBe(
      'h3.oppia-certificate-section-title',
      'Add Certificate Details'
    );

    await curriculumAdmin.clearAllTextFrom(certificateTitleInput);
    await curriculumAdmin.typeInInputField(
      certificateTitleInput,
      UPDATED_CERTIFICATE_TITLE
    );
    await curriculumAdmin.clearAllTextFrom(certificateDescriptionInput);
    await curriculumAdmin.typeInInputField(
      certificateDescriptionInput,
      'Understanding and reasoning about quantities that are proportional or relative rather than whole.'
    );
    await curriculumAdmin.clearAllTextFrom(certificateTimeLimitInput);
    await curriculumAdmin.typeInInputField(certificateTimeLimitInput, '15');

    await curriculumAdmin.clickOnElementWithSelector(createDetailsNextButton);
    await curriculumAdmin.expectElementToBeVisible(topicRowSelector);
    await curriculumAdmin.expectTextContentToBe(
      selectedTopicsSummary,
      TWO_TOPICS_SELECTED
    );
    await curriculumAdmin.clickOnElementWithSelector(topicsNextButton);

    await curriculumAdmin.expectElementToBeVisible(certificateReviewContainer);
    await curriculumAdmin.expectElementContentToContain(
      reviewOverallStatusSelector,
      'Requirements Met'
    );
    await curriculumAdmin.clickOnElementWithSelector(
      certificateReviewSaveButton
    );
    await curriculumAdmin.expectTextContentToBe(
      '.e2e-test-modal-header',
      'Update Certificate'
    );
    await curriculumAdmin.clickOnElementWithSelector(
      confirmSaveCertificateButton
    );
    await curriculumAdmin.expectTextContentToBe(
      '.toast-message',
      'Certificate updated.'
    );
    await curriculumAdmin.page.keyboard.press('Escape');
    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Creator Dashboard'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateTitleSelector,
      UPDATED_CERTIFICATE_TITLE
    );
    await curriculumAdmin.expectTextContentToBe(certificateTimeLabel, '15 min');
  });

  it('should remove and add topics for an existing certificate offering', async function () {
    await curriculumAdmin.goto(testConstants.URLs.CertificateCreatorDashboard);
    await curriculumAdmin.clickAndWaitForNavigation(
      editCertificateButton,
      true
    );
    await curriculumAdmin.expectTextContentToBe(
      '.oppia-certificate-offering-title',
      'Edit Certificate'
    );

    await curriculumAdmin.clickOnElementWithSelector(createDetailsNextButton);
    await curriculumAdmin.expectElementToBeVisible(topicRowSelector);
    await curriculumAdmin.expectTextContentToBe(
      selectedTopicsSummary,
      TWO_TOPICS_SELECTED
    );

    await clickRemoveTopicButton('Addition and Subtraction');
    await curriculumAdmin.expectTextContentToBe(
      selectedTopicsSummary,
      ONE_TOPIC_SELECTED
    );
    await expectTopicToNotBeSelected('Addition and Subtraction');
    await curriculumAdmin.expectScreenshotToMatch(
      'certificateTopicRemoved',
      __dirname
    );

    await clickAddTopicButton('Fraction');
    await curriculumAdmin.expectTextContentToBe(
      selectedTopicsSummary,
      TWO_TOPICS_SELECTED
    );
    await curriculumAdmin.clickOnElementWithSelector(topicsNextButton);

    await curriculumAdmin.expectElementToBeVisible(certificateReviewContainer);
    await curriculumAdmin.expectElementContentToContain(
      reviewOverallStatusSelector,
      'Requirements Met'
    );
    await curriculumAdmin.clickOnElementWithSelector(
      certificateReviewSaveButton
    );
    await curriculumAdmin.expectTextContentToBe(
      '.e2e-test-modal-header',
      'Update Certificate'
    );
    await curriculumAdmin.clickOnElementWithSelector(
      confirmSaveCertificateButton
    );
    await curriculumAdmin.expectTextContentToBe(
      '.toast-message',
      'Certificate updated.'
    );
    await curriculumAdmin.page.keyboard.press('Escape');
    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Creator Dashboard'
    );
  });

  it('should save an insufficiently covered certificate offering as not ready', async function () {
    await curriculumAdmin.goto(testConstants.URLs.CertificateCreatorDashboard);
    await curriculumAdmin.clickAndWaitForNavigation(
      editCertificateButton,
      true
    );
    await curriculumAdmin.expectTextContentToBe(
      '.oppia-certificate-offering-title',
      'Edit Certificate'
    );

    await curriculumAdmin.clearAllTextFrom(certificateTotalQuestionsInput);
    await curriculumAdmin.typeInInputField(
      certificateTotalQuestionsInput,
      '50'
    );

    await curriculumAdmin.clickOnElementWithSelector(createDetailsNextButton);
    await curriculumAdmin.expectElementToBeVisible(topicRowSelector);
    await curriculumAdmin.expectTextContentToBe(
      selectedTopicsSummary,
      TWO_TOPICS_SELECTED
    );
    await curriculumAdmin.clickOnElementWithSelector(topicsNextButton);

    await curriculumAdmin.expectElementToBeVisible(certificateReviewContainer);
    await curriculumAdmin.expectElementContentToContain(
      certificateReviewContainer,
      'Requirements Not Met'
    );
    await curriculumAdmin.expectElementContentToContain(
      certificateReviewContainer,
      'Place Values'
    );
    await curriculumAdmin.expectElementContentToContain(
      certificateReviewContainer,
      'Place Values: Only 1 hard questions (minimum 8 required)'
    );
    await curriculumAdmin.expectElementContentToContain(
      topicReadinessHardCellSelector,
      '1 / 8'
    );
    await curriculumAdmin.expectElementContentToContain(
      topicReadinessRowSelector,
      'Not Ready'
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'certificateReviewRequirementsNotMet',
      __dirname
    );

    await curriculumAdmin.clickOnElementWithSelector(
      certificateReviewSaveButton
    );
    await curriculumAdmin.expectTextContentToBe(
      '.e2e-test-modal-header',
      'Update Certificate'
    );
    const confirmUpdateButtonIsDisabled = await curriculumAdmin.page.$eval(
      confirmSaveCertificateButton,
      element => (element as HTMLButtonElement).disabled
    );
    expect(confirmUpdateButtonIsDisabled).toBe(true);
    await curriculumAdmin.clickOnElementWithSelector(saveAsNotReadyButton);
    await curriculumAdmin.expectTextContentToBe(
      '.toast-message',
      'Certificate saved as not ready.'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Creator Dashboard'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateTitleSelector,
      UPDATED_CERTIFICATE_TITLE
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateStatusSelector,
      'Not Ready'
    );
  });

  it('should delete the certificate offering from the dashboard', async function () {
    await curriculumAdmin.goto(testConstants.URLs.CertificateCreatorDashboard);
    await curriculumAdmin.clickOnElementWithSelector(deleteCertificateButton);
    await curriculumAdmin.expectTextContentToBe(
      '.e2e-test-modal-header',
      'Delete Certificate'
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'deleteCertificateModal',
      __dirname
    );
    await curriculumAdmin.clickOnElementWithSelector(
      deleteCertificateConfirmButton
    );
    await curriculumAdmin.expectTextContentToBe(
      '.toast-message',
      'Certificate deleted successfully.'
    );
    await curriculumAdmin.expectTextContentToBe(
      certificateDashboardTitle,
      'Certificate Creator Dashboard'
    );
    await curriculumAdmin.expectElementToBeVisible(
      certificateRowSelector,
      false
    );
    await curriculumAdmin.expectScreenshotToMatch(
      'certificateDashboardWithoutCertificate',
      __dirname
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
