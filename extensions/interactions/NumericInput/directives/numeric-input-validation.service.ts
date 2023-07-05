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
 * @fileoverview Validator service for the interaction.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Warning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { NumericInputCustomizationArgs } from
  'interactions/customization-args-defs';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

interface Range {
  answerGroupIndex: number;
  ruleIndex: number;
  lb: number;
  ub: number;
  lbi: boolean;
  ubi: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NumericInputValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  getCustomizationArgsWarnings(
      customizationArgs: NumericInputCustomizationArgs): Warning[] {
    return [];
  }

  getAllWarnings(
      stateName: string,
      customizationArgs: NumericInputCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): Warning[] {
    var warningsList: Warning[] = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    /*
    Store an answer range for every rule, then check for redundant
    ranges. A range is an object of the form:
    {
      lb: float, lower bound
      ub: float, upper bound
      lbi: bool, is lower bound inclusive
      ubi: bool, is upper bound inclusive
    }
    */
    var setLowerAndUpperBounds = (
        range: Range, lb: number, ub: number, lbi: boolean, ubi: boolean) => {
      range.lb = lb;
      range.ub = ub;
      range.lbi = lbi;
      range.ubi = ubi;
    };
    var isEnclosedBy = (ra: Range, rb: Range) => {
      // Checks if range ra is enclosed by range rb.
      var lowerBoundConditionIsSatisfied =
          (rb.lb < ra.lb) || (rb.lb === ra.lb && (!ra.lbi || rb.lbi));
      var upperBoundConditionIsSatisfied =
          (rb.ub > ra.ub) || (rb.ub === ra.ub && (!ra.ubi || rb.ubi));
      return lowerBoundConditionIsSatisfied &&
          upperBoundConditionIsSatisfied;
    };

    var ranges = [];
    var raiseWarningForRuleIsInclusivelyBetween = function(
        ruleIndex: number, answerGroupIndex: number) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: (
          'In learner answer ' + (ruleIndex + 1) + ' from Oppia response ' +
          (answerGroupIndex + 1) + ', Please ensure that the second number ' +
          'is greater than the first number.')
      });
    };
    var raiseWarningForRequireNonnegativeInput = function(
        ruleIndex: number, input: number) {
      if (input < 0 && customizationArgs.requireNonnegativeInput.value) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message: (
            'Learner answer ' + (ruleIndex + 1) + ' input ' +
            'should be greater than or equal to zero.')
        });
      }
    };
    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        var range = {
          answerGroupIndex: i,
          ruleIndex: j,
          lb: 0,
          ub: 0,
          lbi: false,
          ubi: false,
        };
        switch (rule.type) {
          case 'Equals':
            var x = rule.inputs.x as number;
            setLowerAndUpperBounds(range, x, x, true, true);
            raiseWarningForRequireNonnegativeInput(j, x);
            break;
          case 'IsInclusivelyBetween':
            var a = rule.inputs.a as number;
            var b = rule.inputs.b as number;
            if (a >= b) {
              raiseWarningForRuleIsInclusivelyBetween(j, i);
            }
            setLowerAndUpperBounds(range, a, b, true, true);
            if (
              a < 0 &&
              customizationArgs.requireNonnegativeInput.value
            ) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' upper bound of the range ' +
                  'should be greater than or equal to zero.')
              });
            }
            break;
          case 'IsGreaterThan':
            var x = rule.inputs.x as number;
            setLowerAndUpperBounds(range, x, Infinity, false, false);
            break;
          case 'IsGreaterThanOrEqualTo':
            var x = rule.inputs.x as number;
            setLowerAndUpperBounds(range, x, Infinity, true, false);
            break;
          case 'IsLessThan':
            var x = rule.inputs.x as number;
            setLowerAndUpperBounds(range, -Infinity, x, false, false);
            raiseWarningForRequireNonnegativeInput(j, x);
            break;
          case 'IsLessThanOrEqualTo':
            var x = rule.inputs.x as number;
            setLowerAndUpperBounds(range, -Infinity, x, false, true);
            raiseWarningForRequireNonnegativeInput(j, x);
            break;
          case 'IsWithinTolerance':
            var x = rule.inputs.x as number;
            var tol = rule.inputs.tol as number;
            setLowerAndUpperBounds(range, x - tol, x + tol, true, true);
            if (tol <= 0) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) +
                  ' tolerance must be a positive value.')
              });
            }
            if (
              (x + tol) < 0 &&
              customizationArgs.requireNonnegativeInput.value
            ) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' Upper bound of the ' +
                  'tolerance range should be greater than or equal to zero.')
              });
            }
            break;
          default:
        }
        for (var k = 0; k < ranges.length; k++) {
          if (isEnclosedBy(range, ranges[k])) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                'Learner answer ' + (j + 1) + ' from Oppia response ' +
                (i + 1) + ' will never be matched because it is made ' +
                'redundant by answer ' + (ranges[k].ruleIndex + 1) + ' from ' +
                'response ' + (ranges[k].answerGroupIndex + 1) + '.')
            });
          }
        }
        ranges.push(range);
      }
    }

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));

    return warningsList;
  }

  // Returns 'undefined' when no error occurs.
  validateNumericString(
      value: string, decimalSeparator: string
  ): string | undefined {
    value = value.toString().trim();
    const invalidChars = /[^0-9e.-]/g;
    const trailingDot = /[\.|\,|\u066B]\d/g;
    const twoDecimals = /.*[\.|\,|\u066B].*[\.|\,|\u066B]/g;
    const trailingMinus = /(^-)|(e-)/g;
    const extraMinus = /-.*-/g;
    const extraExponent = /e.*e/g;

    if (value.match(invalidChars)) {
      return 'I18N_INTERACTIONS_NUMERIC_INPUT_NO_INVALID_CHARS';
    } else if (value.includes(decimalSeparator) && !value.match(trailingDot)) {
      return 'I18N_INTERACTIONS_NUMERIC_INPUT_NO_TRAILING_DECIMAL';
    } else if (value.match(twoDecimals)) {
      return 'I18N_INTERACTIONS_NUMERIC_INPUT_ATMOST_1_DECIMAL';
    } else if (value.includes('-') && !value.match(trailingMinus)) {
      return 'I18N_INTERACTIONS_NUMERIC_INPUT_MINUS_AT_BEGINNING';
    } else if (value.includes('-') && value.match(extraMinus)) {
      return 'I18N_INTERACTIONS_NUMERIC_INPUT_ATMOST_1_MINUS';
    } else if (value.includes('e') && value.match(extraExponent)) {
      return 'I18N_INTERACTIONS_NUMERIC_INPUT_ATMOST_1_EXPONENT';
    }
  }

  // Returns 'undefined' when no error occurs.
  validateNumber(
      // Null can also be passed in as a value, which is further validated.
      value: number | null,
      requireNonnegativeInput: boolean,
      decimalSeparator: string = '.'
  ): string | undefined {
    if (requireNonnegativeInput && value && value < 0) {
      return 'I18N_INTERACTIONS_NUMERIC_INPUT_LESS_THAN_ZERO';
    }

    let stringValue = null;
    // Value of sign is '-' if value of number is negative,
    // '' if non-negative.
    let sign: string = '';
    if (value !== null) {
      sign = value < 0 ? '-' : '';
    }

    // Convert exponential notation to decimal number.
    // Logic derived from https://stackoverflow.com/a/16139848.
    let numberParts = String(value).split(/[eE]/);

    // If numberParts.length === 1, that means number is not in
    // exponential form.
    if (numberParts.length === 1) {
      stringValue = numberParts[0];
    } else {
      let exponentialValueToString = '';
      // Mantissa is the part of exponential number before the 'e' or 'E'.
      let mantissa = numberParts[0].replace('.', '');
      let numberOfZerosToAdd = Number(numberParts[1]) + 1;

      if (numberOfZerosToAdd < 0) {
        exponentialValueToString = sign + '0.';
        while (numberOfZerosToAdd++) {
          exponentialValueToString += '0';
        }
        stringValue = exponentialValueToString + mantissa.replace(/^\-/, '');
      } else {
        numberOfZerosToAdd -= mantissa.length;
        while (numberOfZerosToAdd--) {
          exponentialValueToString += '0';
        }
        stringValue = mantissa + exponentialValueToString;
      }
    }
    const stringValueRegExp = stringValue.match(/\d/g);
    if (stringValueRegExp === null) {
      return 'I18N_INTERACTIONS_NUMERIC_INPUT_INVALID_NUMBER';
    } else if (stringValueRegExp.length > 15) {
      if (decimalSeparator === ',') {
        return 'I18N_INTERACTIONS_NUMERIC_INPUT_GREATER_THAN_15_DIGITS_COMMA';
      } else {
        return 'I18N_INTERACTIONS_NUMERIC_INPUT_GREATER_THAN_15_DIGITS_DOT';
      }
    }
  }
}

angular.module('oppia').factory(
  'NumericInputValidationService',
  downgradeInjectable(NumericInputValidationService));
