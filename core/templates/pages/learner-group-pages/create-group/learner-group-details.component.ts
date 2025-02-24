// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the learner group details.
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';

import './learner-group-details.component.css';

@Component({
  selector: 'oppia-learner-group-details',
  templateUrl: './learner-group-details.component.html',
  styleUrls: ['./learner-group-details.component.css'],
})
export class LearnerGroupDetailsComponent {
  @Input() learnerGroupTitle!: string;
  @Input() learnerGroupDescription!: string;
  @Input() readOnlyMode = false;
  @Output() updateLearnerGroupTitle: EventEmitter<string> = new EventEmitter();
  @Output() updateLearnerGroupDesc: EventEmitter<string> = new EventEmitter();

  constructor() {}

  updateGroupTitle(title: string): void {
    this.learnerGroupTitle = title;
    this.updateLearnerGroupTitle.emit(this.learnerGroupTitle);
  }

  updateGroupDescription(description: string): void {
    this.learnerGroupDescription = description;
    this.updateLearnerGroupDesc.emit(this.learnerGroupDescription);
  }

  isReadOnlyModeActive(): boolean {
    return this.readOnlyMode;
  }
}
