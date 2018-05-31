// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator service for the number with units interaction.
 */

oppia.factory('NumberWithUnitsValidationService', [
  'WARNING_TYPES', 'baseInteractionValidationService',
  'NumberWithUnitsObjectFactory',
  function(WARNING_TYPES, baseInteractionValidationService,
      NumberWithUnitsObjectFactory) {
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        return [];
      },
      getAllWarnings: function(
          stateName, customizationArgs, answerGroups, defaultOutcome) {
        var warningsList = [];

        warningsList = warningsList.concat(
          this.getCustomizationArgsWarnings(customizationArgs));

        var checkEquality = function(earlierRule, laterRule) {
          earlierInput = NumberWithUnitsObjectFactory.fromDict(
            earlierRule.inputs.f);
          laterInput = NumberWithUnitsObjectFactory.fromDict(
            laterRule.inputs.f);
          //console.log(earlierInput);
          //console.log(laterInput);

          if (earlierInput.type === laterInput.type) {
            if (earlierInput.type === 'fraction') {
              if (earlierInput.fraction.tofloat() !== laterInput.fraction.toFloat()) {
                return false;
              }

              if (!angular.equals(earlierInput.units.toDict(), laterInput.units.toDict())) {
                return false;
              }
              return true;
            } else if (earlierInput.type === 'real') {
              return earlierInput.real === laterInput.real && angular.equals(
                earlierInput.units.toDict(), laterInput.units.toDict());
            }
          }
          return false;
        };

        var checkEquivalency = function(earlierRule, laterRule) {
          earlierInput = NumberWithUnitsObjectFactory.fromDict(
            earlierRule.inputs.f);
          laterInput = NumberWithUnitsObjectFactory.fromDict(
            laterRule.inputs.f);
          if (earlierInput.type === 'fraction') {
            earlierInput.type = 'real';
            earlierInput.real = earlierInput.fraction.toFloat();
          }
          if (laterInput.type === 'fraction') {
            laterInput.type = 'real';
            laterInput.real = laterInput.fraction.toFloat();
          }
          earlierInputString = earlierInput.toString();
          laterInputString = laterInput.toString();
          return math.unit(laterInputString).equals(math.unit(
            earlierInputString));
        };

        var ranges = [];

        for (var i = 0; i < answerGroups.length; i++) {
          var rules = answerGroups[i].rules;
          for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            var range = {
              answerGroupIndex: i + 1,
              ruleIndex: j + 1,
            };

            for (var k = 0; k < ranges.length; k++) {
              var earlierRule = answerGroups[ranges[k].answerGroupIndex - 1].rules[ranges[k].ruleIndex - 1];
              if (earlierRule.rule_type === 'IsEqualTo') {
                if (checkEquality(earlierRule, rule)) {
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

              if (earlierRule.rule_type === 'IsEquivalentTo') {
                if (checkEquivalency(earlierRule, rule)) {
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
