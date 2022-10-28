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
 * @fileoverview Component for state stats modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { InteractionCustomizationArgs } from 'interactions/customization-args-defs';
import { RouterService } from 'pages/exploration-editor-page/services/router.service';

import './state-stats-modal.component.css';

interface PieChartOpitons {
  chartAreaWidth: number;
  colors: string[];
  height: number;
  left: number;
  legendPosition: string;
  pieHole: number;
  pieSliceBorderColor: string;
  pieSliceTextStyleColor: string;
  title: string;
  width: number;
}

@Component({
  selector: 'oppia-state-stats-modal',
  templateUrl: './state-stats-modal.component.html'
})
export class StateStatsModalComponent
   extends ConfirmOrCancelModal implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() visualizationsInfo!: {
    data: string;
    options: string;
    id: string;
    addressed_info_is_supported: boolean;
  } [];

  @Input() interactionArgs!: InteractionCustomizationArgs;
  @Input() stateName!: string;
  @Input() stateStats!: {
    usefulFeedbackCount: number;
    totalAnswersCount: number;
    numTimesSolutionViewed: number;
    totalHitCount: number;
    numCompletions: number;
  };

  solutionUsagePieChartOptions!: PieChartOpitons;
  answerFeedbackPieChartOptions!: PieChartOpitons;
  answerFeedbackPieChartData!: (string[] | [string, number])[];
  solutionUsagePieChartData!: (string[] | [string, number])[];
  totalAnswersCount!: number;
  usefulFeedbackCount!: number;
  numTimesSolutionViewed!: number;
  numEnters!: number;
  numQuits!: number;
  hasExplorationBeenAnswered!: boolean;

  constructor(
     private ngbActiveModal: NgbActiveModal,
     private routerService: RouterService,
  ) {
    super(ngbActiveModal);
  }

  navigateToStateEditor(): void {
    this.cancel();
    this.routerService.navigateToMainTab(this.stateName);
  }

  makeCompletionRatePieChartOptions(title: string): PieChartOpitons {
    return {
      left: 20,
      pieHole: 0.6,
      pieSliceTextStyleColor: 'black',
      pieSliceBorderColor: 'black',
      chartAreaWidth: 240,
      colors: ['#d8d8d8', '#008808', 'blue'],
      height: 270,
      legendPosition: 'right',
      title: title,
      width: 240
    };
  }

  ngOnInit(): void {
    this.numTimesSolutionViewed = this.stateStats.numTimesSolutionViewed;
    this.totalAnswersCount = this.stateStats.totalAnswersCount;
    this.usefulFeedbackCount = this.stateStats.usefulFeedbackCount;

    this.hasExplorationBeenAnswered = this.totalAnswersCount > 0;
    this.numEnters = this.stateStats.totalHitCount;
    this.numQuits = (
      this.stateStats.totalHitCount - this.stateStats.numCompletions);

    this.answerFeedbackPieChartOptions = (
      this.makeCompletionRatePieChartOptions('Answer feedback statistics'));
    this.solutionUsagePieChartOptions = (
      this.makeCompletionRatePieChartOptions('Solution usage statistics'));

    this.answerFeedbackPieChartData = [
      ['Type', 'Number'],
      ['Default feedback', this.totalAnswersCount - this.usefulFeedbackCount],
      ['Specific feedback', this.usefulFeedbackCount],
    ];

    this.solutionUsagePieChartData = [
      ['Type', 'Number'],
      ['Solutions used to answer', this.numTimesSolutionViewed],
      ['Solutions not used',
        this.totalAnswersCount - this.numTimesSolutionViewed]
    ];
  }
}
