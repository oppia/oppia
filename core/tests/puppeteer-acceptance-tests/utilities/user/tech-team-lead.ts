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
 * @fileoverview Tech Team Lead role utility file.
 */

import testConstants from '../common/test-constants';
import {LoggedInUser} from './logged-in-user';

const technicalFeedbackDashboardUrl =
  testConstants.URLs.TechnicalFeedbackDashboard;
const feedbackDetailPageSessionInfoSection =
  '.e2e-test-feedback-detail-session-info-section';
const feedbackFilterTechnicalTeam =
  '.e2e-test-feedback-filter-technical-team-select';
const feedbackTableCategoryChip = '.e2e-test-my-suggestions-category';
const profileDropdown = '.e2e-test-profile-dropdown';
const technicalFeedbackDashboardLink =
  '.e2e-test-technical-feedback-dashboard-link';
const technicalFeedbackDashboardPageHeader =
  '.e2e-test-technical-feedback-dashboard-page-header';
const technicalFeedbackDashboardPageContent =
  '.e2e-test-technical-feedback-dashboard-page-content';
const feedbackDetailPageNoSessionLogs =
  '.e2e-test-feedback-detail-no-sessionLogs';
const feedbackDetailPageEnvironmentLabel =
  '.e2e-test-feedback-detail-environment-label';
const feedbackDetailPageEnvironmentValue =
  '.e2e-test-feedback-detail-environment-value';
const feedbackDetailPageConsoleLabel =
  '.e2e-test-feedback-detail-console-label';
const feedbackDetailPageConsoleValue =
  '.e2e-test-feedback-detail-console-value';
const feedbackDetailPageFailedRequestsLabel =
  '.e2e-test-feedback-detail-failed-requests-label';
const feedbackDetailPageFailedRequestsValue =
  '.e2e-test-feedback-detail-failed-requests-value';
const feedbackDetailPageNavigationHistoryLabel =
  '.e2e-test-feedback-detail-navigation-history-label';
const feedbackDetailPageNavigationHistoryValue =
  '.e2e-test-feedback-detail-navigation-history-value';
const feedbackDetailPageActionsSection =
  '.e2e-test-feedback-detail-actions-section';
// Action Btns selectors.
const feedbackDetailActionStatusLabel =
  '.e2e-test-feedback-detail-action-status-label';
const feedbackDetailActionStatusOpenBtn =
  '.e2e-test-feedback-detail-action-open-status-btn';
const feedbackDetailActionStatusFixedBtn =
  '.e2e-test-feedback-detail-action-fixed-status-btn';
const feedbackDetailActionStatusNotActionableBtn =
  '.e2e-test-feedback-detail-action-not_actionable-status-btn';
const feedbackDetailActionStatusTransferredToGithubBtn =
  '.e2e-test-feedback-detail-action-transferred_to_github-status-btn';
const feedbackDetailScreensshotPreview =
  '.e2e-test-feedback-detail-screenshot-preview';
const feedbackDetailScreensshotBtn = '.e2e-test-feedback-detail-screenshot-btn';

export class TechTeamLead extends LoggedInUser {
  /**
   * Verifies the Technical Feedback Dashboard page.
   */
  async expectTechnicalFeedbackDashboard(): Promise<void> {
    await this.expectElementToBeVisible(
      technicalFeedbackDashboardPageContent,
      true
    );
    await this.expectTextContentToBe(
      technicalFeedbackDashboardPageHeader,
      'Technical Feedback Dashboard'
    );
  }

  /**
   * Opens the Report a Site Issue Modal from the Profile Dropdown.
   */
  async navigateToTechnicalFeedbackDashboardThroughProfileDropdown(): Promise<void> {
    await this.expectElementToBeVisible(profileDropdown);
    await this.clickOnElementWithSelector(profileDropdown);

    await this.page.waitForSelector(technicalFeedbackDashboardLink, {
      visible: true,
    });
    await this.clickOnElementWithSelector(technicalFeedbackDashboardLink);
    await this.waitForNetworkIdle();
    await this.expectPageURLToContain(technicalFeedbackDashboardUrl);
  }

  /**
   * Verifies the default feedback tab filter.
   */
  async verifyDefaultTechnicalFeedbackDashboardFilter(): Promise<void> {
    await this.verifyDefaultFeedbackTabFilter(
      'open',
      feedbackFilterTechnicalTeam,
      'tech-external'
    );
  }

  /**
   * Verifies the feedback filter row contents of the Technical Feedback Dashboard.
   */
  async verifyTechnicalFeedbackDashboardFeedbackFilterRowContents(): Promise<void> {
    await this.verifyFeedbackFilterRowContents(feedbackFilterTechnicalTeam);
  }

  /**
   * Selects the Technical Team feedback filter option.
   * @param team - The team value that needs to b eselected.
   */
  async selectFeedbackTechnicalTeamFilter(team: string): Promise<void> {
    await this.select(feedbackFilterTechnicalTeam, team);

    await this.expectElementValue(feedbackFilterTechnicalTeam, team);
  }

  /**
   * Verifies the feedback list's columns of the Technical Feedback Dashboard.
   */
  async verifyTechnicalFeedbackDashboardFeedbackListColumns(): Promise<void> {
    await this.verifyFeedbackListColumns([feedbackTableCategoryChip]);
  }

  /**
   * Verifies the feedback detail page has no screenshot.
   */
  async verifyFeedbackDetailScreenshotIsNotPresent(): Promise<void> {
    await this.expectElementToBeVisible(
      feedbackDetailScreensshotPreview,
      false
    );
    await this.expectElementToBeVisible(feedbackDetailScreensshotBtn, false);
  }

  /**
   * Verifies the feedback detail page has no session information.
   */
  async verifyFeedbackDetailPageHasNoSessionInformation(): Promise<void> {
    await this.expectTextContentToContain(
      feedbackDetailPageSessionInfoSection,
      'Session Information'
    );

    await this.expectTextContentToBe(
      feedbackDetailPageNoSessionLogs,
      'No session information was attached to this report.'
    );
  }

  /**
   * Verifies the feedback detail page Technical logs section.
   */
  async verifyFeedbackDetailTechnicalLogsSection(): Promise<void> {
    await this.expectTextContentToContain(
      feedbackDetailPageSessionInfoSection,
      'Session Information'
    );
    await this.expectTextContentToBe(
      feedbackDetailPageEnvironmentLabel,
      'Environment'
    );
    await this.expectElementToBeVisible(feedbackDetailPageEnvironmentValue);
    await this.expectTextContentToBe(
      feedbackDetailPageConsoleLabel,
      'Console logs'
    );
    await this.expectElementToBeVisible(feedbackDetailPageConsoleValue);
    await this.expectTextContentToBe(
      feedbackDetailPageFailedRequestsLabel,
      'Failed requests'
    );
    await this.expectElementToBeVisible(feedbackDetailPageFailedRequestsValue);
    await this.expectTextContentToBe(
      feedbackDetailPageNavigationHistoryLabel,
      'Navigation history'
    );
    await this.expectElementToBeVisible(
      feedbackDetailPageNavigationHistoryValue
    );
  }

  /**
   * Verifies the feedback detail page status actions buttons.
   */
  async verifyTechnicalFeedbackDetailStatusActionsButtons(): Promise<void> {
    await this.expectTextContentToContain(
      feedbackDetailPageActionsSection,
      'Actions'
    );
    await this.expectTextContentToBe(
      feedbackDetailActionStatusLabel,
      'Change status:'
    );
    await this.expectElementToBeClickable(
      feedbackDetailActionStatusOpenBtn,
      false
    );
    await this.expectElementToBeClickable(
      feedbackDetailActionStatusTransferredToGithubBtn,
      true
    );
    await this.expectElementToBeClickable(
      feedbackDetailActionStatusFixedBtn,
      true
    );
    await this.expectElementToBeClickable(
      feedbackDetailActionStatusNotActionableBtn,
      true
    );
  }
}

export let TechTeamLeadFactory = (): TechTeamLead => new TechTeamLead();
