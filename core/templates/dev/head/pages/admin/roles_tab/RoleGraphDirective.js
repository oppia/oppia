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

oppia.directive('roleGraph', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        // An object with these keys:
        //  - 'nodes': An object whose keys are node ids and whose values are
        //             node labels
        //  - 'links': A list of objects with keys:
        //            'source': id of source node
        //            'target': id of target node
        //            'linkProperty': property of link which determines how
        //              it is styled (styles in linkPropertyMapping). If
        //              linkProperty or corresponding linkPropertyMatching
        //              is undefined, link style defaults to the gray arrow.
        //  - 'initStateId': The initial state id
        //  - 'finalStateIds': The list of ids corresponding to terminal states
        //             (i.e., those whose interactions are terminal).
        graphData: '=',
        // A boolean value to signify whether graphData is completely loaded.
        graphDataLoaded: '@'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/roles_tab/role_graph_directive.html'),
      controller: [
        '$scope', '$element', '$timeout', '$filter', 'StateGraphLayoutService',
        'MAX_NODES_PER_ROW', 'MAX_NODE_LABEL_LENGTH',
        function(
            $scope, $element, $timeout, $filter, StateGraphLayoutService,
            MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH) {
          // A rough upper bound for the width of a single letter, in pixels,
          // to use as a scaling factor to determine the width of graph nodes.
          // This is not an entirely accurate description because it also takes
          // into account the horizontal whitespace between graph nodes.
          var LETTER_WIDTH_IN_PIXELS = 10.5;
          var HORIZONTAL_NODE_PROPERTIES = ['x0', 'width', 'xLabel'];
          var VERTICAL_NODE_PROPERTIES = ['y0', 'height', 'yLabel'];
          $scope.GRAPH_WIDTH = (
            MAX_NODES_PER_ROW * MAX_NODE_LABEL_LENGTH * LETTER_WIDTH_IN_PIXELS
            );

          var getElementDimensions = function() {
            return {
              h: $element.height(),
              w: $element.width()
            };
          };

          $scope.getGraphHeightInPixels = function() {
            return Math.max($scope.GRAPH_HEIGHT, 300);
          };

          $scope.drawGraph = function(
              nodes, originalLinks, initStateId, finalStateIds) {
            $scope.finalStateIds = finalStateIds;
            var links = angular.copy(originalLinks);

            var nodeData = StateGraphLayoutService.computeLayout(
              nodes, links, initStateId, angular.copy(finalStateIds));

            var maxDepth = 0;
            for (var nodeId in nodeData) {
              maxDepth = Math.max(maxDepth, nodeData[nodeId].depth);
            }
            $scope.GRAPH_HEIGHT = 70.0 * (maxDepth + 1);

            // Change the position values in nodeData to use pixels.
            for (var nodeId in nodeData) {
              for (var i = 0; i < HORIZONTAL_NODE_PROPERTIES.length; i++) {
                nodeData[nodeId][HORIZONTAL_NODE_PROPERTIES[i]] = (
                  $scope.GRAPH_WIDTH *
                  nodeData[nodeId][HORIZONTAL_NODE_PROPERTIES[i]]);
                nodeData[nodeId][VERTICAL_NODE_PROPERTIES[i]] = (
                  $scope.GRAPH_HEIGHT *
                  nodeData[nodeId][VERTICAL_NODE_PROPERTIES[i]]);
              }
            }

            $scope.augmentedLinks = StateGraphLayoutService.getAugmentedLinks(
              nodeData, links);

            $scope.getNodeTitle = function(node) {
              return node.label;
            };

            $scope.getTruncatedLabel = function(nodeLabel) {
              return $filter('truncate')(nodeLabel, MAX_NODE_LABEL_LENGTH);
            };

            // creating list of nodes to display.
            $scope.nodeList = [];
            for (var nodeId in nodeData) {
              $scope.nodeList.push(nodeData[nodeId]);
            }
          };

          if ($scope.graphDataLoaded) {
            $scope.drawGraph(
              $scope.graphData.nodes, $scope.graphData.links,
              $scope.graphData.initStateId, $scope.graphData.finalStateIds
            );
          }
        }
      ]
    };
  }]);
