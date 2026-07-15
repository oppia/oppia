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

  readonly categoryLabels = CATEGORY_LABELS;
  readonly statusLabels = FEEDBACK_STATUS_LABELS;
  readonly sourceLabels = SOURCE_LABELS;
  readonly teamLabels = TECHNICAL_TEAM_LABELS;
  readonly statusOptions = Object.values(FeedbackStatus);

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
    console.log(this.feedbackDetailResponse.session_info);
    return this.feedbackDetailResponse?.session_info ?? null;
  }
}
