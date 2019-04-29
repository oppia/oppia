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
 * Directive for the GraphInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.constant('GRAPH_INPUT_LEFT_MARGIN', 120);

oppia.directive('oppiaInteractiveGraphInput', [
  'GraphInputRulesService', 'HtmlEscaperService', 'UrlInterpolationService',
  'UrlService', 'EVENT_NEW_CARD_AVAILABLE',
  function(
      GraphInputRulesService, HtmlEscaperService, UrlInterpolationService,
      UrlService, EVENT_NEW_CARD_AVAILABLE) {
    return {
      restrict: 'E',
      scope: {
        getLastAnswer: '&lastAnswer',
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/GraphInput/directives/' +
        'graph_input_interaction_directive.html'),
      controller: [
        '$scope', '$element', '$attrs', 'WindowDimensionsService',
        'CurrentInteractionService',
        function(
            $scope, $element, $attrs, WindowDimensionsService,
            CurrentInteractionService) {
          $scope.errorMessage = '';
          $scope.graph = {
            vertices: [],
            edges: [],
            isDirected: false,
            isWeighted: false,
            isLabeled: false
          };
          $scope.submitGraph = function() {
            // Here, angular.copy is needed to strip $$hashkey from the graph.
            CurrentInteractionService.onSubmit(
              angular.copy($scope.graph), GraphInputRulesService);
          };
          $scope.interactionIsActive = ($scope.getLastAnswer() === null);
          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            $scope.interactionIsActive = false;

            $scope.canAddVertex = false;
            $scope.canDeleteVertex = false;
            $scope.canEditVertexLabel = false;
            $scope.canMoveVertex = false;
            $scope.canAddEdge = false;
            $scope.canDeleteEdge = false;
            $scope.canEditEdgeWeight = false;
          });

          $scope.resetGraph = function() {
            var newGraph = HtmlEscaperService.escapedJsonToObj(
              $attrs.graphWithValue);
            if (checkValidGraph(newGraph)) {
              $scope.graph = newGraph;
            } else {
              $scope.errorMessage = 'I18N_INTERACTIONS_GRAPH_ERROR_INVALID';
            }
          };

          var init = function() {
            if ($scope.interactionIsActive) {
              $scope.resetGraph();
            } else {
              $scope.graph = $scope.getLastAnswer();
            }
            var stringToBool = function(str) {
              return (str === 'true');
            };
            $scope.canAddVertex = $scope.interactionIsActive ?
              stringToBool($attrs.canAddVertexWithValue) : false;
            $scope.canDeleteVertex = $scope.interactionIsActive ?
              stringToBool($attrs.canDeleteVertexWithValue) : false;
            $scope.canEditVertexLabel = $scope.interactionIsActive ?
              stringToBool($attrs.canEditVertexLabelWithValue) : false;
            $scope.canMoveVertex = $scope.interactionIsActive ?
              stringToBool($attrs.canMoveVertexWithValue) : false;
            $scope.canAddEdge = $scope.interactionIsActive ?
              stringToBool($attrs.canAddEdgeWithValue) : false;
            $scope.canDeleteEdge = $scope.interactionIsActive ?
              stringToBool($attrs.canDeleteEdgeWithValue) : false;
            $scope.canEditEdgeWeight = $scope.interactionIsActive ?
              stringToBool($attrs.canEditEdgeWeightWithValue) : false;
          };

          // TODO(czxcjx): Write this function
          var checkValidGraph = function(graph) {
            return Boolean(graph);
          };

          var validityCheckFn = function() {
            return checkValidGraph($scope.graph);
          };

          CurrentInteractionService.registerCurrentInteraction(
            $scope.submitGraph, validityCheckFn);

          init();
        }
      ]
    };
  }
]);
