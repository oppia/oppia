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

require('interactions/GraphInput/directives/graph-viz.directive.ts');

require('interactions/GraphInput/directives/graph-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/interaction-attributes-extractor.service.ts');
require('pages/exploration-player-page/services/player-position.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('oppiaInteractiveGraphInput', [
  'GraphInputRulesService', 'InteractionAttributesExtractorService',
  'PlayerPositionService',
  function(
      GraphInputRulesService, InteractionAttributesExtractorService,
      PlayerPositionService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getLastAnswer: '&lastAnswer',
      },
      template: require('./graph-input-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$attrs', 'CurrentInteractionService',
        function(
            $scope, $attrs, CurrentInteractionService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          ctrl.submitGraph = function() {
            // Here, angular.copy is needed to strip $$hashkey from the graph.
            CurrentInteractionService.onSubmit(
              angular.copy(ctrl.graph), GraphInputRulesService);
          };

          ctrl.resetGraph = function() {
            const {
              graph
            } = InteractionAttributesExtractorService.getValuesFromAttributes(
              'GraphInput',
              $attrs
            );
            if (checkValidGraph(graph)) {
              ctrl.graph = graph;
            } else {
              ctrl.errorMessage = 'I18N_INTERACTIONS_GRAPH_ERROR_INVALID';
            }
          };

          // TODO(czxcjx): Write this function.
          var checkValidGraph = function(graph) {
            return Boolean(graph);
          };

          var validityCheckFn = function() {
            return checkValidGraph(ctrl.graph);
          };
          ctrl.$onInit = function() {
            ctrl.directiveSubscriptions.add(
              PlayerPositionService.onNewCardAvailable.subscribe(
                () => {
                  ctrl.interactionIsActive = false;

                  ctrl.canAddVertex = false;
                  ctrl.canDeleteVertex = false;
                  ctrl.canEditVertexLabel = false;
                  ctrl.canMoveVertex = false;
                  ctrl.canAddEdge = false;
                  ctrl.canDeleteEdge = false;
                  ctrl.canEditEdgeWeight = false;
                }
              )
            );

            ctrl.errorMessage = '';
            ctrl.graph = {
              vertices: [],
              edges: [],
              isDirected: false,
              isWeighted: false,
              isLabeled: false
            };

            ctrl.interactionIsActive = (ctrl.getLastAnswer() === null);

            CurrentInteractionService.registerCurrentInteraction(
              ctrl.submitGraph, validityCheckFn);

            if (ctrl.interactionIsActive) {
              ctrl.resetGraph();
            } else {
              ctrl.graph = ctrl.getLastAnswer();
            }
            const {
              canAddVertex,
              canDeleteVertex,
              canEditVertexLabel,
              canMoveVertex,
              canAddEdge,
              canDeleteEdge,
              canEditEdgeWeight
            } = InteractionAttributesExtractorService.getValuesFromAttributes(
              'GraphInput',
              $attrs
            );

            ctrl.canAddVertex = ctrl.interactionIsActive ? canAddVertex : false;
            ctrl.canDeleteVertex = ctrl.interactionIsActive ?
              canDeleteVertex : false;
            ctrl.canEditVertexLabel = ctrl.interactionIsActive ?
              canEditVertexLabel : false;
            ctrl.canMoveVertex = ctrl.interactionIsActive ?
              canMoveVertex : false;
            ctrl.canAddEdge = ctrl.interactionIsActive ?
              canAddEdge : false;
            ctrl.canDeleteEdge = ctrl.interactionIsActive ?
              canDeleteEdge : false;
            ctrl.canEditEdgeWeight = ctrl.interactionIsActive ?
              canEditEdgeWeight : false;
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }
]);
