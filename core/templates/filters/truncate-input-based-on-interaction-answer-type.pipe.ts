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

type CodeAnswer = {
  code: string;
};

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
    const interactionSpec =
      INTERACTION_SPECS[
        interactionId as keyof typeof INTERACTION_SPECS
      ];

    if (!interactionSpec) {
      throw new Error(`Unknown interaction id: ${interactionId}`);
    }

    const answerType = interactionSpec.answer_type;
    let actualInputToTruncate = '';

    if (
      answerType === 'NormalizedString' ||
      answerType === 'CodeEvaluation'
    ) {
      if (
        typeof input === 'object' &&
        input !== null &&
        'code' in input
      ) {
        actualInputToTruncate = (input as CodeAnswer).code;
      } else if (typeof input === 'string') {
        actualInputToTruncate = input;
      } else {
        throw new Error('Invalid input for code-based interaction');
      }
    } else {
      throw new Error('Unknown interaction answer type');
    }

    return this.truncatePipe.transform(actualInputToTruncate, length);
  }
}
