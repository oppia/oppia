// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator service for the MathEquationInput interaction.
 */

import {Injectable} from '@angular/core';

import nerdamer from 'nerdamer';

import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {
  Warning,
  baseInteractionValidationService,
} from 'interactions/base-interaction-validation.service';
import {MathEquationInputCustomizationArgs} from 'extensions/interactions/customization-args-defs';
import {MathEquationInputRulesService} from './math-equation-input-rules.service';
import {MathInteractionsService} from 'services/math-interactions.service';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {AppConstants} from 'app.constants';
import {AlgebraicExpressionInputRulesService} from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import {NumericExpressionInputRulesService} from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';

@Injectable({
  providedIn: 'root',
})
export class MathEquationInputValidationService {
  private supportedFunctionNames = AppConstants.SUPPORTED_FUNCTION_NAMES;

  constructor(
    private baseInteractionValidationServiceInstance: baseInteractionValidationService
  ) {}

  getCustomizationArgsWarnings(
    customizationArgs: MathEquationInputCustomizationArgs
  ): Warning[] {
    let warningsList = [];

    let allowedLettersLimit = AppConstants.MAX_CUSTOM_LETTERS_FOR_OSK;
    if (customizationArgs.allowedVariables.value.length > allowedLettersLimit) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message:
          'The number of custom letters cannot be more than ' +
          allowedLettersLimit +
          '.',
      });
    }

    return warningsList;
  }

  getAllWarnings(
    stateName: string,
    customizationArgs: MathEquationInputCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome
  ): Warning[] {
    let warningsList: Warning[] = [];
    let meirs = new MathEquationInputRulesService(
      new AlgebraicExpressionInputRulesService(
        new MathInteractionsService(),
        new NumericExpressionInputRulesService()
      )
    );
    let mathInteractionsService = new MathInteractionsService();

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs)
    );

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups,
        defaultOutcome,
        stateName
      )
    );

    // This validations ensures that there are no redundant rules present in the
    // answer groups.
    // An IsEquivalentTo rule will make all of the following rules with a
    // matching input, invalid.
    // A MatchesExactlyWith rule will make the following rules of the same rule
    // type and a matching input, invalid.
    let seenRules = [];
    let seenVariables = [];

    for (let i = 0; i < answerGroups.length; i++) {
      let rules = answerGroups[i].rules;
      for (let j = 0; j < rules.length; j++) {
        let currentInput = rules[j].inputs.x as string;
        let currentPositionOfTerms = rules[j].inputs.y as string;
        let currentRuleType = rules[j].type as string;

        let splitInput = currentInput.split('=');

        // Explicitly inserting '*' signs wherever necessary.
        splitInput[0] = mathInteractionsService.insertMultiplicationSigns(
          splitInput[0]
        );
        splitInput[1] = mathInteractionsService.insertMultiplicationSigns(
          splitInput[1]
        );

        for (let variable of nerdamer(splitInput[0]).variables()) {
          if (seenVariables.indexOf(variable) === -1) {
            seenVariables.push(variable);
          }
        }

        for (let variable of nerdamer(splitInput[1]).variables()) {
          if (seenVariables.indexOf(variable) === -1) {
            seenVariables.push(variable);
          }
        }

        let unsupportedFunctions = mathInteractionsService
          .checkUnsupportedFunctions(splitInput[0])
          .concat(
            mathInteractionsService.checkUnsupportedFunctions(splitInput[1])
          );
        if (unsupportedFunctions.length > 0) {
          warningsList.push({
            type: AppConstants.WARNING_TYPES.ERROR,
            message:
              'Input for learner answer ' +
              (j + 1) +
              ' from Oppia response ' +
              (i + 1) +
              " uses these function(s) that aren't supported: " +
              '[' +
              unsupportedFunctions +
              ']' +
              ' The supported functions are: ' +
              '[' +
              this.supportedFunctionNames +
              ']',
          });
        }

        for (let seenRule of seenRules) {
          let seenInput = seenRule.inputs.x as string;
          let seenRuleType = seenRule.type as string;

          if (
            seenRuleType === 'IsEquivalentTo' &&
            meirs.IsEquivalentTo(seenInput, {x: currentInput})
          ) {
            // This rule will make all of the following matching
            // inputs obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message:
                'Learner answer ' +
                (j + 1) +
                ' from Oppia response ' +
                (i + 1) +
                ' will never be matched because it is preceded by ' +
                "an 'IsEquivalentTo' learner answer with a matching input.",
            });
          } else if (
            currentRuleType === 'MatchesExactlyWith' &&
            meirs.MatchesExactlyWith(seenInput, {
              x: currentInput,
              y: currentPositionOfTerms,
            })
          ) {
            // This rule will make the following inputs with MatchesExactlyWith
            // rule obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message:
                'Learner answer ' +
                (j + 1) +
                ' from Oppia response ' +
                (i + 1) +
                ' will never be matched because it is preceded by ' +
                "a 'MatchesExactlyWith' learner answer with " +
                'a matching input.',
            });
          }
        }
        seenRules.push(rules[j]);
      }
    }

    let greekLetters = Object.keys(AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS);
    let greekSymbols = Object.values(
      AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS
    );
    let missingVariables = [];

    for (let variable of seenVariables) {
      if (variable.length > 1) {
        variable = greekSymbols[greekLetters.indexOf(variable)];
      }
      if (customizationArgs.allowedVariables.value.indexOf(variable) === -1) {
        if (missingVariables.indexOf(variable) === -1) {
          missingVariables.push(variable);
        }
      }
    }

    if (missingVariables.length > 0) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message:
          'The following variables are present in some of the Oppia ' +
          'responses but are missing from the custom letters list: ' +
          missingVariables,
      });
    }

    return warningsList;
  }
}
