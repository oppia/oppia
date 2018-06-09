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
  'AnswerGroupObjectFactory', 'HintObjectFactory', 'OutcomeObjectFactory',
  'SolutionObjectFactory',
  function(
      AnswerGroupObjectFactory, HintObjectFactory, OutcomeObjectFactory,
      SolutionObjectFactory) {
    var Interaction = function(
        answerGroups, confirmedUnclassifiedAnswers, customizationArgs,
        defaultOutcome, hints, id, solution) {
      this.answerGroups = answerGroups;
      this.confirmedUnclassifiedAnswers = confirmedUnclassifiedAnswers;
      this.customizationArgs = customizationArgs;
      this.defaultOutcome = defaultOutcome;
      this.hints = hints;
      this.id = id;
      this.solution = solution;
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
        hints: this.hints.map(function(hint) {
          return hint.toBackendDict();
        }),
        id: this.id,
        solution: this.solution ? this.solution.toBackendDict() : null
      };
    };

    Interaction.createFromBackendDict = function(backendDict) {
      return new Interaction(
        backendDict.answer_groups.map(function(answerGroupBackendDict) {
          return AnswerGroupObjectFactory.createFromBackendDict(
            answerGroupBackendDict);
        }),
        backendDict.confirmed_unclassified_answers,
        backendDict.customization_args,
        backendDict.default_outcome ?
          OutcomeObjectFactory.createFromBackendDict(
            backendDict.default_outcome) : null,
        backendDict.hints.map(function(hintBackendDict) {
          return HintObjectFactory.createFromBackendDict(hintBackendDict);
        }),
        backendDict.id,
        backendDict.solution ?
          SolutionObjectFactory.createFromBackendDict(backendDict.solution) :
          null
      );
    };

    /** Use this function to create fake data for testing. */
    Interaction.createSampleBackendDict = function() {
      return {
        answer_groups: [
          AnswerGroupObjectFactory.createSampleBackendDict()
        ],
        confirmed_unclassified_answers: [
        ],
        customization_args: [
        ],
        default_outcome: OutcomeObjectFactory.createSampleBackendDict(),
        hints: [
          HintObjectFactory.createSampleBackendDict()
        ],
        id: 'TextInput',
        solution: SolutionObjectFactory.createSampleBackendDict()
      };
    };

    var generateAnswerGroupsFromBackend = function(answerGroupBackendDicts) {
      return answerGroupBackendDicts;
    };

    return Interaction;
  }
]);
