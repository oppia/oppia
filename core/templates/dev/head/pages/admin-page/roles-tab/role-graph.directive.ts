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
 * @fileoverview Directive for displaying Role graph.
 */

require('components/graph-services/graph-layout.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/truncate.filter.ts');

angular.module('oppia').directive('roleGraph', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        // An object with these keys:
        //  - 'nodes': An object whose keys are node ids and whose values are
        //             node labels
        //  - 'links': A list of objects with keys:
        //            'source': id of source node
        //            'target': id of target node
        //  - 'initStateId': The initial state id
        //  - 'finalStateIds': The list of ids corresponding to terminal states
        graphData: '=',
        // A boolean value to signify whether graphData is completely loaded.
        graphDataLoaded: '@'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/roles-tab/admin-roles-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$element', '$timeout', '$filter', 'StateGraphLayoutService',
        'MAX_NODES_PER_ROW', 'MAX_NODE_LABEL_LENGTH',
        function(
            $element, $timeout, $filter, StateGraphLayoutService,
            MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH) {
          var ctrl = this;
          var getElementDimensions = function() {
            return {
              h: $element.height(),
              w: $element.width()
            };
          };

          ctrl.getGraphHeightInPixels = function() {
            return Math.max(ctrl.GRAPH_HEIGHT, 300);
          };

          ctrl.drawGraph = function(
              nodes, originalLinks, initStateId, finalStateIds) {
            ctrl.finalStateIds = finalStateIds;
            var links = angular.copy(originalLinks);

            var nodeData = StateGraphLayoutService.computeLayout(
              nodes, links, initStateId, angular.copy(finalStateIds));

            ctrl.GRAPH_WIDTH = StateGraphLayoutService.getGraphWidth(
              MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH);
            ctrl.GRAPH_HEIGHT = StateGraphLayoutService.getGraphHeight(
              nodeData);

            nodeData = StateGraphLayoutService.modifyPositionValues(
              nodeData, ctrl.GRAPH_WIDTH, ctrl.GRAPH_HEIGHT);

            ctrl.augmentedLinks = StateGraphLayoutService.getAugmentedLinks(
              nodeData, links);

            ctrl.getNodeTitle = function(node) {
              return node.label;
            };

            ctrl.getTruncatedLabel = function(nodeLabel) {
              return $filter('truncate')(nodeLabel, MAX_NODE_LABEL_LENGTH);
            };

            // creating list of nodes to display.
            ctrl.nodeList = [];
            for (var nodeId in nodeData) {
              ctrl.nodeList.push(nodeData[nodeId]);
            }
          };

          if (ctrl.graphDataLoaded) {
            ctrl.drawGraph(
              ctrl.graphData.nodes, ctrl.graphData.links,
              ctrl.graphData.initStateId, ctrl.graphData.finalStateIds
            );
          }
        }
      ]
    };
  }]);
