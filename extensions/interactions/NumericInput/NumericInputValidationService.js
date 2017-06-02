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
  'WARNING_TYPES', 'baseInteractionValidationService',
  function(WARNING_TYPES, baseInteractionValidationService) {
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
        var isEnclosedBy = function(ra, rb) {
          var lower = 
              (rb.lb < ra.lb) || (rb.lb == ra.lb && (!ra.lbi || rb.lbi));
          var upper = 
              (rb.ub > ra.ub) || (rb.ub == ra.ub && (!ra.ubi || rb.ubi));
          return lower && upper;
        };

        var ranges = [];
        for (var i = 0; i < answerGroups.length; i++) {
          var rules = answerGroups[i].rules;
          for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            var range = {};
            switch (rule.type) {
              case 'Equals':
                var x = rule.inputs.x;
                range = { lb: x, ub: x, lbi: true, ubi: true };
                break;
              case 'IsInclusivelyBetween':
                var a = rule.inputs.a;
                var b = rule.inputs.b;
                range = { lb: a, ub: b, lbi: true, ubi: true };
                break;
              case 'IsGreaterThan':
                var x = rule.inputs.x;
                range = { lb: x, ub: Infinity, lbi: false, ubi: false };
                break;
              case 'IsGreaterThanOrEqualTo':
                var x = rule.inputs.x;
                range = { lb: x, ub: Infinity, lbi: true, ubi: false };
                break;
              case 'IsLessThan':
                var x = rule.inputs.x;
                range = { lb: -Infinity, ub: x, lbi: false, ubi: false };
                break;
              case 'IsLessThanOrEqualTo':
                var x = rule.inputs.x;
                range = { lb: -Infinity, ub: x, lbi: false, ubi: true };
                break;
              case 'IsWithinTolerance':
                var x = rule.inputs.x;
                var tol = rule.inputs.tol;
                range = { lb: x - tol, ub: x + tol, lbi: true, ubi: true };
                break;
              default:
            }
            for (var k = 0; k < ranges.length; k++) {
              if (isEnclosedBy(range, ranges[k])) {
                warningsList.push({
                  type: WARNING_TYPES.CRITICAL,
                  message: (
                    'Some rules will never be matched because' +
                    ' they are made redundant by preceding rules.')
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
