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

oppia.directive('classifierRulePanel', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onTrainingDataDeletion: '&',
        ruleInputs: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/' +
        'classifier_panel_directive.html'),
      controller: [
        '$scope', '$uibModal', 'ExplorationHtmlFormatterService',
        'StateInteractionIdService', 'StateCustomizationArgsService',
        'TrainingModalService',
        function($scope, $uibModal, ExplorationHtmlFormatterService,
            StateInteractionIdService, StateCustomizationArgsService,
            TrainingModalService) {
          $scope.trainingDataHtmlList = [];
          var trainingData = $scope.ruleInputs.training_data;
          for (var i = 0; i < trainingData.length; i++) {
            $scope.trainingDataHtmlList.push(
              ExplorationHtmlFormatterService.getShortAnswerHtml(
                trainingData[i], StateInteractionIdService.savedMemento,
                StateCustomizationArgsService.savedMemento));
          }

          $scope.openRetrainAnswerModal = function(trainingDataIndex) {
            TrainingModalService.openTrainUnresolvedAnswerModal(
              trainingData[trainingDataIndex], false);
          };
        }
      ]
    };
  }]);
