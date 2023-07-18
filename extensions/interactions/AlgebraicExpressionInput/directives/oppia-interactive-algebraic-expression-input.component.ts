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
 * @fileoverview Component for the AlgebraicExpressionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { GuppyConfigurationService } from 'services/guppy-configuration.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { MathInteractionsService } from 'services/math-interactions.service';
import { AlgebraicExpressionInputRulesService } from './algebraic-expression-input-rules.service';
import { AppConstants } from 'app.constants';
import { downgradeComponent } from '@angular/upgrade/static';
import { InteractionAnswer } from 'interactions/answer-defs';
import { TranslateService } from '@ngx-translate/core';

interface FocusObj {
  focused: boolean;
}


@Component({
  selector: 'oppia-interactive-algebraic-expression-input',
  templateUrl: './algebraic-expression-input-interaction.component.html',
  styleUrls: []
})
export class AlgebraicExpressionInputInteractionComponent
    implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() savedSolution!: InteractionAnswer;
  @Input() useFractionForDivisionWithValue!: string;
  @Input() allowedVariablesWithValue: string = '';
  value: string = '';
  hasBeenTouched = false;
  viewIsDestroyed: boolean = false;
  warningText: string = '';

  constructor(
    private algebraicExpressionInputRulesService:
      AlgebraicExpressionInputRulesService,
    private currentInteractionService: CurrentInteractionService,
    private guppyConfigurationService: GuppyConfigurationService,
    private guppyInitializationService: GuppyInitializationService,
    private htmlEscaperService: HtmlEscaperService,
    private mathInteractionsService: MathInteractionsService,
    private translateService: TranslateService,
  ) {}

  isCurrentAnswerValid(checkForTouched = true): boolean {
    const activeGuppyObject = (
      this.guppyInitializationService.findActiveGuppyObject());
    if (
      (!checkForTouched || this.hasBeenTouched) &&
      activeGuppyObject === undefined) {
      // Replacing abs symbol, '|x|', with text, 'abs(x)' since the symbol
      // is not compatible with nerdamer or with the backend validations.
      this.value = this.mathInteractionsService.replaceAbsSymbolWithText(
        this.value);
      let answerIsValid = (
        this.mathInteractionsService.validateAlgebraicExpression(
          this.value, this.guppyInitializationService.getAllowedVariables()));
      this.warningText = this.mathInteractionsService.getWarningText();
      return answerIsValid;
    }
    this.warningText = '';
    return true;
  }

  submitAnswer(): void {
    this.hasBeenTouched = true;
    if (!this.isCurrentAnswerValid(false)) {
      return;
    }
    this.currentInteractionService.onSubmit(
      this.value, this.algebraicExpressionInputRulesService);
  }

  onAnswerChange(focusObj: FocusObj): void {
    const activeGuppyObject = (
      this.guppyInitializationService.findActiveGuppyObject());
    if (activeGuppyObject !== undefined) {
      this.hasBeenTouched = true;
      this.value = activeGuppyObject.guppyInstance.asciimath();
      this.currentInteractionService.updateCurrentAnswer(this.value);
    }
    if (!focusObj.focused) {
      this.isCurrentAnswerValid();
    }
  }

  ngOnInit(): void {
    this.hasBeenTouched = false;
    this.viewIsDestroyed = false;
    this.guppyConfigurationService.init();
    this.guppyConfigurationService.changeDivSymbol(
      JSON.parse(this.useFractionForDivisionWithValue || 'false'));
    this.guppyInitializationService.setAllowedVariables(
      this.htmlEscaperService.escapedJsonToObj(
        this.allowedVariablesWithValue) as string[]
    );
    let translatedPlaceholder = this.translateService.instant(
      AppConstants.MATH_INTERACTION_PLACEHOLDERS.AlgebraicExpressionInput);
    this.guppyInitializationService.init(
      'guppy-div-learner',
      translatedPlaceholder,
      this.savedSolution !== undefined ? this.savedSolution as string : ''
    );

    Guppy.event('change', this.onAnswerChange.bind(this));

    Guppy.event('done', this.submitAnswer.bind(this));

    Guppy.event('focus', (focusObj: FocusObj) => {
      if (!focusObj.focused) {
        this.isCurrentAnswerValid();
      }
    });

    this.currentInteractionService.registerCurrentInteraction(
      this.submitAnswer.bind(this), this.isCurrentAnswerValid.bind(this));
  }

  ngOnDestroy(): void {
    this.viewIsDestroyed = true;
  }

  showOsk(): void {
    this.guppyInitializationService.setShowOSK(true);
    GuppyInitializationService.interactionType = 'AlgebraicExpressionInput';
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveAlgebraicExpressionInput',
  downgradeComponent(
    {
      component: AlgebraicExpressionInputInteractionComponent
    }
  ) as angular.IDirectiveFactory);
