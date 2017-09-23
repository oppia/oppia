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
  '$log', '$injector', 'SimpleEditorShimService', 'QuestionObjectFactory',
  function($log, $injector, SimpleEditorShimService, QuestionObjectFactory) {
    var SUPPORTED_INTERACTION_TYPES = [{
      id: 'MultipleChoiceInput',
      name: 'Multiple choice'
    },
    {
      id: 'TextInput',
      name: 'Text'
    }
  ];
    var INTERACTION_ID_END_EXPLORATION = 'EndExploration';

    var allowedInteractionIds = SUPPORTED_INTERACTION_TYPES.map(
      function(interactionTypeData) {
        return interactionTypeData.id;
      }
    );

    // Check that the outcome has:
    // - A feedback array with exactly one element.
    // - A destination that is a self-loop (if expectSelfLoop is
    //   true), or a non-self-loop otherwise.
    // - An empty paramChanges array.
    var isOutcomeValid = function(outcome, currentStateName, expectSelfLoop) {
      return (
        outcome.feedback.length === 1 &&
        outcome.paramChanges.length === 0 && (
          (expectSelfLoop && outcome.dest === currentStateName) ||
          (!expectSelfLoop && outcome.dest !== currentStateName)
        )
      );
    };

    // Invariants to check:
    // - The exploration is linear.
    // - The paramChanges for all states are empty.
    // - The states in the chain use only allowed interaction IDs, with the
    //     interaction ID of the last state potentially being EndExploration.
    // - Based on the interaction ID of each state:
    //   - Check that the customizationArgs are valid.
    //   - Check that the rules for each answer group are valid.
    // - The confirmedUnclassifiedAnswers array is empty.
    // - The fallbacks array is empty.
    // - For the default outcome, and for each answer group:
    //   - The feedback array contains only one element.
    //   - The destination is a self-loop, UNLESS this is the first answer
    //     group, in which case the destination is a new state (the next along
    //     the chain).
    //   - The paramChanges are empty.
    var getQuestions = function() {
      var stateNamesInOrder = [];
      var allStateNames = SimpleEditorShimService.getAllStateNames();
      var currentStateName = SimpleEditorShimService.getInitStateName();
      var questions = [];

      var iterations = 0;
      while (currentStateName) {
        iterations++;
        if (iterations > 100) {
          $log.error('Too many iterations in while loop');
          return null;
        }

        if (stateNamesInOrder.indexOf(currentStateName) !== -1) {
          // There is a cycle in the exploration graph.
          return null;
        }
        stateNamesInOrder.push(currentStateName);

        var state = SimpleEditorShimService.getState(currentStateName);
        var interaction = state.interaction;

        // Check that the interaction ID is valid.
        var interactionId = interaction.id;
        if (!interactionId ||
            interactionId === INTERACTION_ID_END_EXPLORATION) {
          // The end of the chain has been reached.
          break;
        } else if (allowedInteractionIds.indexOf(interactionId) === -1) {
          // The interaction for this state is not supported in the simple
          // editor.
          return null;
        }

        // Check that the customizationArgs and the rules for each answer
        // group are valid.
        var checkerService = $injector.get(interactionId + 'CheckerService');
        if (!checkerService.isValid(
            interaction.customizationArgs, interaction.answerGroups)) {
          return null;
        }

        // Check that the answer groups and the default outcome are valid.
        for (var i = 0; i < interaction.answerGroups.length; i++) {
          var outcome = interaction.answerGroups[i].outcome;
          var expectSelfLoop = (i !== 0);
          if (!isOutcomeValid(outcome, currentStateName, expectSelfLoop)) {
            return null;
          }
        }
        if (!isOutcomeValid(interaction.defaultOutcome)) {
          return null;
        }

        // Check that other properties of the state are empty.
        if (state.paramChanges.length > 0 || interaction.fallbacks.length > 0 ||
            interaction.confirmedUnclassifiedAnswers.length > 0) {
          return null;
        }

        // Determine the name of the next state, if there is one.
        var correctAnswerDest = null;
        if (interaction.answerGroups.length > 0) {
          correctAnswerDest = interaction.answerGroups[0].outcome.dest;
        }

        var bridgeHtml = (
          correctAnswerDest ?
          SimpleEditorShimService.getContentHtml(correctAnswerDest) : '');
        questions.push(QuestionObjectFactory.create(
          currentStateName, interaction, bridgeHtml));

        if (!correctAnswerDest) {
          // The question we just added is the last one in the chain.
          break;
        } else {
          currentStateName = correctAnswerDest;
        }
      }

      // Check that stateNamesInOrder accounts for all the states except at
      // most one of them.
      var missingStateNames = [];
      for (var i = 0; i < allStateNames.length; i++) {
        if (stateNamesInOrder.indexOf(allStateNames[i]) === -1) {
          missingStateNames.push(allStateNames[i]);
        }
      }
      if (missingStateNames.length >= 2) {
        return null;
      } else if (missingStateNames.length === 1) {
        // The interaction ID for that last state should be null or
        // EndExploration.
        var state = SimpleEditorShimService.getState(missingStateNames[0]);
        var interactionId = state.interaction.id;
        if (interactionId && interactionId !== INTERACTION_ID_END_EXPLORATION) {
          return null;
        }
      }

      return questions;
    };

    return {
      // Returns an array of questions derived from the current set of states
      // of the exploration, or null if it is not possible to convert the
      // current set of states to a list of questions.
      getQuestions: function() {
        return getQuestions();
      },
      getHumanReadableQuestionType: function(interactionId) {
        var readableQuestionType;
        SUPPORTED_INTERACTION_TYPES.forEach(function(interaction) {
          if (interaction.id === interactionId) {
            readableQuestionType = interaction.name;
          }
        });
        if (!readableQuestionType) {
          throw Error('Invalid interaction ID: ' + interactionId);
        }
        return readableQuestionType;
      }
    };
  }
]);
