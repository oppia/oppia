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
 * @fileoverview Directive for the "frequency table" visualization.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import './oppia-visualization-frequency-table.directive.css';

@Component({
  selector: 'oppia-visualization-frequency-table',
  templateUrl: './oppia-visualization-frequency-table.directive.html'
})
export class OppiaVisualizationFrequencyTableComponent {
  @Input() data: {
    answer: string;
    frequency: string;
    isAddressed: boolean;
  } [] = [];

  @Input() options: {
    title: string;
    column_headers: string[];
  } | null = null;

  @Input() addressedInfoIsSupported: boolean = false;

  constructor() {}
}

angular.module('oppia').directive('oppiaVisualizationFrequencyTable',
   downgradeComponent({
     component: OppiaVisualizationFrequencyTableComponent
   }) as angular.IDirectiveFactory);
