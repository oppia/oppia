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
 * @fileoverview Rules service for the interaction.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { RatioInputAnswer } from 'interactions/answer-defs';
import {
  RatioInputEqualRulesInputs
} from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class RatioInputRulesService {
  constructor(private nws: NormalizeWhitespacePipe) {}
  Equals(answer: RatioInputAnswer, inputs: RatioInputEqualRulesInputs):
  boolean {
    var normalizedAnswer = this.nws.transform(answer);
    var normalizedInput = this.nws.transform(inputs.x);
    return normalizedAnswer === normalizedInput;
  }
}

angular.module('oppia').factory(
  'RatioInputRulesService', downgradeInjectable(RatioInputRulesService));
