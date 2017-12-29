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
 * @fileoverview Factory for creating new frontend instances of AnswerGroup
 * domain objects.
 */

oppia.factory('AnswerGroupObjectFactory', [
  'RuleObjectFactory', 'OutcomeObjectFactory',
  function(RuleObjectFactory, OutcomeObjectFactory) {
    var AnswerGroup = function(rules, outcome, labelledAsCorrect) {
      this.rules = rules;
      this.outcome = outcome;
      this.labelledAsCorrect = labelledAsCorrect;
    };

    AnswerGroup.prototype.toBackendDict = function() {
      return {
        rule_specs: this.rules.map(function(rule) {
          return rule.toBackendDict();
        }),
        outcome: this.outcome.toBackendDict(),
        labelled_as_correct: this.labelledAsCorrect
      };
    };

    // Static class methods. Note that "this" is not available in
    // static contexts.
    AnswerGroup.createNew = function(rules, outcome, labelledAsCorrect) {
      return new AnswerGroup(rules, outcome, labelledAsCorrect);
    };

    AnswerGroup.createFromBackendDict = function(answerGroupBackendDict) {
      return new AnswerGroup(
        generateRulesFromBackend(answerGroupBackendDict.rule_specs),
        OutcomeObjectFactory.createFromBackendDict(
          answerGroupBackendDict.outcome),
        answerGroupBackendDict.labelled_as_correct);
    };

    var generateRulesFromBackend = function(ruleBackendDicts) {
      return ruleBackendDicts.map(function(ruleBackendDict) {
        return RuleObjectFactory.createFromBackendDict(ruleBackendDict);
      });
    };

    return AnswerGroup;
  }
]);
