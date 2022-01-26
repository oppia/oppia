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
import { TextInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { TextInputRulesService } from './text-input-rules.service';

interface TextInputSchema {
  type: string;
  'ui_config': {
    placeholder?: string;
    rows?: number;
  };
}

@Component({
  selector: 'oppia-interactive-text-input',
  templateUrl: './text-input-interaction.component.html'
})
export class InteractiveTextInputComponent implements OnInit {
  @Input() placeholderWithValue;
  @Input() rowsWithValue;
  @Input() savedSolution;
  @Input() labelForFocusTarget: string;
  answer: string;
  placeholder: string;
  schema: TextInputSchema;
  rows: number;

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
      rowsWithValue: this.rowsWithValue
    };
  }

  private validityCheckFn() {
    return this.answer.length > 0;
  }

  ngOnInit(): void {
    const {
      placeholder,
      rows
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'TextInput', this._getAttrs()
    ) as TextInputCustomizationArgs;
    this.placeholder = placeholder.value.unicode;
    this.rows = rows.value;
    this.answer = (
      this.savedSolution !== undefined ?
      this.savedSolution : ''
    );
    this.labelForFocusTarget = this.labelForFocusTarget || null;

    this.schema = {
      type: 'unicode',
      ui_config: {}
    };
    if (this.placeholder) {
      this.schema.ui_config.placeholder = this.placeholder;
    }
    if (this.rows && this.rows !== 1) {
      this.schema.ui_config.rows = this.rows;
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
      return;
    }
    this.currentInteractionService.onSubmit(
      answer,
      this.textInputRulesService);
  }

  updateAnswer(answer: string): void {
    if (this.answer === answer) {
      return;
    }
    this.answer = answer;
    this.changeDetectorRef.detectChanges();
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveTextInput',
  downgradeComponent({
    component: InteractiveTextInputComponent
  })
);
