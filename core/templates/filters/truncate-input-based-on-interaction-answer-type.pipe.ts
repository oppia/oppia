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
 * @fileoverview TruncateInputBasedOnInteractionAnswerType Pipe for Oppia.
 */

import {Pipe, PipeTransform} from '@angular/core';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';
import {InteractionAnswer} from 'interactions/answer-defs';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';

// Minimal interface for inputs that carry a truncatable code string.
interface TruncatableInput {
  code: string;
}

@Pipe({
  name: 'truncateInputBasedOnInteractionAnswerTypePipe',
})
export class TruncateInputBasedOnInteractionAnswerTypePipe
  implements PipeTransform
{
  constructor(private truncatePipe: TruncatePipe) {}

  transform(
    input: InteractionAnswer,
    interactionId: string,
    length: number
  ): string {
    let answerType =
      INTERACTION_SPECS[interactionId as InteractionSpecsKey].answer_type;
    let actualInputToTruncate = '';
    let inputUpdate: TruncatableInput;

    // TODO(#15858): Update InteractionAnswer type and remove if block
    // code in truncate-input-based-on-interaction-answer-type.pipe.ts file.

    // As input variable can be of 19 types and
    // there properties are also different
    // we need to fix all InteractionAnswer properties.
    // we can do this in later stage.
    // For now i am using the if block logic to do the task.
    // by doing so we don't need to change this in whole codebase.
    if (typeof input !== 'object') {
      inputUpdate = {code: String(input)};
    } else {
      inputUpdate = input as TruncatableInput;
    }

    if (answerType === 'NormalizedString') {
      actualInputToTruncate = inputUpdate.code;
    } else if (answerType === 'CodeEvaluation') {
      actualInputToTruncate = inputUpdate.code;
    } else {
      throw new Error('Unknown interaction answer type');
    }

    return this.truncatePipe.transform(actualInputToTruncate, length);
  }
}
