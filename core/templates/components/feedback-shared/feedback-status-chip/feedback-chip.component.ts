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
 * @fileoverview Status chip component used across all feedback
 * dashboard views. Displays feedback status with color coding.
 */

import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {
  FeedbackStatus,
  FEEDBACK_STATUS_LABELS,
  ReportAnIssueCategory,
  CATEGORY_LABELS,
} from '../../../domain/feedback/feedback.model';
import './feedback-chip.component.css';

@Component({
  selector: 'oppia-feedback-chip',
  templateUrl: './feedback-chip.component.html',
  styleUrls: ['./feedback-chip.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackChipComponent {
  @Input() value!: FeedbackStatus | ReportAnIssueCategory | null;
  @Input() type!: 'status' | 'category';
  readonly statusLabels = FEEDBACK_STATUS_LABELS;
  readonly categoryLabels = CATEGORY_LABELS;

  get label(): string {
    if (this.value === null) {
      return '—';
    }

    return this.type === 'status'
      ? this.statusLabels[this.value as FeedbackStatus]
      : this.categoryLabels[this.value as ReportAnIssueCategory];
  }

  get cssClass(): string {
    return `oppia-feedback-chip-${this.value ?? 'none'}`;
  }
}
