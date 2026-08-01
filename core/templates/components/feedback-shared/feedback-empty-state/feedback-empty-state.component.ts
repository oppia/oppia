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
 * @fileoverview Empty state component for feedback dashboards.
 * Displays when no feedback items match the current filters.
 */

import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import './feedback-empty-state.component.css';

@Component({
  selector: 'oppia-feedback-empty-state',
  templateUrl: './feedback-empty-state.component.html',
  styleUrls: ['./feedback-empty-state.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackEmptyStateComponent {
  @Input() title: string = 'No feedback found';
  @Input() message: string =
    'There are no feedback items matching your current filters.';
  @Input() icon: string = 'feedback';
}
