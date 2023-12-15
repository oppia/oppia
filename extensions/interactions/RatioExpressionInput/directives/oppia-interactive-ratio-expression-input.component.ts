// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the RatioExpressionInput interaction.
 */

import { Ratio } from 'domain/objects/ratio.model';

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { RatioExpressionInputRulesService } from './ratio-expression-input-rules.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';

import { RatioExpressionInputCustomizationArgs } from 'interactions/customization-args-defs';
import { RatioInputAnswer, InteractionAnswer } from 'interactions/answer-defs';

@Component({
  selector: 'oppia-interactive-ratio-expression-input',
  templateUrl: './ratio-expression-input-interaction.component.html',
  styleUrls: []
})
export class InteractiveRatioExpressionInputComponent
  implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() placeholderWithValue!: string;
  @Input() numberOfTermsWithValue!: string;
  @Input() labelForFocusTarget!: string;
  @Input() savedSolution!: InteractionAnswer;
  expectedNumberOfTerms!: number;
  placeholder!: string;
  componentSubscriptions: Subscription = new Subscription();
  FORM_ERROR_TYPE: string = 'RATIO_EXPRESSION_INPUT_FORMAT_ERROR';
  errorMessageI18nKey: string = '';
  answer: string = '';
  isValid: boolean = true;
  answerChanged: Subject<string> = new Subject<string>();
  RATIO_EXPRESSION_INPUT_FORM_SCHEMA = {
    type: 'unicode',
    ui_config: {}
  };

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private focusManagerService: FocusManagerService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private ratioExpressionInputRulesService: RatioExpressionInputRulesService,
  ) {
    this.componentSubscriptions.add(this.answerChanged.pipe(
      // Wait 150ms after the last event before emitting last event.
      debounceTime(150),
      // Only emit if value is different from previous value.
      distinctUntilChanged()
    ).subscribe(newValue => {
      this.errorMessageI18nKey = '';
      this.isValid = true;
      this.currentInteractionService.updateViewWithNewAnswer();
    }));
  }

  ngOnInit(): void {
    const {
      placeholder,
      numberOfTerms
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'RatioExpressionInput',
      {
        placeholderWithValue: this.placeholderWithValue,
        numberOfTermsWithValue: this.numberOfTermsWithValue
      }
    ) as RatioExpressionInputCustomizationArgs;
    this.expectedNumberOfTerms = numberOfTerms.value;
    this.placeholder = placeholder.value.unicode;
    if (this.savedSolution !== undefined) {
      let savedSolution = this.savedSolution;
      savedSolution = Ratio.fromList(
        savedSolution as RatioInputAnswer).toAnswerString();
      this.answer = savedSolution;
    } else {
      this.answer = '';
    }
    const submitAnswerFn = () => this.submitAnswer();
    const isAnswerValid = () => this.isAnswerValid();
    this.currentInteractionService.registerCurrentInteraction(
      submitAnswerFn, isAnswerValid);

    setTimeout(
      () => {
        let focusLabel: string = this.labelForFocusTarget;
        this.focusManagerService.setFocusWithoutScroll(focusLabel);
      }, 0);
  }

  submitAnswer(): void {
    try {
      const ratioExpression = Ratio.fromRawInputString(this.answer);
      if (
        ratioExpression.getNumberOfTerms() !== this.expectedNumberOfTerms &&
        this.expectedNumberOfTerms !== 0
      ) {
        throw new Error('I18N_INTERACTIONS_TERMS_LIMIT');
      }
      this.errorMessageI18nKey = '';
      this.isValid = true;
      this.currentInteractionService.onSubmit(
        ratioExpression.getComponents(),
        this.ratioExpressionInputRulesService);
    } catch (parsingError) {
      if (parsingError instanceof Error) {
        this.errorMessageI18nKey = parsingError.message;
      }
      this.isValid = false;
    }
  }

  isAnswerValid(): boolean {
    return this.isValid && this.answer !== '';
  }

  answerValueChanged(): void {
    this.answerChanged.next(this.answer);
    this.currentInteractionService.updateCurrentAnswer(this.answer);
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveRatioExpressionInput', downgradeComponent({
    component: InteractiveRatioExpressionInputComponent
  }) as angular.IDirectiveFactory);
