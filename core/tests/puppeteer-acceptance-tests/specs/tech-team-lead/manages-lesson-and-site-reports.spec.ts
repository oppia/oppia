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
 * https://docs.google.com/spreadsheets/d/17Y5yOGuy0y5YFPPCUF5fZAZjEyY60bq6J0lik6yH3KE
 *
 * TL.1 can access the Technical Feedback Dashboard page, see the default list.
 * TL.2 can view every detail of a feedback report — message, screenshot, session logs, lesson context (when raised from a lesson), and the page URL.
 * Tl.3 can change the status of the feedback entries.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {showMessage} from '../../utilities/common/show-message';
import {
  FEEDBACK_STATUS_LABELS,
  FeedbackStatus,
} from '../../../../templates/domain/feedback/feedback.model';
import {TechTeamLead} from '../../utilities/user/tech-team-lead';

const ROLES = testConstants.Roles;
const statusLabels = FEEDBACK_STATUS_LABELS;

describe('Tech Team Lead', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let releaseCoordinator: ReleaseCoordinator;
  let lessonCreator: ExplorationEditor & LoggedInUser;
  let techTeamLead: TechTeamLead;
  let expId: string;

  beforeAll(async function () {
    lessonCreator = await UserFactory.createNewUser(
      'LessonCreator',
      'lessoncreator@example.com'
    );
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );
    await releaseCoordinator.enableFeatureFlag(
      'technical_feedback_dashboard_enabled'
    );
    await releaseCoordinator.enableFeatureFlag('web_feedback_modal_enabled');
    await releaseCoordinator.enableFeatureFlag('new_lesson_player');
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    techTeamLead = await UserFactory.createNewUser(
      'techLead',
      'techTeamLead@example.com',
      [ROLES.TECH_TEAM_LEAD]
    );
    await lessonCreator.navigateToCreatorDashboardPage();
    await lessonCreator.navigateToExplorationEditorFromCreatorDashboard();
    await lessonCreator.dismissWelcomeModal();
    await lessonCreator.updateCardContent('Introduction to Fractions');
    await lessonCreator.addInteraction('Number Input');
    await lessonCreator.addResponsesToTheInteraction(
      'Number Input',
      '-1',
      'Perfect!',
      'Last Card',
      true
    );
    await lessonCreator.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong, try again!'
    );
    await lessonCreator.addHintToState(
      'Remember that negative numbers are less than 0.'
    );
    await lessonCreator.addSolutionToState(
      '-99',
      'The number -99 is a negative number.',
      true
    );
    await lessonCreator.saveExplorationDraft();

    // Navigate to the new card and add Study Guide content.
    await lessonCreator.navigateToCard('Last Card');
    await lessonCreator.updateCardContent(
      'Congratulations! You have completed the exploration.'
    );
    await lessonCreator.addInteraction('End Exploration');

    // Save the draft.
    await lessonCreator.saveExplorationDraft();

    expId = await lessonCreator.publishExplorationWithMetadata(
      'What are the Place Values',
      'Learn the basics of place values',
      'Algebra'
    );

    loggedInLearner = await UserFactory.createNewUser(
      'learner',
      'learner@example.com'
    );

    await loggedInLearner.navigateToCreatorDashboard();
    await loggedInLearner.clickOnProfileDropdown();
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Report a Website Issue'
    );
    await loggedInLearner.openReportASiteIssueModal();
    showMessage('Clicked on "Report a Website Issue" button.');
    await loggedInLearner.submitFeedbackInTextArea(
      'Failing to load dashboard.'
    );
    await loggedInLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedInLearner.clickOnIncludetechnicalLogCheckbox();
    await loggedInLearner.clickButtonInModal(
      'Report a Website Issue',
      'confirm'
    );
    showMessage('Submitted a site report.');

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.clickOnProfileDropdown();
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Report a Website Issue'
    );
    await loggedInLearner.openReportASiteIssueModal();
    showMessage('Clicked on "Report a Website Issue" button.');
    await loggedInLearner.submitFeedbackInTextArea(
      'My goal progress are not matching.'
    );
    await loggedInLearner.clickOnIncludetechnicalLogCheckbox();
    await loggedInLearner.clickButtonInModal(
      'Report a Website Issue',
      'confirm'
    );
    showMessage('Submitted two site reports.');

    await loggedInLearner.playLesson(expId);
    await loggedInLearner.submitAnswer('1');
    await loggedInLearner.toggleOptionsSidebar();

    await loggedInLearner.clickReportLessonButton(true);
    await loggedInLearner.selectReportIssueChip('broken layout');
    await loggedInLearner.submitFeedbackInTextArea(
      'image layout is messed up, please fix it!'
    );
    await loggedInLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(true);
    await loggedInLearner.clickButtonInModal('Report an Issue', 'confirm');

    await loggedInLearner.clickReportLessonButton(true);
    await loggedInLearner.selectReportIssueChip('other');
    await loggedInLearner.submitFeedbackInTextArea(
      'Answer is not submitting in this card.'
    );
    await loggedInLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(true);
    await loggedInLearner.clickButtonInModal('Report an Issue', 'confirm');
    showMessage('Submitted two lesson reports.');
  }, 350000);

  it('should be able to access the Technical Feedback Dashboard page', async function () {
    await techTeamLead.navigateToLearnerDashboard();
    await techTeamLead.clickOnProfileDropdown();
    await techTeamLead.expectProfileDropdownToContainElementWithContent(
      'Technical Feedback Dashboard'
    );
    await techTeamLead.navigateToTechnicalFeedbackDashboardThroughProfileDropdown();

    await techTeamLead.expectScreenshotToMatch(
      'techTeamLeadLandingPage',
      __dirname
    );

    await techTeamLead.expectTechnicalFeedbackDashboard();

    await techTeamLead.verifyTechnicalFeedbackDashboardFeedbackFilterRowContents();
    await techTeamLead.verifyDefaultTechnicalFeedbackDashboardFilter();
    await techTeamLead.verifyTechnicalFeedbackDashboardFeedbackListColumns();

    await techTeamLead.expectFeedbackTableEntry({
      description: 'Answer is not submitting in this card.',
      status: statusLabels[FeedbackStatus.OPEN],
      categoryChip: 'Other / Not Sure',
    });
    await techTeamLead.expectFeedbackTableEntry({
      description: 'image layout is messed up, please fix it!',
      status: statusLabels[FeedbackStatus.OPEN],
      categoryChip: 'Broken Layout / Image',
    });
    await techTeamLead.expectFeedbackTableEntry({
      description: 'My goal progress are not matching.',
      status: statusLabels[FeedbackStatus.OPEN],
      categoryChip: '—',
    });
  });

  it('should open a report with screenshot and session logs', async function () {
    await techTeamLead.clickOnFeedbackListEntryWithDescription(
      'image layout is messed up, please fix it!'
    );

    await techTeamLead.expectScreenshotToMatch(
      'Entry2FeedbackDetailView',
      __dirname
    );

    await techTeamLead.verifyExplorationFeedbackDetailView(
      'report',
      'Open',
      'Broken Layout / Image'
    );
    await techTeamLead.verifyFeedbackDetailPageDetailsSection(
      statusLabels[FeedbackStatus.OPEN],
      'Lesson',
      'Web',
      'http://localhost:8181/lesson/' + expId,
      'Broken Layout / Image'
    );
    await techTeamLead.verifyFeedbackDetailScreenshotSection();
    await techTeamLead.verifyFeedbackDetailPageLessonContextSection(
      expId,
      '4',
      'Introduction',
      '0',
      '1'
    );
    await techTeamLead.verifyFeedbackDetailPageRepliesSection(false, true);
    await techTeamLead.verifyFeedbackDetailTechnicalLogsSection();
    await techTeamLead.clickReportedLessonVersionLink(expId, '4');
    await techTeamLead.clickReportedLessonStateEditorLink(
      expId,
      'Introduction'
    );

    await techTeamLead.verifyFeedbackDetailPageUserFeedbackSection(
      'image layout is messed up, please fix it!'
    );
    await techTeamLead.verifyTechnicalFeedbackDetailStatusActionsButtons();

    await techTeamLead.clickFeedbackDetailBackButton();
    await techTeamLead.expectPageURLToContain('technical-feedback-dashboard');
    await techTeamLead.expectTechnicalFeedbackDashboard();
    await techTeamLead.verifyTechnicalFeedbackDashboardFeedbackListColumns();
  });

  it('should open a report with no screenshot but NO session logs', async function () {
    await techTeamLead.expectFeedbackTableEntry({
      description: 'My goal progress are not matching.',
      status: statusLabels[FeedbackStatus.OPEN],
      categoryChip: '—',
    });

    await techTeamLead.clickOnFeedbackListEntryWithDescription(
      'My goal progress are not matching.'
    );

    await techTeamLead.expectScreenshotToMatch(
      'Entry3FeedbackDetailView',
      __dirname
    );

    await techTeamLead.verifyExplorationFeedbackDetailView('report', 'Open');
    await techTeamLead.verifyFeedbackDetailPageDetailsSection(
      statusLabels[FeedbackStatus.OPEN],
      'App',
      'Web',
      'http://localhost:8181/learner-dashboard'
    );
    await techTeamLead.verifyFeedbackDetailScreenshotIsNotPresent();
    await techTeamLead.verifyFeedbackDetailPageHasNoSessionInformation();
  });

  it('should be able to change the status of a feedback report', async function () {
    await techTeamLead.clickFeedbackDetailBackButton();
    await techTeamLead.selectFeedbackStatusFilter(
      FEEDBACK_STATUS_LABELS[FeedbackStatus.OPEN]
    );
    await techTeamLead.selectFeedbackTechnicalTeamFilter('tech-internal');

    await techTeamLead.clickApplyButton();

    await techTeamLead.expectScreenshotToMatch(
      'Entry1FeedbackDetailView',
      __dirname
    );

    await techTeamLead.expectFeedbackTableEntry({
      description: 'Failing to load dashboard.',
      status: statusLabels[FeedbackStatus.OPEN],
      categoryChip: '—',
    });
    await techTeamLead.clickOnFeedbackListEntryWithDescription(
      'Failing to load dashboard.'
    );

    await techTeamLead.verifyExplorationFeedbackDetailView('report', 'Open');
    await techTeamLead.verifyFeedbackDetailPageDetailsSection(
      statusLabels[FeedbackStatus.OPEN],
      'App',
      'Web',
      'http://localhost:8181/creator-dashboard'
    );

    await techTeamLead.clickFeedbackDetailStatusButton(
      statusLabels[FeedbackStatus.FIXED]
    );
    await techTeamLead.verifyFeedbackStatusActions(
      statusLabels[FeedbackStatus.FIXED],
      statusLabels[FeedbackStatus.OPEN]
    );
    await techTeamLead.expectToastMessage('Feedback status updated to fixed.');

    await techTeamLead.expectScreenshotToMatch(
      'Entry1FeedbackDetailViewWithFixedStatus',
      __dirname
    );

    await techTeamLead.verifyExplorationFeedbackDetailView('report', 'Fixed');
    await techTeamLead.verifyFeedbackDetailPageDetailsSection(
      statusLabels[FeedbackStatus.FIXED],
      'App',
      'Web',
      'http://localhost:8181/creator-dashboard'
    );

    await techTeamLead.clickFeedbackDetailBackButton();
    await techTeamLead.selectFeedbackStatusFilter('fixed');
    await techTeamLead.selectFeedbackTechnicalTeamFilter('tech-internal');
    await techTeamLead.clickApplyButton();

    await techTeamLead.expectScreenshotToMatch(
      'coreFixedFilterTableList',
      __dirname
    );

    await techTeamLead.expectFeedbackTableEntry({
      description: 'Failing to load dashboard.',
      status: statusLabels[FeedbackStatus.FIXED],
      categoryChip: '—',
    });

    await techTeamLead.clickOnFeedbackListEntryWithDescription(
      'Failing to load dashboard.'
    );
    await techTeamLead.verifyExplorationFeedbackDetailView('report', 'Fixed');
    // Click on the "open" status  button.
    await techTeamLead.clickFeedbackDetailStatusButton(
      statusLabels[FeedbackStatus.OPEN]
    );
    await techTeamLead.expectToastMessage('Feedback status updated to open.');
    await techTeamLead.verifyFeedbackDetailPageDetailsSection(
      statusLabels[FeedbackStatus.OPEN],
      'App',
      'Web',
      'http://localhost:8181/creator-dashboard'
    );
    await techTeamLead.verifyFeedbackStatusActions(
      statusLabels[FeedbackStatus.OPEN],
      statusLabels[FeedbackStatus.FIXED]
    );

    await techTeamLead.expectScreenshotToMatch(
      'Entry1FeedbackDetailViewWithOpenStatus',
      __dirname
    );
    // Click on the "not_actionable" status button.
    await techTeamLead.clickFeedbackDetailStatusButton(
      statusLabels[FeedbackStatus.NOT_ACTIONABLE]
    );
    await techTeamLead.expectToastMessage(
      'Feedback status updated to not_actionable.'
    );
    await techTeamLead.verifyFeedbackDetailPageDetailsSection(
      statusLabels[FeedbackStatus.NOT_ACTIONABLE],
      'App',
      'Web',
      'http://localhost:8181/creator-dashboard'
    );
    await techTeamLead.verifyFeedbackStatusActions(
      statusLabels[FeedbackStatus.NOT_ACTIONABLE],
      statusLabels[FeedbackStatus.OPEN]
    );

    await techTeamLead.expectScreenshotToMatch(
      'Entry1FeedbackDetailViewWithNotActionableStatus',
      __dirname
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
