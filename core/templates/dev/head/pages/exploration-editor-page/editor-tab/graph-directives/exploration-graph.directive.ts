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
 * @fileoverview Directive for the exploration graph.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/alerts.service.ts');
require('services/editability.service.ts');

angular.module('oppia').directive('explorationGraph', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/editor-tab/graph-directives/' +
        'exploration-graph.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$uibModal', 'AlertsService', 'EditabilityService',
        'ExplorationStatesService', 'GraphDataService', 'RouterService',
        'StateEditorService', 'UrlInterpolationService',
        function(
            $uibModal, AlertsService, EditabilityService,
            ExplorationStatesService, GraphDataService, RouterService,
            StateEditorService, UrlInterpolationService) {
          var ctrl = this;
          ctrl.getGraphData = GraphDataService.getGraphData;
          ctrl.isEditable = EditabilityService.isEditable;

          // We hide the graph at the outset in order not to confuse new
          // exploration creators.
          ctrl.isGraphShown = function() {
            return Boolean(ExplorationStatesService.isInitialized() &&
              ExplorationStatesService.getStateNames().length > 1);
          };

          ctrl.deleteState = function(deleteStateName) {
            ExplorationStatesService.deleteState(deleteStateName);
          };

          ctrl.onClickStateInMinimap = function(stateName) {
            RouterService.navigateToMainTab(stateName);
          };

          ctrl.getActiveStateName = function() {
            return StateEditorService.getActiveStateName();
          };

          ctrl.openStateGraphModal = function() {
            AlertsService.clearWarnings();

            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/exploration-graph-modal.template.html'),
              backdrop: true,
              resolve: {
                isEditable: function() {
                  return ctrl.isEditable;
                }
              },
              windowClass: 'oppia-large-modal-window',
              controller: [
                '$scope', '$uibModalInstance', 'StateEditorService',
                'GraphDataService', 'isEditable',
                function($scope, $uibModalInstance, StateEditorService,
                    GraphDataService, isEditable) {
                  $scope.currentStateName = StateEditorService
                    .getActiveStateName();
                  $scope.graphData = GraphDataService.getGraphData();
                  $scope.isEditable = isEditable;

                  $scope.deleteState = function(stateName) {
                    $uibModalInstance.close({
                      action: 'delete',
                      stateName: stateName
                    });
                  };

                  $scope.selectState = function(stateName) {
                    $uibModalInstance.close({
                      action: 'navigate',
                      stateName: stateName
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(closeDict) {
              if (closeDict.action === 'delete') {
                ExplorationStatesService.deleteState(closeDict.stateName);
              } else if (closeDict.action === 'navigate') {
                ctrl.onClickStateInMinimap(closeDict.stateName);
              } else {
                console.error('Invalid closeDict action: ' + closeDict.action);
              }
            });
          };
        }]
    };
  }]);
