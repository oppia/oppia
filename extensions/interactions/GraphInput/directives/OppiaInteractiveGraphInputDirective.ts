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
 * @fileoverview Directive for the GraphInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('interactions/GraphInput/directives/GraphVizDirective.ts');

require('domain/utilities/UrlInterpolationService.ts');
require('interactions/GraphInput/directives/GraphInputRulesService.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/HtmlEscaperService.ts');
require('services/contextual/UrlService.ts');
require('services/contextual/WindowDimensionsService.ts');

angular.module('oppia').directive('oppiaInteractiveGraphInput', [
  'GraphInputRulesService', 'HtmlEscaperService', 'UrlInterpolationService',
  'EVENT_NEW_CARD_AVAILABLE',
  function(
      GraphInputRulesService, HtmlEscaperService, UrlInterpolationService,
      EVENT_NEW_CARD_AVAILABLE) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getLastAnswer: '&lastAnswer',
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/GraphInput/directives/' +
        'graph_input_interaction_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$element', '$attrs', 'WindowDimensionsService',
        'CurrentInteractionService',
        function(
            $scope, $element, $attrs, WindowDimensionsService,
            CurrentInteractionService) {
          var ctrl = this;
          ctrl.errorMessage = '';
          ctrl.graph = {
            vertices: [],
            edges: [],
            isDirected: false,
            isWeighted: false,
            isLabeled: false
          };
          ctrl.submitGraph = function() {
            // Here, angular.copy is needed to strip $$hashkey from the graph.
            CurrentInteractionService.onSubmit(
              angular.copy(ctrl.graph), GraphInputRulesService);
          };
          ctrl.interactionIsActive = (ctrl.getLastAnswer() === null);
          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            ctrl.interactionIsActive = false;

            ctrl.canAddVertex = false;
            ctrl.canDeleteVertex = false;
            ctrl.canEditVertexLabel = false;
            ctrl.canMoveVertex = false;
            ctrl.canAddEdge = false;
            ctrl.canDeleteEdge = false;
            ctrl.canEditEdgeWeight = false;
          });

          ctrl.resetGraph = function() {
            var newGraph = HtmlEscaperService.escapedJsonToObj(
              $attrs.graphWithValue);
            if (checkValidGraph(newGraph)) {
              ctrl.graph = newGraph;
            } else {
              ctrl.errorMessage = 'I18N_INTERACTIONS_GRAPH_ERROR_INVALID';
            }
          };

          var init = function() {
            if (ctrl.interactionIsActive) {
              ctrl.resetGraph();
            } else {
              ctrl.graph = ctrl.getLastAnswer();
            }
            var stringToBool = function(str) {
              return (str === 'true');
            };
            ctrl.canAddVertex = ctrl.interactionIsActive ?
              stringToBool($attrs.canAddVertexWithValue) : false;
            ctrl.canDeleteVertex = ctrl.interactionIsActive ?
              stringToBool($attrs.canDeleteVertexWithValue) : false;
            ctrl.canEditVertexLabel = ctrl.interactionIsActive ?
              stringToBool($attrs.canEditVertexLabelWithValue) : false;
            ctrl.canMoveVertex = ctrl.interactionIsActive ?
              stringToBool($attrs.canMoveVertexWithValue) : false;
            ctrl.canAddEdge = ctrl.interactionIsActive ?
              stringToBool($attrs.canAddEdgeWithValue) : false;
            ctrl.canDeleteEdge = ctrl.interactionIsActive ?
              stringToBool($attrs.canDeleteEdgeWithValue) : false;
            ctrl.canEditEdgeWeight = ctrl.interactionIsActive ?
              stringToBool($attrs.canEditEdgeWeightWithValue) : false;
          };

          // TODO(czxcjx): Write this function
          var checkValidGraph = function(graph) {
            return Boolean(graph);
          };

          var validityCheckFn = function() {
            return checkValidGraph(ctrl.graph);
          };

          CurrentInteractionService.registerCurrentInteraction(
            ctrl.submitGraph, validityCheckFn);

          init();
        }
      ]
    };
  }
]);
