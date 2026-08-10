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
import {WindowRef} from 'services/contextual/window-ref.service';
import './feedback-detail-page.component.css';

interface BrowserDetails {
  name: string;
  version: string;
}

@Component({
  selector: 'oppia-feedback-detail-page',
  templateUrl: './feedback-detail-page.component.html',
  styleUrls: ['./feedback-detail-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDetailPageComponent {
  constructor(
    private dateTimeFormatService: DateTimeFormatService,
    private windowRef: WindowRef
  ) {}
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
    const params = new URLSearchParams();
    params.append('template', '6_technical_feedback_report.yml');
    params.append('title', title);
    params.append('describe-the-bug', this.getGithubIssueDescription());
    params.append('page-url', response?.page_url || 'Not provided');
    params.append('steps-to-reproduce', this.getGithubIssueSteps());
    params.append('expected-behavior', this.getGithubIssueExpectedBehavior());
    params.append('screenshots-videos', this.getGithubIssueScreenshotDetails());
    params.append('device', this.getGithubIssueDevice());
    params.append('operating-system', this.getGithubIssueOperatingSystem());
    params.append('browsers', this.getGithubIssueBrowserName());
    params.append('browser-version', this.getGithubIssueBrowserVersion());
    params.append('additional-context', this.getGithubIssueAdditionalContext());

    return `https://github.com/oppia/oppia/issues/new?${params.toString()}`;
  }

  private getGithubIssueDescription(): string {
    const response = this.feedbackDetailResponse;

    return [
      response.report_message,
      '',
      'Transferred from the Oppia Technical feedback dashboard.',
      `Report ID: ${response.id}`,
      `Feedback report: ${this.getFeedbackReportUrl()}`,
      `Submitted: ${this.formatDate(response.created_on_msecs)}`,
      `Source: ${this.getSourceLabel(response.source)}`,
      `Category: ${this.getCategoryLabel(response.category)}`,
      `Platform: ${this.getPlatformLabel(response.platform)}`,
      `Dashboard: ${this.getDestinationLabel(response.destination_dashboard)}`,
    ].join('\n');
  }

  private getFeedbackReportUrl(): string {
    const response = this.feedbackDetailResponse;
    const reportPath = `/technical-feedback-dashboard/${encodeURIComponent(
      response.destination_dashboard
    )}/${encodeURIComponent(response.id)}`;

    return `${this.windowRef.nativeWindow.location.origin}${reportPath}`;
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
          `state '${response.lesson_metadata.state_name}',` +
          `version '${response.lesson_metadata.exploration_version}'.`,
        `4. Learner answer at report time: ${response.lesson_metadata.learner_current_answer}`,
        'Quick Links for the exploration reported:',
        `1. Open reported Lesson version: ${this.windowRef.nativeWindow.location.origin}${this.getReportedLessonUrl()}`,
        `2. Open the state in editor: ${this.windowRef.nativeWindow.location.origin}${this.getReportedStateEditorUrl()}`
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
      `Screenshot URL: ${this.windowRef.nativeWindow.location.origin}${this.screenshotDataUrl}`,
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
    return this.getBrowserDetailsFromUserAgent().version;
  }

  private getGithubIssueBrowserName(): string {
    return this.getBrowserDetailsFromUserAgent().name;
  }

  private getGithubIssueOperatingSystem(): string {
    const userAgent = this.getUserAgent();
    if (!userAgent) {
      return 'Other';
    }

    if (userAgent.includes('Android')) {
      return 'Android';
    }
    if (userAgent.includes('Windows')) {
      return 'Windows';
    }
    if (
      userAgent.includes('iPhone') ||
      userAgent.includes('iPad') ||
      userAgent.includes('iPod')
    ) {
      return 'IOS';
    }
    if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) {
      return 'MacOS';
    }
    if (userAgent.includes('Linux')) {
      return 'Linux';
    }

    return 'Other';
  }

  private getGithubIssueDevice(): string {
    const userAgent = this.getUserAgent();
    if (!userAgent) {
      return 'Desktop';
    }

    return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
      ? 'Mobile'
      : 'Desktop';
  }

  private getBrowserDetailsFromUserAgent(): BrowserDetails {
    const userAgent = this.getUserAgent();
    if (!userAgent) {
      return {
        name: 'Other',
        version: 'Not provided',
      };
    }

    const edgeMatch = userAgent.match(/Edg(?:A|iOS)?\/([0-9.]+)/);
    if (edgeMatch) {
      return {
        name: 'Edge',
        version: edgeMatch[1],
      };
    }

    const firefoxMatch = userAgent.match(/Firefox\/([0-9.]+)/);
    if (firefoxMatch) {
      return {
        name: 'Firefox',
        version: firefoxMatch[1],
      };
    }

    const chromeMatch = userAgent.match(/(?:Chrome|CriOS)\/([0-9.]+)/);
    if (chromeMatch) {
      return {
        name: 'Chrome',
        version: chromeMatch[1],
      };
    }

    const safariMatch = userAgent.match(/Version\/([0-9.]+).*Safari\//);
    if (safariMatch) {
      return {
        name: 'Safari',
        version: safariMatch[1],
      };
    }

    return {
      name: 'Other',
      version: 'Not provided',
    };
  }

  private getUserAgent(): string | null {
    return (
      this.feedbackDetailResponse?.session_info?.environment?.user_agent ?? null
    );
  }

  private getGithubIssueSessionLogJson(): string {
    const sessionInfo = this.feedbackDetailResponse?.session_info;
    if (!sessionInfo) {
      return 'No session logs were attached to this report.';
    }

    return JSON.stringify(sessionInfo, null, 2) ?? 'Unable to serialize logs.';
  }

  // TODO(#24716): Stub right now, will be done in the creator feedback tab and
  // My suggestions tab's PR.
  onReplySend(): void {
    return;
  }
}
