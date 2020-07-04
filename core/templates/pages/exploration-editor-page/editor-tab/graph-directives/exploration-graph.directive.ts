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

require(
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/' +
  'exploration-graph-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/alerts.service.ts');
require('services/editability.service.ts');
require('services/contextual/logger.service.ts');

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
        'ExplorationStatesService', 'GraphDataService', 'LoggerService',
        'RouterService', 'StateEditorService', 'UrlInterpolationService',
        function(
            $uibModal, AlertsService, EditabilityService,
            ExplorationStatesService, GraphDataService, LoggerService,
            RouterService, StateEditorService, UrlInterpolationService) {
          var ctrl = this;
          // We hide the graph at the outset in order not to confuse new
          // exploration creators.
          ctrl.isGraphShown = function() {
            return Boolean(ExplorationStatesService.isInitialized());
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
              controller: 'ExplorationGraphModalController'
            }).result.then(function(closeDict) {
              if (closeDict.action === 'delete') {
                ExplorationStatesService.deleteState(closeDict.stateName);
              } else if (closeDict.action === 'navigate') {
                ctrl.onClickStateInMinimap(closeDict.stateName);
              } else {
                LoggerService.error(
                  'Invalid closeDict action: ' + closeDict.action);
              }
            }, function() {
              AlertsService.clearWarnings();
              // This callback is triggered when the Cancel button is
              // clicked. No further action is needed.
            });
          };

          ctrl.getGraphData = function() {
            return GraphDataService.getGraphData();
          };

          ctrl.isEditable = function() {
            return EditabilityService.isEditable();
          };
        }
      ]
    };
  }]);
