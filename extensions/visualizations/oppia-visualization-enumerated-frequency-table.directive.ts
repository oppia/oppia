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
 * @fileoverview Directive for "enumerated frequency table" visualization.
 */

import {Component, Input, OnInit} from '@angular/core';
import {AnswerStats} from 'domain/exploration/answer-stats.model';

import './oppia-visualization-enumerated-frequency-table.directive.css';

@Component({
  selector: 'oppia-visualization-enumerated-frequency-table',
  templateUrl:
    './oppia-visualization-enumerated-frequency-table.directive.html',
})
export class OppiaVisualizationEnumeratedFrequencyTableComponent
  implements OnInit
{
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() data!: AnswerStats[];
  @Input() addressedInfoIsSupported!: string[];
  @Input() options!: {
    title: string;
    column_headers: string;
  };

  answerVisible!: boolean[];

  constructor() {}

  toggleAnswerVisibility(i: number): void {
    this.answerVisible[i] = !this.answerVisible[i];
  }

  ngOnInit(): void {
    // By default only the first element is shown, the rest are hidden.
    this.answerVisible = this.data.map((_, i) => i === 0);
  }
}
