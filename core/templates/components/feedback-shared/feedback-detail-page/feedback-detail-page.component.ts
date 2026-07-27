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
import {DateTimeFormatService} from 'services/date-time-format.service';
import {
  CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  FeedbackCardConfig,
  FeedbackSessionInfo,
  FeedbackStatus,
  PlatformFeedbackDetailResponse,
  SOURCE_LABELS,
  TECHNICAL_TEAM_LABELS,
} from 'domain/feedback/feedback.model';
import './feedback-detail-page.component.css';

@Component({
  selector: 'oppia-feedback-detail-page',
  templateUrl: './feedback-detail-page.component.html',
  styleUrls: ['./feedback-detail-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDetailPageComponent {
  constructor(private dateTimeFormatService: DateTimeFormatService) {}
  @Input() feedbackDetailResponse!: PlatformFeedbackDetailResponse;
  @Input() feedbackDetailPageConfig!: FeedbackCardConfig;
  @Input() screenshotDataUrl: string | null = null;
  @Output() goBack = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<FeedbackStatus>();
  @Output() githubTransfer = new EventEmitter<string>();

  readonly categoryLabels = CATEGORY_LABELS;
  readonly statusLabels = FEEDBACK_STATUS_LABELS;
  readonly sourceLabels = SOURCE_LABELS;
  readonly teamLabels = TECHNICAL_TEAM_LABELS;
  readonly statusOptions = Object.values(FeedbackStatus);
  readonly transferredToGithubStatus = FeedbackStatus.TRANSFERRED_TO_GITHUB;

  replyText: string = '';
  isSendingReply: boolean = false;

  getPlatformLabel(platform: string): string {
    return platform === 'web' ? 'Web' : 'Android';
  }

  formatDate(timestamp: number): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      timestamp
    );
  }

  getReportedLessonUrl(): string | null {
    const metadata = this.feedbackDetailResponse?.lesson_metadata;
    if (!metadata) {
      return null;
    }
    return (
      `/explore/${encodeURIComponent(metadata.exploration_id)}` +
      `?v=${metadata.exploration_version}`
    );
  }

  getReportedStateEditorUrl(): string | null {
    const metadata = this.feedbackDetailResponse?.lesson_metadata;
    if (!metadata) {
      return null;
    }

    return (
      `/create/${encodeURIComponent(metadata.exploration_id)}` +
      `#/gui/${encodeURIComponent(metadata.state_name)}`
    );
  }

  get sessionInfo(): FeedbackSessionInfo | null {
    return this.feedbackDetailResponse?.session_info ?? null;
  }

  getCategoryLabel(category: string | null): string {
    if (!category) {
      return 'Not provided';
    }
    return this.categoryLabels[category] || category;
  }

  getSourceLabel(source: string): string {
    return this.sourceLabels[source] || source;
  }

  getDestinationLabel(
    destinationDashboard: 'tech-external' | 'tech-internal' | 'curriculum'
  ): string {
    return destinationDashboard === 'curriculum'
      ? 'Creator'
      : this.teamLabels[destinationDashboard];
  }

  onStatusOptionClick(status: FeedbackStatus): void {
    if (status === FeedbackStatus.TRANSFERRED_TO_GITHUB) {
      this.githubTransfer.emit(this.getGithubIssueUrl());
      return;
    }

    this.statusChange.emit(status);
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

    const issueLines = [
      '1. Review the transferred feedback report details.',
      `2. Open the reported page: ${response.page_url || 'Not provided'}`,
    ];
    if (response.lesson_metadata) {
      issueLines.push(
        `3. Check exploration ${response.lesson_metadata.exploration_id}, ` +
          `state "${response.lesson_metadata.state_name}".`,
        `4. Learner answer at report time: ${response.lesson_metadata.learner_current_answer}`
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
    if (!response.screenshot_filename) {
      return 'No screenshot was attached to this report.';
    }
    return [
      'A screenshot was attached to the original feedback report.',
      '',
      'GitHub cannot load Oppia preview URLs directly. Review the screenshot ' +
        'from the feedback dashboard before submitting this issue.',
      '',
      `Screenshot filename: ${response.screenshot_filename}`,
      `Screenshot entity ID: ${
        response.screenshot_entity_id || 'Not provided'
      }`,
      `Screenshot URL: ${this.screenshotDataUrl}`,
    ].join('\n');
  }

  private getGithubIssueAdditionalContext(): string {
    const response = this.feedbackDetailResponse;

    return [
      '## Feedback metadata',
      '',
      `Report ID: ${response.id}`,
      `Screenshot entity ID: ${response.screenshot_entity_id || 'Not provided'}`,
      `Session logs included: ${this.sessionInfo ? 'Yes' : 'No'}`,
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
      this.feedbackDetailResponse?.session_info?.environment?.user_agent;
    return userAgent || 'Not provided';
  }

  private getGithubIssueSessionLogJson(): string {
    const sessionInfo = this.feedbackDetailResponse?.session_info;
    if (!sessionInfo) {
      return 'No session logs were attached to this report.';
    }

    return JSON.stringify(sessionInfo, null, 2) ?? 'Unable to serialize logs.';
  }

  // TODO[#24716]: Stub right now, will be done in the creator feedback tab and
  // My suggestions tab's PR.
  onReplySend(): void {
    return;
  }
}
