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
  'ItemSelectionInput',
  'LogicProof'
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

oppia.factory('StateSolutionHelperService', [
  'oppiaHtmlEscaper', 'responsesService', 'stateInteractionIdService',
  'explorationContextService', 'editorContextService', '$injector',
  'explorationStatesService', 'angularNameService', 'stateSolutionService',
  'AnswerClassificationService', 'alertsService',
  'SUPPORTED_INTERACTIONS', 'INTERACTION_OBJECT_TYPES',
  function(oppiaHtmlEscaper, responsesService, stateInteractionIdService,
    explorationStatesService, editorContextService, $injector,
    explorationContextService, angularNameService, stateSolutionService,
    AnswerClassificationService, alertsService,
    SUPPORTED_INTERACTIONS, INTERACTION_OBJECT_TYPES) {
    var currentSolutionIsValid = true;
    return {
      isSupportedInteraction: function (id) {
        return (SUPPORTED_INTERACTIONS.indexOf(id) !== -1);
      },
      getInteractionObjectType: function (id) {
        return INTERACTION_OBJECT_TYPES[id];
      },
      getCorrectAnswerObject: function(answer, objectType) {
        if (objectType === 'CodeString') {
          return {
            code: answer,
            output: '',
            evaluation: '',
            error: ''
          }
        } else {
          return answer;
        }
      },
      verifyAndSaveAnswer: function(explorationId, state, correctAnswer) {
        var interactionId = stateInteractionIdService.savedMemento;
        var rulesServiceName = (
          angularNameService.getNameOfInteractionRulesService(interactionId));
        // Inject RulesService dynamically.
        var rulesService = $injector.get(rulesServiceName);
        AnswerClassificationService.getMatchingClassificationResult(
          explorationId, state, correctAnswer, true, rulesService
        ).then(function(result) {
          if (editorContextService.getActiveStateName() !== (
              result.outcome.dest)) {
            currentSolutionIsValid = true;
            stateSolutionService.saveDisplayedValue();
          } else {
            alertsService.addInfoMessage('That solution does not lead ' +
              'to the next state!');
            currentSolutionIsValid = false;
            stateSolutionService.saveDisplayedValue();
          }
        });
      },
      isCurrentSolutionValid: function() {
        return currentSolutionIsValid;
      },
      unsetSolutionIsValidFlag: function() {
        currentSolutionIsValid = false;
      },
      setSolutionIsValidFlag: function() {
        currentSolutionIsValid = true;
      },
      verifySolution: function(explorationId, state, correctAnswer) {
        var interactionId = stateInteractionIdService.savedMemento;
        var rulesServiceName = (
          angularNameService.getNameOfInteractionRulesService(interactionId));
        var rulesService = $injector.get(rulesServiceName);
        AnswerClassificationService.getMatchingClassificationResult(
          explorationId, state, correctAnswer, true, rulesService
        ).then(function(result) {
          currentSolutionIsValid = editorContextService.getActiveStateName() !== (
            result.outcome.dest);
        });
      }
    }
  }]);
