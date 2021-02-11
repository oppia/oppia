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

import { SetInputAnswer } from 'interactions/answer-defs';
import { SetInputRuleInputs } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class SetInputRulesService {
  Equals(answer: SetInputAnswer, inputs: SetInputRuleInputs): boolean {
    return (
      answer.length === inputs.x.unicodeStrSet.length &&
      inputs.x.unicodeStrSet.every(function(val) {
        return answer.indexOf(val) >= 0;
      })
    );
  }

  IsSubsetOf(answer: SetInputAnswer, inputs: SetInputRuleInputs): boolean {
    return (
      answer.length < inputs.x.unicodeStrSet.length &&
      answer.every(function(val) {
        return inputs.x.unicodeStrSet.indexOf(val) >= 0;
      })
    );
  }

  IsSupersetOf(answer: SetInputAnswer, inputs: SetInputRuleInputs): boolean {
    return (
      answer.length > inputs.x.unicodeStrSet.length &&
      inputs.x.unicodeStrSet.every(function(val) {
        return answer.indexOf(val) >= 0;
      })
    );
  }

  HasElementsIn(answer: SetInputAnswer, inputs: SetInputRuleInputs): boolean {
    return inputs.x.unicodeStrSet.some(function(val) {
      return answer.indexOf(val) >= 0;
    });
  }

  HasElementsNotIn(
      answer: SetInputAnswer, inputs: SetInputRuleInputs): boolean {
    return answer.some(function(val) {
      return inputs.x.unicodeStrSet.indexOf(val) === -1;
    });
  }

  OmitsElementsIn(
      answer: SetInputAnswer, inputs: SetInputRuleInputs): boolean {
    return inputs.x.unicodeStrSet.some(function(val) {
      return answer.indexOf(val) === -1;
    });
  }

  IsDisjointFrom(
      answer: SetInputAnswer, inputs: SetInputRuleInputs): boolean {
    return inputs.x.unicodeStrSet.every(function(val) {
      return answer.indexOf(val) === -1;
    });
  }
}

angular.module('oppia').factory(
  'SetInputRulesService',
  downgradeInjectable(SetInputRulesService));
