// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the FractionInput interaction.
 */

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Fraction } from 'domain/objects/fraction.model';
import { ObjectsDomainConstants } from 'domain/objects/objects-domain.constants';
import { FractionInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';

import { FractionInputRulesService } from './fraction-input-rules.service';
import { downgradeComponent } from '@angular/upgrade/static';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { FractionAnswer, InteractionAnswer } from 'interactions/answer-defs';

@Component({
  selector: 'oppia-interactive-fraction-input',
  templateUrl: './fraction-input-interaction.component.html',
  styleUrls: []
})
export class InteractiveFractionInputComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() requireSimplestFormWithValue!: string;
  @Input() allowImproperFractionWithValue!: string;
  @Input() allowNonzeroIntegerPartWithValue!: string;
  @Input() customPlaceholderWithValue!: string;
  @Input() labelForFocusTarget!: string;
  @Input() savedSolution!: InteractionAnswer;
  componentSubscriptions: Subscription = new Subscription();
  requireSimplestForm: boolean = false;
  allowImproperFraction: boolean = true;
  allowNonzeroIntegerPart: boolean = true;
  customPlaceholder: string = '';
  FORM_ERROR_TYPE: string = 'FRACTION_FORMAT_ERROR';
  errorMessageI18nKey: string = '';
  answer: string = '';
  isValid: boolean = true;
  answerChanged: Subject<string> = new Subject<string>();
  FRACTION_INPUT_FORM_SCHEMA = {
    type: 'unicode',
    ui_config: {}
  };

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private fractionInputRulesService: FractionInputRulesService,
    private focusManagerService: FocusManagerService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService
  ) {
    /**
     * Disables the input box if the data entered is not a valid prefix
     * for a fraction.
     * Examples of valid prefixes:
     * -- 1
     * -- 1 2
     * -- 1 2/
     * -- 2/
     * -- 1 2/3
     */
    this.componentSubscriptions.add(this.answerChanged.pipe(
      // Wait 150ms after the last event before emitting last event.
      debounceTime(150),
      // Only emit if value is different from previous value.
      distinctUntilChanged()
    ).subscribe(newValue => {
      const INVALID_CHARS_REGEX = /[^\d\s\/-]/g;
      const INVALID_CHARS_LENGTH_REGEX = /\d{8,}/;
      // Accepts incomplete fraction inputs
      // (see examples above except last).
      const PARTIAL_FRACTION_REGEX =
        /^\s*(-?\s*((\d*\s*\d+\s*\/?\s*)|\d+)\s*)?$/;
      // Accepts complete fraction inputs.
      const FRACTION_REGEX =
        /^\s*-?\s*((\d*\s*\d+\s*\/\s*\d+)|\d+)\s*$/;
      if (INVALID_CHARS_LENGTH_REGEX.test(newValue)) {
        this.errorMessageI18nKey = (
          ObjectsDomainConstants.
            FRACTION_PARSING_ERROR_I18N_KEYS.INVALID_CHARS_LENGTH);
        this.isValid = false;
      } else if (INVALID_CHARS_REGEX.test(newValue)) {
        this.errorMessageI18nKey = (
          ObjectsDomainConstants.
            FRACTION_PARSING_ERROR_I18N_KEYS.INVALID_CHARS);
        this.isValid = false;
      } else if (!(FRACTION_REGEX.test(newValue) ||
          PARTIAL_FRACTION_REGEX.test(newValue))) {
        this.errorMessageI18nKey = (
          ObjectsDomainConstants.
            FRACTION_PARSING_ERROR_I18N_KEYS.INVALID_FORMAT);
        this.isValid = false;
      } else {
        this.errorMessageI18nKey = '';
        this.isValid = true;
      }
      this.currentInteractionService.updateViewWithNewAnswer();
    }));
  }

  ngOnInit(): void {
    const {
      requireSimplestForm,
      allowImproperFraction,
      allowNonzeroIntegerPart,
      customPlaceholder
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'FractionInput',
      this.getAttributesObject()
    ) as FractionInputCustomizationArgs;
    this.requireSimplestForm = requireSimplestForm.value;
    this.allowImproperFraction = allowImproperFraction.value;
    this.allowNonzeroIntegerPart = allowNonzeroIntegerPart.value;
    this.customPlaceholder = customPlaceholder.value.unicode;
    if (this.savedSolution !== undefined) {
      let savedSolution = this.savedSolution;
      savedSolution = Fraction.fromDict(
        savedSolution as FractionAnswer).toString();
      this.answer = savedSolution;
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

  private getAttributesObject() {
    return {
      requireSimplestFormWithValue: this.requireSimplestFormWithValue,
      allowImproperFractionWithValue: this.allowImproperFractionWithValue,
      allowNonzeroIntegerPartWithValue: this.allowNonzeroIntegerPartWithValue,
      customPlaceholderWithValue: this.customPlaceholderWithValue
    };
  }

  submitAnswer(): void {
    const answer: string = this.answer;
    try {
      const fraction = Fraction.fromRawInputString(answer);
      // To check if the input fraction is in simplest form, the string
      // representation of the input fraction and the simplified fraction is
      // compared. Just comparing 'fraction' and
      // 'fraction.convertToSimplestForm()' will not work, since both are
      // objects that cannot be compared directly.
      if (this.requireSimplestForm &&
        !(fraction.toString() === fraction.convertToSimplestForm().toString())
      ) {
        this.errorMessageI18nKey = 'I18N_INTERACTIONS_FRACTIONS_SIMPLEST_FORM';
        this.isValid = false;
      } else if (
        !this.allowImproperFraction && fraction.isImproperFraction()) {
        this.errorMessageI18nKey = (
          'I18N_INTERACTIONS_FRACTIONS_PROPER_FRACTION');
        this.isValid = false;
      } else if (
        !this.allowNonzeroIntegerPart &&
          fraction.hasNonzeroIntegerPart()) {
        this.errorMessageI18nKey = (
          'I18N_INTERACTIONS_FRACTIONS_NON_MIXED');
        this.isValid = false;
      } else {
        this.currentInteractionService.onSubmit(
          fraction, this.fractionInputRulesService);
      }
    } catch (parsingError) {
      if (parsingError instanceof Error) {
        this.errorMessageI18nKey = parsingError.message;
      } else {
        throw parsingError;
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

  getPlaceholderText(): string {
    if (this.allowNonzeroIntegerPart) {
      return 'I18N_INTERACTIONS_FRACTIONS_INPUT_PLACEHOLDER';
    }
    return 'I18N_INTERACTIONS_FRACTIONS_INPUT_PLACEHOLDER_NO_INTEGER';
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveFractionInput', downgradeComponent({
    component: InteractiveFractionInputComponent
  }) as angular.IDirectiveFactory);
