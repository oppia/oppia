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
 * @fileoverview Component for the SetInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the component is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit } from '@angular/core';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { SetInputRulesService } from './set-input-rules.service';
import eq from 'lodash/eq';
import { InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { SetInputCustomizationArgs } from 'interactions/customization-args-defs';
import { Schema } from 'services/schema-default-value.service';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-interactive-set-input',
  templateUrl: './set-input-interaction.component.html'
})
export class InteractiveSetInputComponent implements OnInit {
  @Input() buttonTextWithValue: string;
  @Input() savedSolution;
  errorMessage: string;
  answer;
  schema: {
    type: string;
    items: {
      type: string;
    };
    'ui_config': {
      'add_element_text': string;
    };
  };
  buttonText: string;

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private setInputRulesService: SetInputRulesService
  ) { }

  private hasDuplicates(answer) {
    for (var i = 0; i < answer.length; i++) {
      for (var j = 0; j < i; j++) {
        if (eq(answer[i], answer[j])) {
          return true;
        }
      }
    }
    return false;
  }

  private hasBlankOption(answer) {
    return answer.some((element) => {
      return (element === '');
    });
  }

  updateAnswer(answer: number[]): void {
    if (this.answer === answer) {
      return;
    }
    this.answer = answer;
  }

  getSchema(): Schema {
    return this.schema as unknown as Schema;
  }

  ngOnInit(): void {
    const {
      buttonText
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'SetInput',
      {buttonTextWithValue: this.buttonTextWithValue}
    ) as SetInputCustomizationArgs;
    this.buttonText = buttonText.value.unicode;
    this.schema = {
      type: 'list',
      items: {
        type: 'unicode'
      },
      ui_config: {
        // TODO(mili): Translate this in the HTML.
        add_element_text: 'I18N_INTERACTIONS_SET_INPUT_ADD_ITEM'
      }
    };
    if (this.buttonText) {
      this.schema.ui_config.add_element_text = this.buttonText;
    }

    // Adds an input field by default.
    this.answer = (
      this.savedSolution !== undefined ?
      this.savedSolution : ['']
    );

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(this.answer), () => this.isAnswerValid());
  }

  submitAnswer(answer: unknown): void {
    if (this.hasDuplicates(answer)) {
      this.errorMessage = (
        'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR');
    } else {
      this.errorMessage = '';
      this.currentInteractionService.onSubmit(
        answer as string,
        this.setInputRulesService as unknown as InteractionRulesService);
    }
  }

  isAnswerValid(): boolean {
    return (
      this.answer.length > 0 && !this.hasBlankOption(this.answer));
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveSetInput',
  downgradeComponent({
    component: InteractiveSetInputComponent
  }));
