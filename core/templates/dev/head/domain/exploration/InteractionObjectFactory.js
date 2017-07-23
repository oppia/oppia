// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
  'AnswerGroupObjectFactory', 'FallbackObjectFactory',
  'HintObjectFactory', 'OutcomeObjectFactory',
  function(
    AnswerGroupObjectFactory, FallbackObjectFactory,
    HintObjectFactory, OutcomeObjectFactory) {
    var Interaction = function(
        answerGroups, confirmedUnclassifiedAnswers, customizationArgs,
        defaultOutcome, fallbacks, hints, id) {
      this.answerGroups = answerGroups;
      this.confirmedUnclassifiedAnswers = confirmedUnclassifiedAnswers;
      this.customizationArgs = customizationArgs;
      this.defaultOutcome = defaultOutcome;
      this.fallbacks = fallbacks;
      this.hints = hints;
      this.id = id;
    };

    Interaction.prototype.toBackendDict = function() {
      return {
        answer_groups: this.answerGroups.map(function(answerGroup) {
          return answerGroup.toBackendDict();
        }),
        confirmed_unclassified_answers: this.confirmedUnclassifiedAnswers,
        customization_args: this.customizationArgs,
        default_outcome:
          this.defaultOutcome ? this.defaultOutcome.toBackendDict() : null,
        fallbacks: this.fallbacks.map(function(fallback) {
          return fallback.toBackendDict();
        }),
        hints: this.hints.map(function(hint) {
          return hint.toBackendDict();
        }),
        id: this.id,
        solution: {}
      };
    };

    Interaction.createFromBackendDict = function(interactionDict) {
      var defaultOutcome;
      if (interactionDict.default_outcome) {
        defaultOutcome = OutcomeObjectFactory.createFromBackendDict(
          interactionDict.default_outcome);
      } else {
        defaultOutcome = null;
      }
      return new Interaction(
        generateAnswerGroupsFromBackend(interactionDict.answer_groups),
        interactionDict.confirmed_unclassified_answers,
        interactionDict.customization_args,
        defaultOutcome,
        generateFallbacksFromBackend(interactionDict.fallbacks),
        generateHintsFromBackend(interactionDict.hints),
        interactionDict.id);
    };

    var generateAnswerGroupsFromBackend = function(answerGroupBackendDicts) {
      return answerGroupBackendDicts.map(function(
        answerGroupBackendDict) {
        return AnswerGroupObjectFactory.createFromBackendDict(
          answerGroupBackendDict);
      });
    };

    var generateFallbacksFromBackend = function(fallbackBackendDicts) {
      return fallbackBackendDicts.map(function(fallbackBackendDict) {
        return FallbackObjectFactory.createFromBackendDict(fallbackBackendDict);
      });
    };

    var generateHintsFromBackend = function(hintBackendDicts) {
      return hintBackendDicts.map(function(hintBackendDict) {
        return HintObjectFactory.createFromBackendDict(hintBackendDict);
      });
    };

    return Interaction;
  }
]);
