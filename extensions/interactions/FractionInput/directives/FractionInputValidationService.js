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

oppia.factory('FractionInputValidationService', [
  'WARNING_TYPES', 'baseInteractionValidationService',
  'FractionObjectFactory',
  function(
    WARNING_TYPES, baseInteractionValidationService, FractionObjectFactory) {
    var getNonIntegerInputWarning = function(i, j) {
      return {
        type: WARNING_TYPES.ERROR,
        message: (
          'Rule ' + (j + 1) + ' from answer group ' +
          (i + 1) + ' is invalid: input should be an ' +
          'integer.')
      };
    };
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        return [];
      },
      getAllWarnings: function(
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
          return FractionObjectFactory.fromDict(fraction).toFloat();
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
          // Checks if range ra is enclosed by range rb.
          var lowerBoundConditionIsSatisfied =
            (rb.lb < ra.lb) || (rb.lb == ra.lb && (!ra.lbi || rb.lbi));
          var upperBoundConditionIsSatisfied =
            (rb.ub > ra.ub) || (rb.ub == ra.ub && (!ra.ubi || rb.ubi));
          return lowerBoundConditionIsSatisfied &&
            upperBoundConditionIsSatisfied;
        };

        var ranges = [];
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
              case 'IsExactlyEqualTo':
                if (shouldBeInSimplestForm) {
                  var fraction = rule.inputs.f;
                  var fractionInSimplestForm = FractionObjectFactory.fromDict(
                    fraction).convertToSimplestForm();
                  if (!angular.equals(fraction, fractionInSimplestForm)) {
                    warningsList.push({
                      type: WARNING_TYPES.ERROR,
                      message: (
                        'Rule ' + (j + 1) + ' from answer group ' +
                        (i + 1) +
                        ' will never be matched because it is not ' +
                        'in simplest form.')
                    });
                  }
                }
                if (!allowImproperFraction) {
                  var fraction = FractionObjectFactory.fromDict(rule.inputs.f);
                  if (fraction.isImproperFraction()) {
                    warningsList.push({
                      type: WARNING_TYPES.ERROR,
                      message: (
                        'Rule ' + (j + 1) + ' from answer group ' +
                        (i + 1) +
                        ' will never be matched because it is an ' +
                        'improper fraction')
                    });
                  }
                }
                if (!allowNonzeroIntegerPart) {
                  var fraction = FractionObjectFactory.fromDict(rule.inputs.f);
                  if (fraction.hasNonzeroIntegerPart()) {
                    warningsList.push({
                      type: WARNING_TYPES.ERROR,
                      message: (
                        'Rule ' + (j + 1) + ' from answer group ' +
                        (i + 1) +
                        ' will never be matched because it has a ' +
                        'non zero integer part')
                    });
                  }
                }
                var f = toFloat(rule.inputs.f);
                setLowerAndUpperBounds(range, f, f, true, true);
                break;
              case 'IsEquivalentTo': // fall-through
              case 'IsEquivalentToAndInSimplestForm':
                var f = toFloat(rule.inputs.f);
                setLowerAndUpperBounds(range, f, f, true, true);
                break;
              case 'IsGreaterThan':
                var f = toFloat(rule.inputs.f);
                setLowerAndUpperBounds(range, f, Infinity, false, false);
                break;
              case 'IsLessThan':
                var f = toFloat(rule.inputs.f);
                setLowerAndUpperBounds(range, -Infinity, f, false, false);
                break;
              case 'HasNumeratorEqualTo':
                if (!Number.isInteger(rule.inputs.x)) {
                  warningsList.push(getNonIntegerInputWarning(i, j));
                }
                break;
              case 'HasIntegerPartEqualTo':
                if (!allowNonzeroIntegerPart) {
                  warningsList.push({
                    type: WARNING_TYPES.ERROR,
                    message: (
                      'Rule ' + (j + 1) + ' from answer group ' +
                      (i + 1) +
                      ' will never be matched because integer part ' +
                      'has to be zero')
                  });
                }
                if (!Number.isInteger(rule.inputs.x)) {
                  warningsList.push(getNonIntegerInputWarning(i, j));
                }
                break;
              case 'HasDenominatorEqualTo':
                if (!Number.isInteger(rule.inputs.x)) {
                  warningsList.push(getNonIntegerInputWarning(i, j));
                }
                if (rule.inputs.x == 0) {
                  warningsList.push({
                    type: WARNING_TYPES.ERROR,
                    message: (
                      'Rule ' + (j + 1) + ' from answer group ' +
                      (i + 1) + ' is invalid: denominator ' +
                      'should be greater than zero.')
                  });
                }
                break;
              default:
                break;
            }
            for (var k = 0; k < ranges.length; k++) {
              if (isEnclosedBy(range, ranges[k])) {
                warningsList.push({
                  type: WARNING_TYPES.ERROR,
                  message: (
                    'Rule ' + (j + 1) + ' from answer group ' +
                    (i + 1) + ' will never be matched because it ' +
                    'is made redundant by rule ' + ranges[k].ruleIndex +
                    ' from answer group ' + ranges[k].answerGroupIndex +
                    '.')
                });
              }
            }
            ranges.push(range);
          }
        }

        warningsList = warningsList.concat(
          baseInteractionValidationService.getAllOutcomeWarnings(
            answerGroups, defaultOutcome, stateName));

        return warningsList;
      }
    };
  }
]);
