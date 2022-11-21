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
 * @fileoverview Component for the question badge.
 */

import { Component, Input } from '@angular/core';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'question-badge',
  templateUrl: './question-badge.component.html',
  styleUrls: []
})
export class QuestionBadgeComponent {
  @Input() type!: string;
  @Input() contributionCount!: number;
  @Input() isUnlocked!: boolean;
  contributionTypeText!: string;

  constructor() {}

  ngOnInit(): void {
    if (this.type === AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION) {
      this.contributionTypeText = 'Submission';
    } else if (this.type === AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW) {
      this.contributionTypeText = 'Review';
    } else if (
      this.type === AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION
    ) {
      this.contributionTypeText = 'Correction';
    } else {
      throw new Error('Invalid contribution type.');
    }

    if (this.contributionCount > 1) {
      this.contributionTypeText += 's';
    }
  }
}
