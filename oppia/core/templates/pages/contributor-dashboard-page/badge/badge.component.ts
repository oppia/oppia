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
 * @fileoverview Component for the badge.
 */

import {Component, Input} from '@angular/core';
import {AppConstants} from 'app.constants';

interface ContributionSubTypeTexts {
  submission: string;
  review: string;
  correction: string;
}

@Component({
  selector: 'badge',
  templateUrl: './badge.component.html',
  styleUrls: [],
})
export class BadgeComponent {
  @Input() contributionType!: string;
  @Input() contributionSubType!: keyof ContributionSubTypeTexts;
  @Input() contributionCount!: number;
  @Input() language!: string | null;
  @Input() isUnlocked!: boolean;
  contributionSubTypeText!: string;

  fontSize: string = '13px';
  lineHeight: string = '20px';
  CONTRIBUTION_SUB_TYPE_TEXTS: ContributionSubTypeTexts = {
    [AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION]: 'Submission',
    [AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW]: 'Review',
    [AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION]: 'Correction',
  };

  constructor() {}

  ngOnInit(): void {
    this.contributionSubTypeText =
      this.CONTRIBUTION_SUB_TYPE_TEXTS[this.contributionSubType];

    if (this.contributionCount > 1) {
      this.contributionSubTypeText += 's';
    }

    if (this.language) {
      if (this.language.length >= 10) {
        this.fontSize = '10px';
      }

      if (this.language.split(' ').length > 1) {
        this.lineHeight = '90%';
      }
    }
  }
}
