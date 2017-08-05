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

// These interaction ids use the interactionHtml available in the player view.
oppia.constant('SOLUTION_SUPPORTED_INTERACTIONS', [
  'MusicNotesInput',
  'GraphInput',
  'SetInput',
  'CodeRepl',
  'MathExpressionInput',
  'ItemSelectionInput',
  'LogicProof',
  'TextInput',
  'NumericInput',
  'PencilCodeEditor'
]);

oppia.constant('INTERACTION_OBJECT_TYPES', {
  CodeRepl: 'CodeString',
  GraphInput: 'Graph',
  ImageClickInput: 'ImageWithRegions',
  PencilCodeEditor: 'CodeString',
  MathExpressionInput: 'UnicodeString',
  MusicNotesInput: 'MusicPhrase',
  NumericInput: 'Real',
  TextInput: 'NormalizedString',
  LogicProof: 'LogicQuestion'
});

oppia.factory('SolutionHelperService', [
  '$injector', 'stateInteractionIdService', 'explorationContextService',
  'editorContextService', 'angularNameService', 'AnswerClassificationService',
  'SOLUTION_SUPPORTED_INTERACTIONS', 'INTERACTION_OBJECT_TYPES',
  function(
    $injector, stateInteractionIdService, explorationContextService,
    editorContextService, angularNameService, AnswerClassificationService,
    SOLUTION_SUPPORTED_INTERACTIONS, INTERACTION_OBJECT_TYPES) {
    return {
      isConstructedUsingObjectType: function(id) {
        return (SOLUTION_SUPPORTED_INTERACTIONS.indexOf(id) === -1);
      },
      getInteractionObjectType: function(id) {
        return INTERACTION_OBJECT_TYPES[id];
      },
      verifySolution: function(
        explorationId, state, correctAnswer, errorCallback, successCallback) {
        var interactionId = stateInteractionIdService.savedMemento;
        var rulesServiceName = (
          angularNameService.getNameOfInteractionRulesService(interactionId));
        var rulesService = $injector.get(rulesServiceName);
        AnswerClassificationService.getMatchingClassificationResult(
          explorationId, state, correctAnswer, true, rulesService
        ).then(function(result) {
          if (
            editorContextService.getActiveStateName() !== result.outcome.dest) {
            successCallback();
          } else {
            errorCallback();
          }
        });
      }
    }
  }]);
