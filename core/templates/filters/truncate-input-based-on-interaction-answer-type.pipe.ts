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

interface InteractionSpecs {
  [interactionId: string]: {
    answer_type: string;
  };
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
    const answerType = (INTERACTION_SPECS as unknown as InteractionSpecs)[
      interactionId
    ].answer_type;
    let actualInputToTruncate = '';
    let inputUpdate: Record<string, unknown>;

    if (typeof input !== 'object' || input === null) {
      inputUpdate = {
        code: input,
      };
    } else {
      inputUpdate = input as unknown as Record<string, unknown>;
    }

    if (answerType === 'NormalizedString' || answerType === 'CodeEvaluation') {
      actualInputToTruncate = inputUpdate.code as string;
    } else {
      throw new Error(`Unknown interaction answer type: ${answerType}`);
    }

    return this.truncatePipe.transform(actualInputToTruncate, length);
  }
}
