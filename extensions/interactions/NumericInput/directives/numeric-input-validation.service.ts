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
          'In Rule ' + (ruleIndex + 1) + ' from answer group ' +
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
            'Rule ' + (ruleIndex + 1) + ' input ' +
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
            if (a > b) {
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
                  'Rule ' + (j + 1) + ' upper bound of the range ' +
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
            if (
              (x + tol) < 0 &&
              customizationArgs.requireNonnegativeInput.value
            ) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Rule ' + (j + 1) + ' Upper bound of the tolerance range ' +
                  'should be greater than or equal to zero.')
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
                'Rule ' + (j + 1) + ' from answer group ' +
                (i + 1) + ' will never be matched because it ' +
                'is made redundant by rule ' + (ranges[k].ruleIndex + 1) +
                ' from answer group ' + (ranges[k].answerGroupIndex + 1) + '.')
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
  getErrorString(
      value: number, customizationArgs: boolean, radix?: string
  ): string | undefined {
    let stringValue = null;
    // Convert exponential notation to decimal number.
    // Logic derived from https://stackoverflow.com/a/16139848.
    var data = String(value).split(/[eE]/);
    if (data.length === 1) {
      stringValue = data[0];
    } else {
      var z = '';
      var sign = value < 0 ? '-' : '';
      var str = data[0].replace('.', '');
      var mag = Number(data[1]) + 1;

      if (mag < 0) {
        z = sign + '0.';
        while (mag++) {
          z += '0';
        }
        stringValue = z + str.replace(/^\-/, '');
      } else {
        mag -= str.length;
        while (mag--) {
          z += '0';
        }
        stringValue = str + z;
      }
    }
    const stringValueRegExp = stringValue.match(/\d/g);
    if (!radix) {
      radix = '.';
    }
    if (
      customizationArgs &&
      (stringValueRegExp === null || stringValueRegExp.length > 15)
    ) {
      return 'The answer should be greater than or equal to zero and ' +
      `can contain at most 15 digits (0-9) or symbols(${radix}).`;
    } else if (stringValueRegExp === null || stringValueRegExp.length > 15) {
      return 'The answer can contain at most 15 digits (0-9) or symbols ' +
        `(${radix} or -).`;
    }
  }
}

angular.module('oppia').factory(
  'NumericInputValidationService',
  downgradeInjectable(NumericInputValidationService));
