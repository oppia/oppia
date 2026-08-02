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
 * @fileoverview Table component for displaying feedback items in a
 * tabular list view. Used across Technical Dashboard, Creator Feedback,
 * and My Suggestions tabs.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import {CATEGORY_LABELS, SOURCE_LABELS} from 'domain/feedback/feedback.model';
import type {
  PlatformFeedbackSummary,
  FeedbackCardConfig,
} from 'domain/feedback/feedback.model';
import './feedback-table.component.css';

@Component({
  selector: 'oppia-feedback-table',
  templateUrl: './feedback-table.component.html',
  styleUrls: ['./feedback-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackTableComponent {
  @Input() feedbackSummaries: PlatformFeedbackSummary[] = [];
  @Input() currentPage = 1;
  @Input() feedbackCardConfig!: FeedbackCardConfig;
  @Input() moreFeedbackAvailable = false;
  @Output() rowClick = new EventEmitter<string>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() previousPage = new EventEmitter<void>();

  getCategoryLabel(category: string | null): string {
    if (!category) {
      return '----';
    }
    return CATEGORY_LABELS[category];
  }

  getSourceLabel(source: string): string {
    return SOURCE_LABELS[source];
  }
}
