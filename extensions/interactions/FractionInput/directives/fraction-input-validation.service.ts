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
import { Fraction, FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';
import { baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class FractionInputValidationService {
  constructor(
    private fof: FractionObjectFactory,
    private bivs: baseInteractionValidationService) {}

  getNonIntegerInputWarning(i, j) {
    return {
      type: AppConstants.WARNING_TYPES.ERROR,
      message: (
        'Rule ' + (j + 1) + ' from answer group ' +
        (i + 1) + ' is invalid: input should be an ' +
        'integer.')
    };
  }
  getCustomizationArgsWarnings(customizationArgs) {
    return [];
  }
  getAllWarnings(
      stateName, customizationArgs, answerGroups, defaultOutcome) {
    var warningsList = [];
    var shouldBeInSimplestForm =
      customizationArgs.requireSimplestForm.value;
    var allowImproperFraction =
        customizationArgs.allowImproperFraction.value;
    var allowNonzeroIntegerPart =
      customizationArgs.allowNonzeroIntegerPart.value;

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    var toFloat = function(fraction) {
      return this.fof.fromDict(fraction).toFloat();
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
    var setLowerAndUpperBounds = function(range, lb, ub, lbi, ubi) {
      range.lb = lb;
      range.ub = ub;
      range.lbi = lbi;
      range.ubi = ubi;
    };
    var isEnclosedBy = function(ra, rb) {
      if ((ra.lb === null && ra.ub === null) ||
        (rb.lb === null && rb.ub === null)) {
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

    var shouldCheckRangeCriteria = function(earlierRule, laterRule) {
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
      var rules = answerGroups[i].getRulesAsList();
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
          denominator: null,
        };

        switch (rule.type) {
          case 'IsExactlyEqualTo':
            if (shouldBeInSimplestForm) {
              var fractionDict: FractionAnswer = rule.inputs.f;
              var fractionInSimplestForm = this.fof.fromDict(
                fractionDict).convertToSimplestForm();
              if (!angular.equals(fractionDict, fractionInSimplestForm)) {
                warningsList.push({
                  type: AppConstants.WARNING_TYPES.ERROR,
                  message: (
                    'Rule ' + (j + 1) + ' from answer group ' +
                    (i + 1) +
                    ' will never be matched because it is not ' +
                    'in simplest form.')
                });
              }
            }
            if (!allowImproperFraction) {
              var fraction: Fraction = this.fof.fromDict(rule.inputs.f);
              if (fraction.isImproperFraction()) {
                warningsList.push({
                  type: AppConstants.WARNING_TYPES.ERROR,
                  message: (
                    'Rule ' + (j + 1) + ' from answer group ' +
                    (i + 1) +
                    ' will never be matched because it is an ' +
                    'improper fraction')
                });
              }
            }
            if (!allowNonzeroIntegerPart) {
              var fraction: Fraction = this.fof.fromDict(rule.inputs.f);
              if (fraction.hasNonzeroIntegerPart()) {
                warningsList.push({
                  type: AppConstants.WARNING_TYPES.ERROR,
                  message: (
                    'Rule ' + (j + 1) + ' from answer group ' +
                    (i + 1) +
                    ' will never be matched because it has a ' +
                    'non zero integer part')
                });
              }
            }
            var f = toFloat.call(this, rule.inputs.f);
            setLowerAndUpperBounds(range, f, f, true, true);
            break;
          case 'IsEquivalentTo': // fall-through
          case 'IsEquivalentToAndInSimplestForm':
            var f = toFloat.call(this, rule.inputs.f);
            setLowerAndUpperBounds(range, f, f, true, true);
            break;
          case 'IsGreaterThan':
            var f = toFloat.call(this, rule.inputs.f);
            setLowerAndUpperBounds(range, f, Infinity, false, false);
            break;
          case 'IsLessThan':
            var f = toFloat.call(this, rule.inputs.f);
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
                  'Rule ' + (j + 1) + ' from answer group ' +
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
                  'Rule ' + (j + 1) + ' from answer group ' +
                  (i + 1) + ' is invalid: denominator ' +
                  'should be greater than zero.')
              });
            }
            matchedDenominator.denominator = rule.inputs.x;
            break;
          case 'HasFractionalPartExactlyEqualTo':
            if (rule.inputs.f.wholeNumber !== 0) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Rule ' + (j + 1) + ' from answer group ' +
                  (i + 1) +
                  ' is invalid as integer part should be zero')
              });
            }
            if (rule.inputs.f.isNegative !== false) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Rule ' + (j + 1) + ' from answer group ' +
                  (i + 1) +
                  ' is invalid as sign should be positive')
              });
            }
            if (!allowImproperFraction) {
              var fraction: Fraction = this.fof.fromDict(rule.inputs.f);
              if (fraction.isImproperFraction()) {
                warningsList.push({
                  type: AppConstants.WARNING_TYPES.ERROR,
                  message: (
                    'Rule ' + (j + 1) + ' from answer group ' +
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
          var earlierRule = answerGroups[ranges[k].answerGroupIndex]
            .getRulesAsList()[ranges[k].ruleIndex];
          // Rules inside an AnswerGroup do not have a set order. We should
          // check for redundant rules in both directions if rules are in the
          // same AnswerGroup.
          const redundantWithinAnswerGroup = (
            ranges[k].answerGroupIndex === i &&
            (
              (
                isEnclosedBy(range, ranges[k]) &&
                shouldCheckRangeCriteria(earlierRule, rule)
              ) || (
                isEnclosedBy(ranges[k], range) &&
                shouldCheckRangeCriteria(rule, earlierRule)
              )
            )
          );

          // AnswerGroups do have a set order. If rules are not in the same
          // AnswerGroup we only check in one direction.
          const redundantBetweenAnswerGroups = (
            ranges[k].answerGroupIndex !== i &&
            (
              isEnclosedBy(range, ranges[k]) &&
              shouldCheckRangeCriteria(earlierRule, rule)
            )
          );

          if (redundantWithinAnswerGroup || redundantBetweenAnswerGroups) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                'Rule ' + (j + 1) + ' from answer group ' +
                (i + 1) + ' will never be matched because it ' +
                'is made redundant by rule ' + (ranges[k].ruleIndex + 1) +
                ' from answer group ' + (ranges[k].answerGroupIndex + 1) +
                '.')
            });
          }
        }

        for (var k = 0; k < matchedDenominators.length; k++) {
          if (matchedDenominators[k].denominator !== null &&
            rule.type === 'HasFractionalPartExactlyEqualTo') {
            if (matchedDenominators[k].denominator ===
              rule.inputs.f.denominator) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Rule ' + (j + 1) + ' from answer group ' +
                  (i + 1) + ' will never be matched because it ' +
                  'is made redundant by rule ' +
                  (matchedDenominators[k].ruleIndex + 1) +
                  ' from answer group ' +
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
