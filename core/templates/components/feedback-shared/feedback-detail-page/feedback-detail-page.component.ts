// coding: utf-8
//
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
 * @fileoverview Full-page detail view for a feedback item.
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';
import './feedback-detail-page.component.css';
import {
  CATEGORY_LABELS,
  FeedbackStatus,
  FEEDBACK_STATUS_LABELS,
  SOURCE_LABELS,
  TECHNICAL_TEAM_LABELS,
} from 'domain/feedback/feedback.model';
import type {
  FeedbackCardConfig,
  FeedbackSessionInfo,
  PlatformFeedbackDetailResponse,
} from 'domain/feedback/feedback.model';

@Component({
  selector: 'oppia-feedback-detail-page',
  templateUrl: './feedback-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDetailPageComponent {
  @Input() feedbackDetailResponse: PlatformFeedbackDetailResponse | null = null;
  @Input() feedbackDetailPageConfig!: FeedbackCardConfig;
  @Input() screenshotDataUrl: string | null = null;

  @Output() goBack = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<FeedbackStatus>();
  @Output() loadScreenshot = new EventEmitter<{
    entityId: string;
    filename: string;
  }>();

  isScreenshotModalOpen: boolean = false;

  readonly categoryLabels = CATEGORY_LABELS;
  readonly statusLabels = FEEDBACK_STATUS_LABELS;
  readonly sourceLabels = SOURCE_LABELS;
  readonly teamLabels = TECHNICAL_TEAM_LABELS;

  readonly TECHNICAL_STATUS_OPTIONS: FeedbackStatus[] = [
    FeedbackStatus.OPEN,
    FeedbackStatus.FIXED,
    FeedbackStatus.NOT_ACTIONABLE,
    FeedbackStatus.TRANSFERRED_TO_GITHUB,
  ];

  readonly CREATOR_STATUS_OPTIONS: FeedbackStatus[] = [
    FeedbackStatus.OPEN,
    FeedbackStatus.FIXED,
    FeedbackStatus.COMPLIMENT,
    FeedbackStatus.NOT_ACTIONABLE,
  ];

  constructor(private windowRef: WindowRef) {}

  get statusOptions(): FeedbackStatus[] {
    const config = this.feedbackDetailPageConfig;
    if (config.showSessionInfo) {
      return this.TECHNICAL_STATUS_OPTIONS;
    }
    return this.CREATOR_STATUS_OPTIONS;
  }

  get sessionInfo(): FeedbackSessionInfo | null {
    return this.feedbackDetailResponse?.session_info ?? null;
  }

  get hasTechnicalLogs(): boolean {
    return this.feedbackDetailResponse?.include_technical_logs === true;
  }

  get hasScreenshot(): boolean {
    return Boolean(this.feedbackDetailResponse?.screenshot_filename);
  }

  get hasLessonMetadata(): boolean {
    return (
      this.feedbackDetailResponse?.lesson_metadata !== null &&
      this.feedbackDetailResponse?.lesson_metadata !== undefined
    );
  }

  formatDate(epochMillis: number): string {
    const date = new Date(epochMillis);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  getCategoryLabel(category: string | null): string {
    if (!category) {
      return 'Not provided';
    }
    return this.categoryLabels[category] ?? category;
  }

  getCategoryBadgeClass(category: string): string {
    return 'badge-' + category;
  }

  getDestinationLabel(dashboard: string): string {
    if (dashboard === 'creator') {
      return 'Creator Dashboard';
    }
    if (dashboard === 'technical') {
      return 'Technical Dashboard';
    }
    if (dashboard === 'LEAP' || dashboard === 'CORE') {
      return this.teamLabels[dashboard];
    }
    return dashboard;
  }

  getPlatformLabel(platform: string): string {
    return platform === 'web' ? 'Web' : 'Android';
  }

  getSourceLabel(source: string): string {
    return this.sourceLabels[source] ?? source;
  }

  getOptionalText(value: string | null | undefined): string {
    if (value === null || value === undefined || value.trim() === '') {
      return 'Not provided';
    }
    return value;
  }

  getStatusButtonClass(
    statusOption: FeedbackStatus,
    currentStatus: FeedbackStatus
  ): string {
    return statusOption === currentStatus
      ? 'btn btn-sm btn-success'
      : 'btn btn-sm btn-outline-primary';
  }

  onStatusChange(status: FeedbackStatus): void {
    this.statusChange.emit(status);
    if (status === FeedbackStatus.TRANSFERRED_TO_GITHUB) {
      this.openGithubIssueForFeedback();
    }
  }

  onLoadScreenshot(): void {
    const response = this.feedbackDetailResponse;
    if (response?.screenshot_entity_id && response?.screenshot_filename) {
      this.loadScreenshot.emit({
        entityId: response.screenshot_entity_id,
        filename: response.screenshot_filename,
      });
    }
  }

  openScreenshotModal(): void {
    this.isScreenshotModalOpen = true;
  }

  closeScreenshotModal(): void {
    this.isScreenshotModalOpen = false;
  }

  getGithubIssueUrl(): string {
    const response = this.feedbackDetailResponse;
    const title = response
      ? `[BUG]: User feedback report: ${this.getCategoryLabel(
          response.category
        )}`
      : '[BUG]: User feedback report';
    const params = new URLSearchParams({
      template: '1_bug_report_form.yml',
      title: title,
      'describe-the-bug': this.getGithubIssueDescription(),
      'page-url': response?.page_url || 'Not provided',
      'steps-to-reproduce': this.getGithubIssueSteps(),
      'expected-behavior': this.getGithubIssueExpectedBehavior(),
      'screenshots-videos': this.getGithubIssueScreenshotDetails(),
      device: 'Desktop',
      'operating-system': 'Other',
      browsers: 'Other',
      'browser-version': this.getGithubIssueBrowserVersion(),
      'additional-context': this.getGithubIssueAdditionalContext(),
    });

    return `https://github.com/oppia/oppia/issues/new?${params.toString()}`;
  }

  private getGithubIssueDescription(): string {
    const response = this.feedbackDetailResponse;
    if (response === null) {
      return 'Feedback details were not available when this issue was created.';
    }

    return [
      response.report_message,
      '',
      'Transferred from the Oppia Technical feedback dashboard.',
      `Report ID: ${response.id}`,
      `Submitted: ${this.formatDate(response.created_on_msecs)}`,
      `Source: ${this.getSourceLabel(response.source)}`,
      `Category: ${this.getCategoryLabel(response.category)}`,
      `Platform: ${this.getPlatformLabel(response.platform)}`,
      `Dashboard: ${this.getDestinationLabel(response.destination_dashboard)}`,
    ].join('\n');
  }

  private getGithubIssueSteps(): string {
    const response = this.feedbackDetailResponse;
    if (response === null) {
      return 'Not provided by the feedback report.';
    }

    const issueLines = [
      '1. Review the transferred feedback report details.',
      `2. Open the reported page: ${response.page_url || 'Not provided'}`,
    ];
    if (response.lesson_metadata) {
      issueLines.push(
        `3. Check exploration ${response.lesson_metadata.exploration_id}, ` +
          `state "${response.lesson_metadata.state_name}".`,
        `4. Learner answer at report time: ${this.getOptionalText(
          response.lesson_metadata.learner_current_answer
        )}`
      );
    } else {
      issueLines.push('3. Use the report message and session logs to triage.');
    }

    return issueLines.join('\n');
  }

  private getGithubIssueExpectedBehavior(): string {
    return 'The reported user-facing problem should not occur.';
  }

  private getGithubIssueScreenshotDetails(): string {
    const response = this.feedbackDetailResponse;
    if (response === null || !response.screenshot_filename) {
      return 'No screenshot was attached to this report.';
    }
    return `Screenshot attached to feedback report: ${response.screenshot_filename}`;
  }

  private getGithubIssueAdditionalContext(): string {
    const response = this.feedbackDetailResponse;
    if (response === null) {
      return 'Feedback details were not available when this issue was created.';
    }

    return [
      '## Feedback metadata',
      '',
      `Report ID: ${response.id}`,
      `Screenshot entity ID: ${response.screenshot_entity_id || 'Not provided'}`,
      `Session logs included: ${this.hasTechnicalLogs ? 'Yes' : 'No'}`,
      '',
      '## Privacy warning',
      '',
      'WARNING: The session logs below may expose user data, page URLs, ' +
        'browser details, learner answers, request details, or other ' +
        'sensitive information. Review and redact this section before ' +
        'submitting the GitHub issue.',
      '',
      '## Session logs',
      '',
      '```json',
      this.getGithubIssueSessionLogJson(),
      '```',
    ].join('\n');
  }

  private getGithubIssueBrowserVersion(): string {
    const userAgent =
      this.feedbackDetailResponse?.session_info?.environment_json.user_agent;
    return userAgent || 'Not provided';
  }

  private getGithubIssueSessionLogJson(): string {
    const sessionInfo = this.feedbackDetailResponse?.session_info;
    if (!sessionInfo) {
      return 'No session logs were attached to this report.';
    }

    return JSON.stringify(sessionInfo, null, 2) ?? 'Unable to serialize logs.';
  }

  private openGithubIssueForFeedback(): void {
    this.windowRef.nativeWindow.open(
      this.getGithubIssueUrl(),
      '_blank',
      'noopener'
    );
  }
}
