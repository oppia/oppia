// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the TextInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the component is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TextInputAnswer } from 'interactions/answer-defs';
import { TextInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { TextInputRulesService } from './text-input-rules.service';

interface TextInputSchema {
  type: string;
  'ui_config': {
    placeholder: string;
    rows: number;
    catchMisspellings: boolean;
  };
}

@Component({
  selector: 'oppia-interactive-text-input',
  templateUrl: './text-input-interaction.component.html'
})
export class InteractiveTextInputComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() placeholderWithValue!: string;
  @Input() rowsWithValue!: string;
  @Input() catchMisspellingsWithValue!: string;
  @Input() savedSolution!: TextInputAnswer;
  @Input() labelForFocusTarget!: string;
  answer!: TextInputAnswer;
  errorMessageI18nKey: string = '';
  placeholder!: string;
  schema!: TextInputSchema;
  rows!: number;
  catchMisspellings: boolean = false;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private textInputRulesService: TextInputRulesService
  ) { }

  private _getAttrs() {
    return {
      placeholderWithValue: this.placeholderWithValue,
      rowsWithValue: this.rowsWithValue,
      catchMisspellingsWithValue: this.catchMisspellingsWithValue
    };
  }

  private validityCheckFn() {
    return true;
  }

  ngOnInit(): void {
    const {
      placeholder,
      rows,
      catchMisspellings
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'TextInput', this._getAttrs()
    ) as TextInputCustomizationArgs;
    this.placeholder = placeholder.value.unicode;
    this.rows = rows.value;
    this.catchMisspellings = catchMisspellings.value;
    this.answer = (
      this.savedSolution !== undefined ?
      this.savedSolution : ''
    );

    this.schema = {
      type: 'unicode',
      ui_config: {
        placeholder: 'Placeholder text',
        rows: 1,
        catchMisspellings: false
      }
    };
    if (this.placeholder) {
      this.schema.ui_config.placeholder = this.placeholder;
    }
    if (this.rows && this.rows !== 1) {
      this.schema.ui_config.rows = this.rows;
    }
    if (this.catchMisspellings) {
      this.schema.ui_config.catchMisspellings = this.catchMisspellings;
    }
    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(this.answer), () => this.validityCheckFn());
  }

  getSchema(): TextInputSchema {
    return this.schema;
  }

  getLabelForFocusTarget(): string {
    return this.labelForFocusTarget;
  }

  submitAnswer(answer: string): void {
    if (!answer) {
      if (this.currentInteractionService.showNoResponseError()) {
        this.errorMessageI18nKey = 'I18N_INTERACTIONS_INPUT_NO_RESPONSE';
      }
      return;
    }
    this.currentInteractionService.onSubmit(
      answer, this.textInputRulesService);
  }

  updateAnswer(answer: string): void {
    if (this.answer === answer) {
      return;
    }
    this.answer = answer;
    this.currentInteractionService.updateCurrentAnswer(this.answer);
    this.errorMessageI18nKey = '';
    this.changeDetectorRef.detectChanges();
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveTextInput',
  downgradeComponent({
    component: InteractiveTextInputComponent
  })
);
