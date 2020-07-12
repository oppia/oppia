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
import { IWarning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { INumericInputCustomizationArgs } from
  'interactions/customization-args-defs';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class NumericInputValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  getCustomizationArgsWarnings(
      customizationArgs: INumericInputCustomizationArgs): IWarning[] {
    return [];
  }

  getAllWarnings(
      stateName: string,
      customizationArgs: INumericInputCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): IWarning[] {
    var warningsList = [];

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
    var setLowerAndUpperBounds = (range, lb, ub, lbi, ubi) => {
      range.lb = lb;
      range.ub = ub;
      range.lbi = lbi;
      range.ubi = ubi;
    };
    var isEnclosedBy = (ra, rb) => {
      // Checks if range ra is enclosed by range rb.
      var lowerBoundConditionIsSatisfied =
          (rb.lb < ra.lb) || (rb.lb === ra.lb && (!ra.lbi || rb.lbi));
      var upperBoundConditionIsSatisfied =
          (rb.ub > ra.ub) || (rb.ub === ra.ub && (!ra.ubi || rb.ubi));
      return lowerBoundConditionIsSatisfied &&
          upperBoundConditionIsSatisfied;
    };

    var ranges = [];
    var raiseWarningForRuleIsInclusivelyBetween = function(ruleIndex,
        answerGroupIndex) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: (
          'In Rule ' + (ruleIndex + 1) + ' from answer group ' +
          (answerGroupIndex + 1) + ', Please ensure that the second number ' +
          'is greater than the first number.')
      });
    };
    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        var range = {
          answerGroupIndex: i + 1,
          ruleIndex: j + 1,
          lb: null,
          ub: null,
          lbi: false,
          ubi: false,
        };
        switch (rule.type) {
          case 'Equals':
            var x = (<number>rule.inputs.x);
            setLowerAndUpperBounds(range, x, x, true, true);
            break;
          case 'IsInclusivelyBetween':
            var a = rule.inputs.a;
            var b = rule.inputs.b;
            if (a > b) {
              raiseWarningForRuleIsInclusivelyBetween(j, i);
            }
            setLowerAndUpperBounds(range, a, b, true, true);
            break;
          case 'IsGreaterThan':
            var x = (<number>rule.inputs.x);
            setLowerAndUpperBounds(range, x, Infinity, false, false);
            break;
          case 'IsGreaterThanOrEqualTo':
            var x = (<number>rule.inputs.x);
            setLowerAndUpperBounds(range, x, Infinity, true, false);
            break;
          case 'IsLessThan':
            var x = (<number>rule.inputs.x);
            setLowerAndUpperBounds(range, -Infinity, x, false, false);
            break;
          case 'IsLessThanOrEqualTo':
            var x = (<number>rule.inputs.x);
            setLowerAndUpperBounds(range, -Infinity, x, false, true);
            break;
          case 'IsWithinTolerance':
            var x = (<number>rule.inputs.x);
            var tol = (<number>rule.inputs.tol);
            setLowerAndUpperBounds(range, x - tol, x + tol, true, true);
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
                'is made redundant by rule ' + ranges[k].ruleIndex +
                ' from answer group ' + ranges[k].answerGroupIndex + '.')
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

  getErrorString(value: string): string {
    if (!value) {
      return '';
    }

    value = value.toString().trim();
    const trailingDot = /\.\d/g;
    const twoDecimals = /.*\..*\./g;
    const extraChars = /[^0-9\.-]/g;
    const trailingMinus = /^-/g;
    const extraMinus = /-.*-/g;

    if (value.includes('.') && !value.match(trailingDot)) {
      return 'Trailing decimals are not allowed.';
    } else if (value.match(twoDecimals)) {
      return 'At most 1 decimal point should be present.';
    } else if (value.match(extraChars)) {
      return 'Only use numbers, minus sign (-), and decimal (.).';
    } else if (value.includes('-') && !value.match(trailingMinus)) {
      return 'Minus (-) sign is only allowed in beginning.';
    } else if (value.includes('-') && value.match(extraMinus)) {
      return 'At most 1 minus (-) sign should be present.';
    }
  }

  parseValue(viewValue: string): number {
    if (viewValue) {
      // Remove commas and leading/trailing spaces before parsing.
      return parseFloat(viewValue.trim().replace(/\,/g, ''));
    }
  }
}

angular.module('oppia').factory(
  'NumericInputValidationService',
  downgradeInjectable(NumericInputValidationService));
