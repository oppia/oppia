// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Stateless service that contains methods for translating a
 * list of states to a list of questions, or determining that this is not
 * possible.
 */

oppia.factory('StatesToQuestionsService', [
  'SimpleEditorShimService', 'QuestionObjectFactory',
  function(SimpleEditorShimService, QuestionObjectFactory) {
    var SUPPORTED_INTERACTION_TYPES = [{
      id: 'MultipleChoiceInput',
      name: 'Multiple choice'
    }];

    var allowedInteractionIds = SUPPORTED_INTERACTION_TYPES.map(
      function(interactionData) {
        return interactionData.id;
      }
    );

    var getQuestions = function() {
      var stateNamesInOrder = [];
      var currentStateName = SimpleEditorShimService.getInitStateName();
      var questions = [];

      var iterations = 0;
      while (currentStateName) {
        iterations++;
        if (iterations > 100) {
          console.error('Too many iterations in while loop');
          break;
        }
        if (stateNamesInOrder.indexOf(currentStateName) !== -1) {
          // There is a cycle in the exploration graph.
          return null;
        }
        stateNamesInOrder.push(currentStateName);

        var stateData = SimpleEditorShimService.getState(currentStateName);
        var interactionId = stateData.interaction.id;
        if (!interactionId) {
          break;
        }

        if (allowedInteractionIds.indexOf(interactionId) === -1) {
          // The interaction for this state is not supported in the simple
          // editor.
          return null;
        }

        // Is the default answer group a self-loop, and is there exactly one
        // non-self-loop destination among the non-default answer groups, and
        // are there no fallbacks or param changes?
        // TODO(sll): This needs to be generalized into a per-interaction
        // validity check, that also includes checks for the customization
        // args.
        var destinationStateNames = [];
        stateData.interaction.answer_groups.forEach(function(group) {
          if (group.outcome.dest !== currentStateName) {
            destinationStateNames.push(group.outcome.dest);
          }
        });

        var defaultOutcome = stateData.interaction.default_outcome;
        if (destinationStateNames.length > 1 ||
            stateData.param_changes.length > 0 ||
            defaultOutcome.dest !== currentStateName ||
            defaultOutcome.param_changes.length > 0 ||
            stateData.interaction.fallbacks.length > 0) {
          return null;
        }

        var bridgeHtml = null;
        if (destinationStateNames.length === 1) {
          bridgeHtml = SimpleEditorShimService.getContentHtml(
            destinationStateNames[0]);
        }

        var question = QuestionObjectFactory.create(
          currentStateName, stateData.interaction, bridgeHtml);
        questions.push(question);

        currentStateName = destinationStateNames[0];
      }

      // TODO(sll): Check that stateNamesInOrder accounts for all the states.
      // TODO(sll): Do additional verification (e.g. content should be valid).

      return questions;
    };

    return {
      // Returns an array of questions derived from the current set of states
      // of the exploration, or null if it is not possible to convert the
      // current set of states to a list of questions.
      getQuestions: function() {
        return getQuestions();
      }
    };
  }
]);
