// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the classifier panel.
 */

oppia.directive('classifierRulePanel', [function() {
  return {
    restrict: 'E',
    scope: {
      onTrainingDataDeletion: '&',
      ruleInputs: '='
    },
    templateUrl: 'rules/classifierRulePanel',
    controller: [
      '$scope', '$modal', 'oppiaExplorationHtmlFormatterService',
      'stateInteractionIdService', 'stateCustomizationArgsService',
      'trainingModalService',
      function($scope, $modal, oppiaExplorationHtmlFormatterService,
          stateInteractionIdService, stateCustomizationArgsService,
          trainingModalService) {
        $scope.trainingDataHtmlList = [];
        var trainingData = $scope.ruleInputs.training_data;
        for (var i = 0; i < trainingData.length; i++) {
          $scope.trainingDataHtmlList.push(
            oppiaExplorationHtmlFormatterService.getShortAnswerHtml(
              trainingData[i], stateInteractionIdService.savedMemento,
              stateCustomizationArgsService.savedMemento));
        }

        $scope.openRetrainAnswerModal = function(trainingDataIndex) {
          trainingModalService.openTrainUnresolvedAnswerModal(
            trainingData[trainingDataIndex], false);
        };
      }
    ]
  };
}]);
