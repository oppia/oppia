// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator for NumberLineInput customization and rules.
 */

import {Injectable} from '@angular/core';
import {AppConstants} from 'app.constants';
import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {Outcome} from 'domain/exploration/outcome.model';
import {
  BaseInteractionValidationService,
  Warning,
} from 'interactions/base-interaction-validation.service';
import {NumberLineInputCustomizationArgs} from 'interactions/customization-args-defs';
import {getNumberLinePoints} from './number-line-input-utils';

@Injectable({providedIn: 'root'})
export class NumberLineInputValidationService {
  constructor(
    private baseInteractionValidationService: BaseInteractionValidationService
  ) {}

  getCustomizationArgsWarnings(
    customizationArgs: NumberLineInputCustomizationArgs
  ): Warning[] {
    this.baseInteractionValidationService.requireCustomizationArguments(
      customizationArgs,
      ['startValue', 'endValue', 'interval']
    );
    const {startValue, endValue, interval} = customizationArgs;
    if (
      getNumberLinePoints(startValue.value, endValue.value, interval.value)
        .length === 0
    ) {
      return [
        {
          type: AppConstants.WARNING_TYPES.CRITICAL,
          message:
            'The number line must have 3 to 10 equally spaced points, ' +
            'including its integer start and end values.',
        },
      ];
    }
    return [];
  }

  getAllWarnings(
    stateName: string,
    customizationArgs: NumberLineInputCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome | null
  ): Warning[] {
    const warnings = this.getCustomizationArgsWarnings(customizationArgs);
    const {startValue, endValue, interval} = customizationArgs;
    const points = getNumberLinePoints(
      startValue.value,
      endValue.value,
      interval.value
    );

    answerGroups.forEach((group, groupIndex) => {
      group.rules.forEach((rule, ruleIndex) => {
        if (
          rule.type === 'Equals' &&
          !points.includes(rule.inputs.x as number)
        ) {
          warnings.push({
            type: AppConstants.WARNING_TYPES.CRITICAL,
            message:
              `Learner answer ${ruleIndex + 1} in Oppia response ` +
              `${groupIndex + 1} refers to a point outside the number line.`,
          });
        }
      });
    });

    return warnings.concat(
      this.baseInteractionValidationService.getAllOutcomeWarnings(
        answerGroups,
        defaultOutcome,
        stateName
      )
    );
  }
}
