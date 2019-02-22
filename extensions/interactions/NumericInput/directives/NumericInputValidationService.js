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

oppia.factory('NumericInputValidationService', [
  'baseInteractionValidationService', 'WARNING_TYPES',
  function(baseInteractionValidationService, WARNING_TYPES) {
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        return [];
      },
      getAllWarnings: function(
          stateName, customizationArgs, answerGroups, defaultOutcome) {
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
        var setLowerAndUpperBounds = function(range, lb, ub, lbi, ubi) {
          range.lb = lb;
          range.ub = ub;
          range.lbi = lbi;
          range.ubi = ubi;
        };
        var isEnclosedBy = function(ra, rb) {
          // Checks if range ra is enclosed by range rb.
          var lowerBoundConditionIsSatisfied =
              (rb.lb < ra.lb) || (rb.lb === ra.lb && (!ra.lbi || rb.lbi));
          var upperBoundConditionIsSatisfied =
              (rb.ub > ra.ub) || (rb.ub === ra.ub && (!ra.ubi || rb.ubi));
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
              case 'Equals':
                var x = rule.inputs.x;
                setLowerAndUpperBounds(range, x, x, true, true);
                break;
              case 'IsInclusivelyBetween':
                var a = rule.inputs.a;
                var b = rule.inputs.b;
                setLowerAndUpperBounds(range, a, b, true, true);
                break;
              case 'IsGreaterThan':
                var x = rule.inputs.x;
                setLowerAndUpperBounds(range, x, Infinity, false, false);
                break;
              case 'IsGreaterThanOrEqualTo':
                var x = rule.inputs.x;
                setLowerAndUpperBounds(range, x, Infinity, true, false);
                break;
              case 'IsLessThan':
                var x = rule.inputs.x;
                setLowerAndUpperBounds(range, -Infinity, x, false, false);
                break;
              case 'IsLessThanOrEqualTo':
                var x = rule.inputs.x;
                setLowerAndUpperBounds(range, -Infinity, x, false, true);
                break;
              case 'IsWithinTolerance':
                var x = rule.inputs.x;
                var tol = rule.inputs.tol;
                setLowerAndUpperBounds(range, x - tol, x + tol, true, true);
                break;
              default:
            }
            for (var k = 0; k < ranges.length; k++) {
              if (isEnclosedBy(range, ranges[k])) {
                warningsList.push({
                  type: WARNING_TYPES.ERROR,
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
          baseInteractionValidationService.getAllOutcomeWarnings(
            answerGroups, defaultOutcome, stateName));

        return warningsList;
      }
    };
  }
]);
