// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Shared circular badge used in module navigation and lesson rows.
 */

import {Component, Input} from '@angular/core';
import './module-circle-badge.component.css';

@Component({
  selector: 'topic-module-circle-badge',
  templateUrl: './module-circle-badge.component.html',
  styleUrls: ['./module-circle-badge.component.css'],
})
export class ModuleCircleBadgeComponent {
  @Input() label: string = '';
  @Input() iconName: string = '';
  @Input() iconImageUrl: string = '';
  @Input() backgroundColor: string = '#fff';
  @Input() borderColor: string = '#7f8c8d';
  @Input() textColor: string = '#334155';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() title: string = '';

  get circleClass(): string {
    return this.size === 'sm'
      ? 'module-circle-badge module-circle-badge--sm'
      : 'module-circle-badge';
  }

  get hasIcon(): boolean {
    return this.iconName !== '' || this.iconImageUrl !== '';
  }

  get hasIconImage(): boolean {
    return this.iconImageUrl !== '';
  }

  getAriaLabel(): string {
    return this.label || this.iconName;
  }

  getTooltipText(): string {
    return this.title || this.label || this.iconName;
  }
}
