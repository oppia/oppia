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
 * @fileoverview Factory for creating new frontend instances of Interaction
 * domain objects.
 */

oppia.factory('InteractionObjectFactory', [
  'AnswerGroupObjectFactory', function(AnswerGroupObjectFactory) {
  var Interaction = function(answerGroupBackendDicts,
    confirmedUnclassifiedAnswers, customizationArgs, defaultOutcome,
    fallbacks, id) {
    this.answerGroups = generateAnswerGroupsFromBackend(
      answerGroupBackendDicts);
    this.confirmedUnclassifiedAnswers = confirmedUnclassifiedAnswers;
    this.customizationArgs = customizationArgs;
    this.defaultOutcome = defaultOutcome;
    this.fallbacks = fallbacks;
    this.id = id;
  };

  var generateAnswerGroupsFromBackend = function(answerGroupBackendDicts) {
    var answerGroups = answerGroupBackendDicts.map(function(answerGroupDict) {
      return AnswerGroupObjectFactory.create(
        answerGroupDict.rule_specs, answerGroupDict.outcome, false);
    });

    return answerGroups;
  };

  Interaction.prototype.toBackendDict = function() {
    return {
      answer_groups: this.answerGroups.map(function(answerGroup) {
        return answerGroup.toBackendDict();
      }),
      confirmed_unclassified_answers: this.confirmedUnclassifiedAnswers,
      customization_args: this.customizationArgs,
      default_outcome: this.defaultOutcome,
      fallbacks: this.fallbacks,
      id: this.id
    };
  };

  Interaction.create = function(interactionDict) {
    return new Interaction(
      interactionDict.answer_groups,
      interactionDict.confirmed_unclassified_answers,
      interactionDict.customization_args,
      interactionDict.default_outcome,
      interactionDict.fallbacks,
      interactionDict.id);
  };

  return Interaction;
}]);
