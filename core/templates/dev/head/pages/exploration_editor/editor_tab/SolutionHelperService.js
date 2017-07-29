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
  'MusicNotesInput',
  'GraphInput',
  'SetInput',
  'MathExpressionInput',
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

oppia.factory('SolutionHelperService', [
  'oppiaHtmlEscaper', 'stateInteractionIdService',
  'explorationContextService', 'editorContextService', '$injector',
  'explorationStatesService', 'angularNameService', 'stateSolutionService',
  'AnswerClassificationService', 'alertsService',
  'SUPPORTED_INTERACTIONS', 'INTERACTION_OBJECT_TYPES',
  function(oppiaHtmlEscaper, stateInteractionIdService,
    explorationStatesService, editorContextService, $injector,
    explorationContextService, angularNameService, stateSolutionService,
    AnswerClassificationService, alertsService,
    SUPPORTED_INTERACTIONS, INTERACTION_OBJECT_TYPES) {
    return {
      isConstructedUsingObjectType: function (id) {
        return (SUPPORTED_INTERACTIONS.indexOf(id) === -1);
      },
      getInteractionObjectType: function (id) {
        return INTERACTION_OBJECT_TYPES[id];
      },
      getCorrectAnswerObject: function(answer, objectType) {
        // The codeRepl interaction is built manually using objectType but
        // the creator view for this interaction will be different from that of
        // the learner view as there will be no compilation/error checking
        // option. The code is entered into an unicode editor and this gets
        // stored as correctAnswer. But since validation of this solution
        // requires extra parameters ('error', 'evaluation', 'output') these
        // are added.
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
      verifySolution: function(explorationId, state, correctAnswer, callback) {
        var interactionId = stateInteractionIdService.savedMemento;
        var rulesServiceName = (
          angularNameService.getNameOfInteractionRulesService(interactionId));
        var rulesService = $injector.get(rulesServiceName);
        AnswerClassificationService.getMatchingClassificationResult(
          explorationId, state, correctAnswer, true, rulesService
        ).then(function(result) {
          if (
            editorContextService.getActiveStateName() !== result.outcome.dest) {
            explorationContextService.getState(
              editorContextService.getActiveStateName()
            ).interaction.markSolutionAsValid();
          } else {
            callback();
            explorationContextService.getState(
              editorContextService.getActiveStateName()
            ).interaction.markSolutionAsInvalid();
          }
        });
      }
    }
  }]);
