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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { MultipleChoiceAnswer } from 'interactions/answer-defs';
import { MultipleChoiceRuleInputs } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class MultipleChoiceInputRulesService {
  Equals(
      answer: MultipleChoiceAnswer,
      inputs: MultipleChoiceRuleInputs): boolean {
    return answer === inputs.x;
  }
}

angular.module('oppia').factory(
  'MultipleChoiceInputRulesService',
  downgradeInjectable(MultipleChoiceInputRulesService));
