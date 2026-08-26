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
 * @fileoverview Shared circular badge used in adventure navigation and lesson rows.
 */

import {Component, Input} from '@angular/core';

import './adventure-circle-badge.component.css';

@Component({
  selector: 'topic-adventure-circle-badge',
  templateUrl: './adventure-circle-badge.component.html',
  styleUrls: ['./adventure-circle-badge.component.css'],
})
export class AdventureCircleBadgeComponent {
  @Input() label: string = '';
  @Input() iconName: string = '';
  @Input() backgroundColor: string = '#fff';
  @Input() borderColor: string = '#7f8c8d';
  @Input() textColor: string = '#334155';
  @Input() size: 'sm' | 'md' = 'md';

  get circleClass(): string {
    return this.size === 'sm'
      ? 'adventure-circle-badge adventure-circle-badge--sm'
      : 'adventure-circle-badge';
  }
}
