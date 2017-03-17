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

oppia.factory('AnswerGroupObjectFactory', [function() {
  var AnswerGroup = function(ruleSpecsList, outcomeDict,
    correct) {
    this.ruleSpecs = ruleSpecsList;
    this.outcome = outcomeDict;
    this.correct = correct;
  };

  AnswerGroup.prototype.toBackendDict = function() {
    return {
      rule_specs: this.ruleSpecs,
      outcome: this.outcome,
      correct: this.correct
    };
  };

  // Static class methods. Note that "this" is not available in
  // static contexts.
  AnswerGroup.createNew = function(ruleSpecsList, outcomeDict, correct) {
    return new AnswerGroup(ruleSpecsList, outcomeDict, correct);
  };

  AnswerGroup.createFromBackendDict = function(answerGroupBackendDict) {
    return new AnswerGroup(
      answerGroupBackendDict.rule_specs,
      answerGroupBackendDict.outcome,
      false);
  };

  return AnswerGroup;
}]);
