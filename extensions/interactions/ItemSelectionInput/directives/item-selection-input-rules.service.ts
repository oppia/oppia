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

import { RemoveDuplicatesInArrayPipe } from
  'filters/remove-duplicates-in-array.pipe';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { IItemSelectionAnswer } from 'interactions/answer-defs';
import { IItemSelectionRuleInputs } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class ItemSelectionInputRulesService {
  private removeDuplicatesInArrayPipe: RemoveDuplicatesInArrayPipe = (
    new RemoveDuplicatesInArrayPipe());

  Equals(
      answer: IItemSelectionAnswer,
      inputs: IItemSelectionRuleInputs): boolean {
    var normalizedAnswer = this.removeDuplicatesInArrayPipe.transform(answer);
    var normalizedInput = this.removeDuplicatesInArrayPipe.transform(inputs.x);
    return normalizedAnswer.length === normalizedInput.length &&
        normalizedAnswer.every((val) => {
          return normalizedInput.indexOf(val) !== -1;
        });
  }
  ContainsAtLeastOneOf(
      answer: IItemSelectionAnswer,
      inputs: IItemSelectionRuleInputs): boolean {
    var normalizedAnswer = this.removeDuplicatesInArrayPipe.transform(answer);
    var normalizedInput = this.removeDuplicatesInArrayPipe.transform(inputs.x);
    return normalizedAnswer.some((val) => {
      return normalizedInput.indexOf(val) !== -1;
    });
  }
  // TODO(wxy): migrate the name of this rule to OmitsAtLeastOneOf, keeping
  // in sync with the backend migration of the same rule.
  DoesNotContainAtLeastOneOf(
      answer: IItemSelectionAnswer,
      inputs: IItemSelectionRuleInputs): boolean {
    var normalizedAnswer = this.removeDuplicatesInArrayPipe.transform(answer);
    var normalizedInput = this.removeDuplicatesInArrayPipe.transform(inputs.x);
    return normalizedInput.some((val) => {
      return normalizedAnswer.indexOf(val) === -1;
    });
  }
  // This function checks if the answer
  // given by the user is a subset of the correct answers.
  IsProperSubsetOf(
      answer: IItemSelectionAnswer,
      inputs: IItemSelectionRuleInputs): boolean {
    var normalizedAnswer = this.removeDuplicatesInArrayPipe.transform(answer);
    var normalizedInput = this.removeDuplicatesInArrayPipe.transform(inputs.x);
    return normalizedAnswer.length < normalizedInput.length &&
        normalizedAnswer.every((val) => {
          return normalizedInput.indexOf(val) !== -1;
        });
  }
}

angular.module('oppia').factory(
  'ItemSelectionInputRulesService',
  downgradeInjectable(ItemSelectionInputRulesService));
