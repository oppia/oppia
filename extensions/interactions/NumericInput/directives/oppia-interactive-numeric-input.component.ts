// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the NumericInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import isUndefined from 'lodash/isUndefined';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {NumericInputCustomizationArgs} from 'interactions/customization-args-defs';
import {NumericInputRulesService} from './numeric-input-rules.service';
import {NumericInputValidationService} from './numeric-input-validation.service';
import {NumericInputAnswer} from 'interactions/answer-defs';

interface NumericInputFormSchema {
  type: string;
  ui_config: {};
}

@Component({
  selector: 'oppia-interactive-numeric-input',
  templateUrl: './numeric-input-interaction.component.html',
})
export class InteractiveNumericInput implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() requireNonnegativeInputWithValue: string = '';
  @Input() savedSolution!: NumericInputAnswer;
  @Input() labelForFocusTarget!: string;
  // Answer is empty string if the user has not yet entered an answer. This is
  // the case when the user has not yet clicked the submit button.
  answer!: number | string;
  NUMERIC_INPUT_FORM_SCHEMA!: NumericInputFormSchema;
  errorMessageI18nKey: string = '';
  requireNonnegativeInput: boolean = false;
  constructor(
    private currentInteractionService: CurrentInteractionService,
    private numericInputRulesService: NumericInputRulesService,
    private numericInputValidationService: NumericInputValidationService,
    private changeDetectorRef: ChangeDetectorRef,
    private interactionAttributesExtractorService: InteractionAttributesExtractorService
  ) {}

  private isAnswerValid(): boolean {
    if (typeof this.answer === 'string') {
      return false;
    }
    return (
      this.answer !== undefined &&
      this.answer !== null &&
      isUndefined(
        this.numericInputValidationService.validateNumber(
          this.answer,
          this.requireNonnegativeInput
        )
      )
    );
  }

  submitAnswer(answer: number | string): void {
    if (
      typeof answer !== 'number' &&
      this.currentInteractionService.showNoResponseError()
    ) {
      this.errorMessageI18nKey = 'I18N_INTERACTIONS_NUMERIC_INPUT_NO_RESPONSE';
      return;
    }

    if (this.isAnswerValid()) {
      this.currentInteractionService.onSubmit(
        answer,
        this.numericInputRulesService
      );
    }
  }

  private getAttributesObject() {
    return {
      requireNonnegativeInputWithValue: this.requireNonnegativeInputWithValue,
    };
  }

  onAnswerChange(answer: number | string): void {
    if (this.answer === answer) {
      return;
    }
    this.answer = answer;
    this.errorMessageI18nKey = '';
    this.currentInteractionService.updateCurrentAnswer(this.answer);
    this.changeDetectorRef.detectChanges();
  }

  getSchema(): NumericInputFormSchema {
    return this.NUMERIC_INPUT_FORM_SCHEMA;
  }

  getLabelForFocusTarget(): string {
    return this.labelForFocusTarget;
  }

  ngOnInit(): void {
    const {requireNonnegativeInput} =
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'NumericInput',
        this.getAttributesObject()
      ) as NumericInputCustomizationArgs;
    this.requireNonnegativeInput = requireNonnegativeInput.value;
    this.answer = this.savedSolution !== undefined ? this.savedSolution : '';

    this.NUMERIC_INPUT_FORM_SCHEMA = {
      type: 'float',
      ui_config: {
        checkRequireNonnegativeInput: this.requireNonnegativeInput,
      },
    };

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(this.answer),
      () => this.isAnswerValid()
    );
  }
}
