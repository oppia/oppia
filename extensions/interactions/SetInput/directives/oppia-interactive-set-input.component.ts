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

import {Component, Input, OnInit} from '@angular/core';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {SetInputRulesService} from './set-input-rules.service';
import eq from 'lodash/eq';
import {SetInputCustomizationArgs} from 'interactions/customization-args-defs';
import {Schema} from 'services/schema-default-value.service';
import {SetInputAnswer} from 'interactions/answer-defs';

@Component({
  selector: 'oppia-interactive-set-input',
  templateUrl: './set-input-interaction.component.html',
})
export class InteractiveSetInputComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() buttonTextWithValue!: string;
  @Input() savedSolution!: SetInputAnswer;
  errorMessage!: string;
  answer!: SetInputAnswer;
  schema!: {
    type: string;
    items:
      | {
          type: string;
        }
      | Schema;
    ui_config: {
      add_element_text: string;
    };
  };

  buttonText!: string;

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService: InteractionAttributesExtractorService,
    private setInputRulesService: SetInputRulesService
  ) {}

  private hasDuplicates(answer: SetInputAnswer): boolean {
    for (var i = 0; i < answer.length; i++) {
      for (var j = 0; j < i; j++) {
        if (eq(answer[i], answer[j])) {
          return true;
        }
      }
    }
    return false;
  }

  private hasBlankOption(answer: SetInputAnswer): boolean {
    return answer.some(element => {
      return element === '';
    });
  }

  updateAnswer(answer: SetInputAnswer): void {
    this.answer = answer;
    this.errorMessage = this.hasDuplicates(answer)
      ? 'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR'
      : '';
  }

  getSchema(): Schema {
    return this.schema as Schema;
  }

  ngOnInit(): void {
    const {buttonText} =
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'SetInput',
        {buttonTextWithValue: this.buttonTextWithValue}
      ) as SetInputCustomizationArgs;
    this.buttonText = buttonText.value.unicode;
    this.schema = {
      type: 'list',
      items: {
        type: 'unicode',
      },
      ui_config: {
        // TODO(mili): Translate this in the HTML.
        add_element_text: 'I18N_INTERACTIONS_SET_INPUT_ADD_ITEM',
      },
    };
    if (this.buttonText) {
      this.schema.ui_config.add_element_text = this.buttonText;
    }

    // Adds an input field by default.
    this.answer = this.savedSolution !== undefined ? this.savedSolution : [''];

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(this.answer),
      () => this.isAnswerValid()
    );
  }

  submitAnswer(answer: SetInputAnswer): void {
    if (this.hasDuplicates(answer)) {
      this.errorMessage = 'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR';
    } else {
      this.errorMessage = '';
      this.currentInteractionService.onSubmit(
        answer,
        this.setInputRulesService
      );
    }
  }

  isAnswerValid(): boolean {
    return this.answer.length > 0 && !this.hasBlankOption(this.answer);
  }
}
