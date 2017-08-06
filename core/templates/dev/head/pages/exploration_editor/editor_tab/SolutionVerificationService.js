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
 * @fileoverview Service for solution verification.
 */

oppia.factory('SolutionVerificationService', [
  '$injector', 'stateInteractionIdService', 'explorationContextService',
  'editorContextService', 'angularNameService', 'AnswerClassificationService',
  'explorationStatesService',
  function(
    $injector, stateInteractionIdService, explorationContextService,
    editorContextService, angularNameService, AnswerClassificationService,
    explorationStatesService) {
    return {
      verifySolution: function(
        explorationId, state, correctAnswer, successCallback, errorCallback) {
        var interactionId = stateInteractionIdService.savedMemento;
        var rulesServiceName = (
          angularNameService.getNameOfInteractionRulesService(interactionId));
        var rulesService = $injector.get(rulesServiceName);
        var validityBeforeVerification = (
          explorationStatesService.isSolutionValid(
            editorContextService.getActiveStateName()));
        AnswerClassificationService.getMatchingClassificationResult(
          explorationId, state, correctAnswer, true, rulesService
        ).then(function(result) {
          if (
            editorContextService.getActiveStateName() !== result.outcome.dest) {
            if (!validityBeforeVerification) {
              successCallback();
            }
          } else {
            errorCallback();
          }
        });
      }
    }
  }]);
