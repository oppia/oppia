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
 * @fileoverview Service for solution editor.
 */

oppia.constant('SUPPORTED_INTERACTIONS', [
    'InteractiveMap',
    'MusicNotesInput',
    'GraphInput',
    'SetInput',
    'MathExpressionInput',
    'MultipleChoiceInput',
    'ImageClickInput',
    'ItemSelectionInput'
]);

oppia.constant('UNSUPPORTED_INTERACTION_OBJECT_TYPES', {
  CodeRepl: 'CodeString',
  PencilCodeEditor: 'CodeString',
  NumericInput: 'Real',
  TextInput: 'NormalizedString',
  LogicProof: 'LogicQuestion'
});

oppia.factory('StateSolutionHelperService', [
  'oppiaHtmlEscaper', 'responsesService', 'stateInteractionIdService',
  'SUPPORTED_INTERACTIONS', 'UNSUPPORTED_INTERACTION_OBJECT_TYPES',
  function(oppiaHtmlEscaper, responsesService, stateInteractionIdService,
    SUPPORTED_INTERACTIONS, UNSUPPORTED_INTERACTION_OBJECT_TYPES) {
    return {
      isSupportedInteraction: function (id) {
        return (SUPPORTED_INTERACTIONS.indexOf(id) === -1);
      },
      getUnsupportedInteractionObjectType: function (id) {
        return UNSUPPORTED_INTERACTION_OBJECT_TYPES[id];
      },
      getCorrectAnswer: function (solution) {
        var correctAnswer = '';
        var interactionId = stateInteractionIdService.savedMemento;
        if (interactionId === 'GraphInput') {
          correctAnswer = '[Graph Object]';
        } else if (interactionId === 'MultipleChoiceInput') {
          correctAnswer = (
            oppiaHtmlEscaper.objToEscapedJson(
              responsesService.getAnswerChoices()[solution.correctAnswer]
              .label));
        } else if (interactionId === 'MathExpressionInput') {
          correctAnswer = solution.correctAnswer.latex;
        } else if (interactionId === 'CodeRepl' ||
          interactionId === 'PencilCodeEditor') {
          correctAnswer = solution.correctAnswer.code;
        } else if (interactionId === 'MusicNotesInput') {
          correctAnswer = '[Music Notes Object]';
        } else if (interactionId === 'ImageClickInput') {
          correctAnswer = solution.correctAnswer.clickedRegions;
        } else {
          correctAnswer = (
            oppiaHtmlEscaper.objToEscapedJson(solution.correctAnswer));
        }
        return correctAnswer;
      }
    }
  }]);
