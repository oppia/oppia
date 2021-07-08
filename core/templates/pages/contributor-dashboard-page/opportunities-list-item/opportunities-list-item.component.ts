// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the item view of an opportunity.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

export interface ExplorationOpportunity {
  id: string;
  labelText: string;
  labelColor: string;
  progressPercentage: number;
}

@Component({
  selector: 'oppia-opportunities-list-item',
  templateUrl: './opportunities-list-item.component.html',
  styleUrls: []
})
export class OpportunitiesListItemComponent {
  @Input() opportunity: ExplorationOpportunity;
  @Output() clickActionButton: EventEmitter<string> = (
    new EventEmitter());
  @Input() labelRequired: boolean;
  @Input() progressBarRequired: boolean;
  @Input() opportunityHeadingTruncationLength: number;

  opportunityDataIsLoading: boolean = true;
  labelText: string;
  labelStyle: { 'background-color': string; };
  progressPercentage: string;
  progressBarStyle: { width: string; };

  ngOnInit(): void {
    if (this.opportunity && this.labelRequired) {
      this.labelText = this.opportunity.labelText;
      this.labelStyle = {
        'background-color': this.opportunity.labelColor
      };
    }

    if (!this.opportunityHeadingTruncationLength) {
      this.opportunityHeadingTruncationLength = 40;
    }
    if (this.opportunity) {
      if (this.opportunity.progressPercentage) {
        this.progressPercentage = (
          this.opportunity.progressPercentage + '%');
        this.progressBarStyle = {width: this.progressPercentage};
      }
      this.opportunityDataIsLoading = false;
    } else {
      this.opportunityDataIsLoading = true;
    }
  }
}

angular.module('oppia').directive(
  'oppiaOpportunitiesListItem', downgradeComponent(
    {component: OpportunitiesListItemComponent}));
