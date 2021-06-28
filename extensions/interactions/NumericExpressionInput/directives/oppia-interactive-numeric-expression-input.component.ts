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
 * @fileoverview Component for the NumericExpressionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { InteractionAnswer } from 'interactions/answer-defs';
import { NumericExpressionInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService, InteractionRulesService } from 'pages/exploration-player-page/services/current-interaction.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { GuppyConfigurationService } from 'services/guppy-configuration.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';
import { MathInteractionsService } from 'services/math-interactions.service';
import { NumericExpressionInputRulesService } from './numeric-expression-input-rules.service';

@Component({
  selector: 'oppia-interactive-numeric-expression-input',
  templateUrl: './numeric-expression-input-interaction.component.html',
  styleUrls: []
})
export class InteractiveNumericExpressionInput implements OnInit {
  @Input() placeholderWithValue: string;
  @Input() savedSolution: InteractionAnswer;
  @Input() useFractionForDivisionWithValue: string;

  value: string = '';
  hasBeenTouched: boolean = false;
  warningText: string = '';

  constructor(
    private mathInteractionsService: MathInteractionsService,
    public currentInteractionService: CurrentInteractionService,
    private deviceInfoService: DeviceInfoService,
    private guppyConfigurationService: GuppyConfigurationService,
    private guppyInitializationService: GuppyInitializationService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private numericExpressionInputRulesService:
      NumericExpressionInputRulesService
  ) {}

  private _getAttributes() {
    return {
      placeholderWithValue: this.placeholderWithValue,
      useFractionForDivisionWithValue: this.useFractionForDivisionWithValue
    };
  }

  isCurrentAnswerValid(): boolean {
    let activeGuppyObject = (
      this.guppyInitializationService.findActiveGuppyObject());
    if (this.hasBeenTouched && activeGuppyObject === undefined) {
      // Replacing abs symbol, '|x|', with text, 'abs(x)' since the symbol
      // is not compatible with nerdamer or with the backend validations.
      this.value = this.mathInteractionsService.replaceAbsSymbolWithText(
        this.value);
      let answerIsValid = (
        this.mathInteractionsService.validateNumericExpression(
          this.value));
      if (answerIsValid) {
        // Explicitly inserting '*' signs wherever necessary.
        this.value = this.mathInteractionsService.insertMultiplicationSigns(
          this.value);
      }
      this.warningText = this.mathInteractionsService.getWarningText();
      return answerIsValid;
    }
    this.warningText = '';
    return true;
  }

  submitAnswer(): void {
    if (!this.isCurrentAnswerValid()) {
      return;
    }
    this.currentInteractionService.onSubmit(this.value, (
      this.numericExpressionInputRulesService
    ) as unknown as InteractionRulesService);
  }

  showOSK(): void {
    this.guppyInitializationService.setShowOSK(true);
    GuppyInitializationService.interactionType = 'NumericExpressionInput';
  }

  ngOnInit(): void {
    this.hasBeenTouched = false;
    this.guppyConfigurationService.init();
    const { useFractionForDivision, placeholder } = (
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'NumericExpressionInput', this._getAttributes()
      )) as NumericExpressionInputCustomizationArgs;

    // This represents a list of special characters in LaTeX. These
    // characters have a special meaning in LaTeX and thus need to be
    // escaped.
    const escapeCharacters = [
      '&', '%', '$', '#', '_', '{', '}', '~', '^', '\\'];
    for (let i = 0; i < placeholder.value.unicode.length; i++) {
      if (escapeCharacters.includes(placeholder.value.unicode[i])) {
        let newPlaceholder = `\\verb|${placeholder.value.unicode}|`;
        placeholder.value.unicode = newPlaceholder;
        break;
      }
    }
    this.guppyConfigurationService.changeDivSymbol(
      (useFractionForDivision as unknown as { value: boolean }).value);
    this.guppyInitializationService.init(
      'guppy-div-learner',
      placeholder.value.unicode,
      this.savedSolution !== undefined ?
      this.savedSolution as string : ''
    );
    let eventType = (
      this.deviceInfoService.isMobileUserAgent() &&
      this.deviceInfoService.hasTouchEvents()) ? 'focus' : 'change';
    // We need the 'focus' event while using the on screen keyboard (only
    // for touch-based devices) to capture input from user and the 'change'
    // event while using the normal keyboard.
    Guppy.event(eventType, () => {
      let activeGuppyObject = (
        this.guppyInitializationService.findActiveGuppyObject());
      if (activeGuppyObject !== undefined) {
        this.hasBeenTouched = true;
        this.value = activeGuppyObject.guppyInstance.asciimath();
      }
    });
    const isCurrentAnswerValid = (): boolean => {
      return this.isCurrentAnswerValid();
    };

    const submitAnswer = () => {
      return this.submitAnswer();
    };
    this.currentInteractionService.registerCurrentInteraction(
      submitAnswer, isCurrentAnswerValid);
  }
}


angular.module('oppia').directive(
  'oppiaInteractiveNumericExpressionInput', downgradeComponent(
    {component: InteractiveNumericExpressionInput}
  ) as angular.IDirectiveFactory);
