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
 * @fileoverview Component for the completion graph of the improvements tab.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ImprovementsConstants } from 'domain/improvements/improvements.constants';

@Component({
  selector: 'oppia-completion-graph',
  templateUrl: './completion-graph.component.html',
})
export class CompletionGraphComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() completionRate!: number;
  completionBarStyle!: {
    'stroke-dasharray': number;
    'stroke-dashoffset': number;
  };

  constructor() {}

  ngOnInit(): void {
    this.completionBarStyle = {
      'stroke-dasharray': ImprovementsConstants.COMPLETION_BAR_ARC_LENGTH,
      'stroke-dashoffset': (
        (1.0 - this.completionRate) *
        ImprovementsConstants.COMPLETION_BAR_ARC_LENGTH),
    };
  }
}

angular.module('oppia').directive('oppiaCompletionGraph',
  downgradeComponent({
    component: CompletionGraphComponent
  }) as angular.IDirectiveFactory);
