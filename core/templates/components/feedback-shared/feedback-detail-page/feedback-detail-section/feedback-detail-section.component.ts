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
 * @fileoverview Reusable section shell for feedback detail pages.
 */

import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import './feedback-detail-section.component.css';

@Component({
  selector: 'oppia-feedback-detail-section',
  templateUrl: './feedback-detail-section.component.html',
  styleUrls: ['./feedback-detail-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDetailSectionComponent {
  @Input() heading!: string;
  @Input() iconClass: string = 'fas fa-circle';
  @Input() isCollapsible: boolean = false;

  isCollapsed: boolean = false;

  toggleCollapse(): void {
    if (this.isCollapsible) {
      this.isCollapsed = !this.isCollapsed;
    }
  }
}
