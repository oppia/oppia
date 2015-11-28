// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Shared utilities for interactions.
 *
 * @author wxyxinyu@gmail.com (Xinyu Wu)
 */

oppia.constant('DEFAULT_ANSWER_GROUP_CLASSIFICATION_THRESHOLD', 0.3);

oppia.factory('interactionService', [
    'warningsData', 'DEFAULT_ANSWER_GROUP_CLASSIFICATION_THRESHOLD', function(
    warningsData, DEFAULT_ANSWER_GROUP_CLASSIFICATION_THRESHOLD) {
  var stringifyClassifiedRule = function(rule) {
    var paramList = [];
    for (var key in rule.inputs) {
      paramList.push(rule.inputs[key]);
    }
    var stringifiedRule = rule.rule_type;
    stringifiedRule += '(' + paramList.join(',') + ')';
    return stringifiedRule;
  };
  return {
    'classifyAnswer': function(
      answer, answerClassificationData, RULES) {
      var answerGroups = answerClassificationData.answerGroups;
      var defaultOutcome = answerClassificationData.defaultOutcome;

      // Find the first group that satisfactorily matches the given answer. This
      // is done by ORing (maximizing) all truth values of all rules over all
      // answer groups. The group with the highest truth value is considered the
      // best match.
      var bestMatchedAnswerGroup;
      var bestMatchedAnswerGroupIndex = answerGroups.length;
      var bestMatchedRuleSpec;
      var bestMatchedTruthValue = 0.0;
      for (var i = 0; i < answerGroups.length; i++) {
        var oredTruthValue = 0.0;
        var bestRuleSpec;
        for (var j = 0; j < answerGroups[i].rule_specs.length; j++) {
          var ruleSpec = answerGroups[i].rule_specs[j];
          var evaluatedTruthValue = RULES[ruleSpec.rule_type](
            answer, ruleSpec.inputs);
          if (evaluatedTruthValue > oredTruthValue) {
            oredTruthValue = evaluatedTruthValue;
            bestRuleSpec = ruleSpec;
          }
        }
        if (oredTruthValue > bestMatchedTruthValue) {
          bestMatchedTruthValue = oredTruthValue;
          bestMatchedRuleSpec = bestRuleSpec;
          bestMatchedAnswerGroup = answerGroups[i];
          bestMatchedAnswerGroupIndex = i;
        }
      }

      // The best matched group must match above a certain threshold. If no
      // group meets this requirement, then the default 'group' automatically
      // matches resulting in the outcome of the answer being the default
      // outcome of the state.
      var DEFAULT_RULESPEC_STRING = 'Default';
      if (bestMatchedTruthValue >=
          DEFAULT_ANSWER_GROUP_CLASSIFICATION_THRESHOLD) {
        return {
          'outcome': bestMatchedAnswerGroup.outcome,
          'rule_spec_string': stringifyClassifiedRule(bestMatchedRuleSpec),
          'answer_group_index': bestMatchedAnswerGroupIndex,
          'classification_certainty': bestMatchedTruthValue
        };
      } else if (defaultOutcome !== undefined) {
        return {
          'outcome': defaultOutcome,
          'rule_spec_string': DEFAULT_RULESPEC_STRING,
          'answer_group_index': answerGroups.length,
          'classification_certainty': 0.0
        };
      } else {
        warningsData.addWarning('No default rule found.');
      }
    }
  };
}]);
