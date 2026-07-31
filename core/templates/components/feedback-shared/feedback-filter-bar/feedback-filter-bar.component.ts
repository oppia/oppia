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
 * @fileoverview Filter bar with Apply/Clear pattern. Emits
 * filter state on Apply only (not on every keystroke).
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {
  FeedbackStatus,
  TechnicalTeamType,
  FEEDBACK_STATUS_LABELS,
  TECHNICAL_TEAM_LABELS,
} from 'domain/feedback/feedback.model';
import type {
  FeedbackFilterConfig,
  FeedbackFilterState,
} from 'domain/feedback/feedback.model';
import './feedback-filter-bar.component.css';

@Component({
  selector: 'oppia-feedback-filter-bar',
  templateUrl: './feedback-filter-bar.component.html',
  styleUrls: ['./feedback-filter-bar.component.css'],
})
export class FeedbackFilterBarComponent {
  @Input() config!: FeedbackFilterConfig;
  @Output() filterChange = new EventEmitter<FeedbackFilterState>();

  readonly statusLabels = FEEDBACK_STATUS_LABELS;
  readonly teamLabels = TECHNICAL_TEAM_LABELS;
  readonly statusOptions = Object.values(FeedbackStatus);
  readonly teamOptions = Object.values(TechnicalTeamType);

  today: string = new Date().toISOString().split('T')[0];
  selectedStatus: FeedbackStatus = FeedbackStatus.OPEN;
  searchText: string = '';
  fromDate: string = '';
  toDate: string = '';
  selectedTechnicalTeam: TechnicalTeamType = TechnicalTeamType.TECH_EXTERNAL;

  applyFilters(): void {
    const dateRange = {
      start: this.fromDate ? new Date(this.fromDate) : null,
      end: this.toDate ? new Date(this.toDate) : null,
    };
    this.filterChange.emit({
      searchText: this.searchText,
      status: this.selectedStatus,
      technicalTeam: this.selectedTechnicalTeam,
      dateRange,
    });
  }

  clearAllFilters(): void {
    this.selectedStatus = FeedbackStatus.OPEN;
    this.searchText = '';
    this.fromDate = '';
    this.toDate = '';
    this.selectedTechnicalTeam = TechnicalTeamType.TECH_EXTERNAL;
    this.applyFilters();
  }
}
