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

import { ItemSelectionAnswer } from 'interactions/answer-defs';
import { ItemSelectionRuleInputs } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class ItemSelectionInputRulesService {
  private removeDuplicatesInArrayPipe: RemoveDuplicatesInArrayPipe = (
    new RemoveDuplicatesInArrayPipe());

  Equals(
      answer: ItemSelectionAnswer,
      inputs: ItemSelectionRuleInputs): boolean {
    const normalizedAnswer = this.removeDuplicatesInArrayPipe.transform(answer);
    const normalizedInput = this.removeDuplicatesInArrayPipe.transform(
      inputs.x);
    return normalizedAnswer.length === normalizedInput.length &&
    normalizedAnswer.every(val => normalizedInput.includes(val));
  }

  ContainsAtLeastOneOf(
      answer: ItemSelectionAnswer,
      inputs: ItemSelectionRuleInputs): boolean {
    const normalizedAnswer = this.removeDuplicatesInArrayPipe.transform(answer);
    const normalizedInput = this.removeDuplicatesInArrayPipe.transform(
      inputs.x);
    return normalizedAnswer.some(val => normalizedInput.includes(val));
  }

  DoesNotContainAtLeastOneOf(
      answer: ItemSelectionAnswer,
      inputs: ItemSelectionRuleInputs): boolean {
    const normalizedAnswer = this.removeDuplicatesInArrayPipe.transform(answer);
    const normalizedInput = this.removeDuplicatesInArrayPipe.transform(
      inputs.x);
    return normalizedInput.some(val => !normalizedAnswer.includes(val));
  }

  // This function checks if the answer
  // given by the user is a subset of the correct answers.
  IsProperSubsetOf(
      answer: ItemSelectionAnswer,
      inputs: ItemSelectionRuleInputs): boolean {
    const normalizedAnswer = this.removeDuplicatesInArrayPipe.transform(answer);
    const normalizedInput = this.removeDuplicatesInArrayPipe.transform(
      inputs.x);
    return normalizedAnswer.length < normalizedInput.length &&
    normalizedAnswer.every(val => normalizedInput.includes(val));
  }
}

angular.module('oppia').factory(
  'ItemSelectionInputRulesService',
  downgradeInjectable(ItemSelectionInputRulesService));
