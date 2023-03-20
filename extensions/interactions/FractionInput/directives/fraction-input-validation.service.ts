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
 * @fileoverview Validator service for the fraction interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { FractionAnswer } from 'interactions/answer-defs';
import { Fraction } from 'domain/objects/fraction.model';
import { baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { AppConstants } from 'app.constants';
import { Warning } from 'services/alerts.service';
import { FractionInputCustomizationArgs } from
  'interactions/customization-args-defs';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { Rule } from 'domain/exploration/rule.model';

interface FractionWarning {
  type: string;
  message: string;
}

interface Range {
  answerGroupIndex: number;
  ruleIndex: number;
  lb: number | null;
  ub: number | null;
  lbi: boolean;
  ubi: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FractionInputValidationService {
  constructor(
    private bivs: baseInteractionValidationService) {}

  getNonIntegerInputWarning(i: number, j: number): FractionWarning {
    return {
      type: AppConstants.WARNING_TYPES.ERROR,
      message: (
        'Learner answer ' + (j + 1) + ' from Oppia response ' +
        (i + 1) + ' is invalid: input should be an ' +
        'integer.')
    };
  }

  getCustomizationArgsWarnings(
      customizationArgs: FractionInputCustomizationArgs): Warning[] {
    return [];
  }

  getAllWarnings(
      stateName: string, customizationArgs: FractionInputCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome
  ): (Warning | FractionWarning)[] {
    var warningsList: (Warning | FractionWarning)[] = [];
    var shouldBeInSimplestForm =
      customizationArgs.requireSimplestForm.value;
    var allowImproperFraction =
        customizationArgs.allowImproperFraction.value;
    var allowNonzeroIntegerPart =
      customizationArgs.allowNonzeroIntegerPart.value;

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    var toFloat = (fraction: FractionAnswer) => {
      return Fraction.fromDict(fraction).toFloat();
    };
    /**
     * Store an answer range for every rule, then check for redundant
     * ranges. A range is an object of the form:
     * {
     *   lb: float, lower bound
     *   ub: float, upper bound
     *   lbi: bool, is lower bound inclusive
     *   ubi: bool, is upper bound inclusive
     * }
     */
    var setLowerAndUpperBounds = (
        range: Range, lb: number, ub: number, lbi: boolean, ubi: boolean) => {
      range.lb = lb;
      range.ub = ub;
      range.lbi = lbi;
      range.ubi = ubi;
    };
    var isEnclosedBy = (ra: Range, rb: Range) => {
      if (ra.lb === null || ra.ub === null ||
        rb.lb === null || rb.ub === null) {
        return false;
      }

      // Checks if range ra is enclosed by range rb.
      var lowerBoundConditionIsSatisfied =
        (rb.lb < ra.lb) || (rb.lb === ra.lb && (!ra.lbi || rb.lbi));
      var upperBoundConditionIsSatisfied =
        (rb.ub > ra.ub) || (rb.ub === ra.ub && (!ra.ubi || rb.ubi));
      return lowerBoundConditionIsSatisfied &&
        upperBoundConditionIsSatisfied;
    };

    var shouldCheckRangeCriteria = (earlierRule: Rule, laterRule: Rule) => {
      if (
        (earlierRule.type === 'IsExactlyEqualTo' &&
        laterRule.type === 'IsExactlyEqualTo') ||
        (earlierRule.type === 'IsExactlyEqualTo' &&
        laterRule.type === 'IsEquivalentTo') ||
        (earlierRule.type === 'IsExactlyEqualTo' &&
        laterRule.type === 'IsEquivalentToAndInSimplestForm')) {
        return false;
      }
      return true;
    };

    var ranges = [];
    var matchedDenominators = [];

    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        var range = {
          answerGroupIndex: i,
          ruleIndex: j,
          lb: null,
          ub: null,
          lbi: false,
          ubi: false,
        };

        var matchedDenominator = {
          answerGroupIndex: i,
          ruleIndex: j,
          denominator: 0,
        };

        switch (rule.type) {
          case 'IsExactlyEqualTo':
            if (shouldBeInSimplestForm) {
              var fractionDict = rule.inputs.f as FractionAnswer;
              var fractionInSimplestForm = Fraction.fromDict(
                fractionDict).convertToSimplestForm();
              if (!angular.equals(fractionDict, fractionInSimplestForm)) {
                warningsList.push({
                  type: AppConstants.WARNING_TYPES.ERROR,
                  message: (
                    'Learner answer ' + (j + 1) + ' from Oppia response ' +
                    (i + 1) +
                    ' will never be matched because it is not ' +
                    'in simplest form.')
                });
              }
            }
            if (!allowImproperFraction) {
              var fraction: Fraction = Fraction.fromDict(
                rule.inputs.f as FractionAnswer);
              if (fraction.isImproperFraction()) {
                warningsList.push({
                  type: AppConstants.WARNING_TYPES.ERROR,
                  message: (
                    'Learner answer ' + (j + 1) + ' from Oppia response ' +
                    (i + 1) +
                    ' will never be matched because it is an ' +
                    'improper fraction')
                });
              }
            }
            if (!allowNonzeroIntegerPart) {
              var fraction: Fraction = Fraction.fromDict(
                rule.inputs.f as FractionAnswer);
              if (fraction.hasNonzeroIntegerPart()) {
                warningsList.push({
                  type: AppConstants.WARNING_TYPES.ERROR,
                  message: (
                    'Learner answer ' + (j + 1) + ' from Oppia response ' +
                    (i + 1) +
                    ' will never be matched because it has a ' +
                    'non zero integer part')
                });
              }
            }
            var f = toFloat.call(this, rule.inputs.f as FractionAnswer);
            setLowerAndUpperBounds(range, f, f, true, true);
            break;
          case 'IsEquivalentTo': // fall-through.
          case 'IsEquivalentToAndInSimplestForm':
            var f = toFloat.call(this, rule.inputs.f as FractionAnswer);
            setLowerAndUpperBounds(range, f, f, true, true);
            break;
          case 'IsGreaterThan':
            var f = toFloat.call(this, rule.inputs.f as FractionAnswer);
            setLowerAndUpperBounds(range, f, Infinity, false, false);
            break;
          case 'IsLessThan':
            var f = toFloat.call(this, rule.inputs.f as FractionAnswer);
            setLowerAndUpperBounds(range, -Infinity, f, false, false);
            break;
          case 'HasNumeratorEqualTo':
            if (!Number.isInteger(rule.inputs.x)) {
              warningsList.push(this.getNonIntegerInputWarning(i, j));
            }
            break;
          case 'HasIntegerPartEqualTo':
            if (!allowNonzeroIntegerPart && rule.inputs.x !== 0) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' from Oppia response ' +
                  (i + 1) +
                  ' will never be matched because integer part ' +
                  'has to be zero')
              });
            }
            if (!Number.isInteger(rule.inputs.x)) {
              warningsList.push(this.getNonIntegerInputWarning(i, j));
            }
            break;
          case 'HasDenominatorEqualTo':
            if (!Number.isInteger(rule.inputs.x)) {
              warningsList.push(this.getNonIntegerInputWarning(i, j));
            }
            if (rule.inputs.x === 0) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' from Oppia response ' +
                  (i + 1) + ' is invalid: denominator ' +
                  'should be greater than zero.')
              });
            }
            matchedDenominator.denominator = rule.inputs.x as number;
            break;
          case 'HasFractionalPartExactlyEqualTo':
            if ((rule.inputs.f as FractionAnswer).wholeNumber !== 0) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' from Oppia response ' +
                  (i + 1) +
                  ' is invalid as integer part should be zero')
              });
            }
            if ((rule.inputs.f as FractionAnswer).isNegative) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' from Oppia response ' +
                  (i + 1) +
                  ' is invalid as sign should be positive')
              });
            }
            if (!allowImproperFraction) {
              var fraction: Fraction = Fraction.fromDict(
                rule.inputs.f as FractionAnswer);
              if (fraction.isImproperFraction()) {
                warningsList.push({
                  type: AppConstants.WARNING_TYPES.ERROR,
                  message: (
                    'Learner answer ' + (j + 1) + ' from Oppia response ' +
                    (i + 1) +
                    ' is invalid as improper fractions are not allowed')
                });
              }
            }
            break;
          default:
            break;
        }
        for (var k = 0; k < ranges.length; k++) {
          if (isEnclosedBy(range, ranges[k])) {
            var earlierRule = answerGroups[ranges[k].answerGroupIndex]
              .rules[ranges[k].ruleIndex];
            if (shouldCheckRangeCriteria(earlierRule, rule)) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' from Oppia response ' +
                  (i + 1) + ' will never be matched because it ' +
                  'is made redundant by answer ' + (ranges[k].ruleIndex + 1) +
                  ' from Oppia response ' + (ranges[k].answerGroupIndex + 1) +
                  '.')
              });
            }
          }
        }

        for (var k = 0; k < matchedDenominators.length; k++) {
          if (matchedDenominators[k].denominator !== null &&
            rule.type === 'HasFractionalPartExactlyEqualTo') {
            if (matchedDenominators[k].denominator ===
              (rule.inputs.f as FractionAnswer).denominator) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' from Oppia response ' +
                  (i + 1) + ' will never be matched because it ' +
                  'is made redundant by answer ' +
                  (matchedDenominators[k].ruleIndex + 1) +
                  ' from Oppia response ' +
                  (matchedDenominators[k].answerGroupIndex + 1) + '.')
              });
            }
          }
        }

        ranges.push(range);
        matchedDenominators.push(matchedDenominator);
      }
    }

    warningsList = warningsList.concat(
      this.bivs.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));

    return warningsList;
  }
}

angular.module('oppia').factory(
  'FractionInputValidationService', downgradeInjectable(
    FractionInputValidationService));
