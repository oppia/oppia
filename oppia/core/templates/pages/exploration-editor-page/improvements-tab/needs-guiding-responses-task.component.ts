// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the improvements tab of the exploration editor.
 */

import {Component, Input, OnInit} from '@angular/core';
import {AnswerStats} from 'domain/exploration/answer-stats.model';
import {NeedsGuidingResponsesTask} from 'domain/improvements/needs-guiding-response-task.model';
import {SupportingStateStats} from 'services/exploration-improvements-task-registry.service';
import {RouterService} from '../services/router.service';

@Component({
  selector: 'oppia-needs-guiding-responses-task',
  templateUrl: './needs-guiding-responses-task.component.html',
})
export class NeedsGuidingResponsesTaskComponent implements OnInit {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() stats!: SupportingStateStats;
  @Input() task!: NeedsGuidingResponsesTask;
  sortedTilesData!: AnswerStats[];
  sortedTilesTotalFrequency!: number;
  sortedTilesOptions!: {
    header: string;
    use_percentages: boolean;
  };

  constructor(private routerService: RouterService) {}

  navigateToStateEditor(): void {
    this.routerService.navigateToMainTab(this.task.targetId);
  }

  ngOnInit(): void {
    this.sortedTilesData = [...this.stats.answerStats];
    this.sortedTilesOptions = {header: '', use_percentages: true};
    this.sortedTilesTotalFrequency = this.stats.stateStats.totalAnswersCount;
  }
}
