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
 * @fileoverview Directive for showing static role graph.
 */

oppia.directive('roleGraph', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'A',
      scope: {
        // A function returning an object with these keys:
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
        graphData: '&',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/roles_tab/' +
        'role_graph_directive.html'),
      controller: [
        '$scope', '$element', '$timeout', '$filter', 'StateGraphLayoutService',
        'MAX_NODES_PER_ROW', 'MAX_NODE_LABEL_LENGTH',
        function(
            $scope, $element, $timeout, $filter, StateGraphLayoutService,
            MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH) {
          var redrawGraph = function() {
            if ($scope.graphData()) {
              $scope.graphLoaded = false;
              $scope.drawGraph(
                $scope.graphData().nodes, $scope.graphData().links,
                $scope.graphData().initStateId, $scope.graphData().finalStateIds
              );

              // Wait for the graph to finish loading before showing it again.
              $timeout(function() {
                $scope.graphLoaded = true;
              });
            }
          };

          $scope.$on('redrawGraph', function() {
            redrawGraph();
          });

          $scope.$watch('graphData()', redrawGraph, true);
          $(window).resize(redrawGraph);

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

          // Returns the closest number to `value` in the range
          // [bound1, bound2].
          var clamp = function(value, bound1, bound2) {
            var minValue = Math.min(bound1, bound2);
            var maxValue = Math.max(bound1, bound2);
            return Math.min(Math.max(value, minValue), maxValue);
          };

          var getGraphBoundaries = function(nodeData) {
            var INFINITY = 1e30;
            var BORDER_PADDING = 5;

            var leftEdge = INFINITY;
            var topEdge = INFINITY;
            var bottomEdge = -INFINITY;
            var rightEdge = -INFINITY;

            for (var nodeId in nodeData) {
              leftEdge = Math.min(
                nodeData[nodeId].x0 - BORDER_PADDING, leftEdge);
              topEdge = Math.min(
                nodeData[nodeId].y0 - BORDER_PADDING, topEdge);
              rightEdge = Math.max(
                nodeData[nodeId].x0 + BORDER_PADDING + nodeData[nodeId].width,
                rightEdge);
              bottomEdge = Math.max(
                nodeData[nodeId].y0 + BORDER_PADDING + nodeData[nodeId].height,
                bottomEdge);
            }

            return {
              bottom: bottomEdge,
              left: leftEdge,
              right: rightEdge,
              top: topEdge
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

            // These constants correspond to the rectangle that, when clicked
            // and dragged, translates the graph. Its height, width, and x and
            // y offsets are set to arbitrary large values so that the
            // draggable area extends beyond the graph.
            $scope.VIEWPORT_WIDTH = Math.max(10000, $scope.GRAPH_WIDTH * 5);
            $scope.VIEWPORT_HEIGHT = Math.max(10000, $scope.GRAPH_HEIGHT * 5);
            $scope.VIEWPORT_X = -Math.max(1000, $scope.GRAPH_WIDTH * 2);
            $scope.VIEWPORT_Y = -Math.max(1000, $scope.GRAPH_HEIGHT * 2);

            var graphBounds = getGraphBoundaries(nodeData);

            $scope.augmentedLinks = links.map(function(link) {
              return {
                source: angular.copy(nodeData[link.source]),
                target: angular.copy(nodeData[link.target])
              };
            });

            for (var i = 0; i < $scope.augmentedLinks.length; i++) {
              var link = $scope.augmentedLinks[i];
              if (link.source.label !== link.target.label) {
                var sourcex = link.source.xLabel;
                var sourcey = link.source.yLabel;
                var targetx = link.target.xLabel;
                var targety = link.target.yLabel;

                if (sourcex === targetx && sourcey === targety) {
                  // TODO(sll): Investigate why this happens.
                  return;
                }

                var sourceWidth = link.source.width;
                var sourceHeight = link.source.height;
                var targetWidth = link.target.width;
                var targetHeight = link.target.height;

                var dx = targetx - sourcex;
                var dy = targety - sourcey;

                /* Fractional amount of truncation to be applied to the end of
                   each link. */
                var startCutoff = (sourceWidth / 2) / Math.abs(dx);
                var endCutoff = (targetWidth / 2) / Math.abs(dx);
                if (dx === 0 || dy !== 0) {
                  startCutoff = (
                    (dx === 0) ? (sourceHeight / 2) / Math.abs(dy) :
                    Math.min(startCutoff, (sourceHeight / 2) / Math.abs(dy)));
                  endCutoff = (
                    (dx === 0) ? (targetHeight / 2) / Math.abs(dy) :
                    Math.min(endCutoff, (targetHeight / 2) / Math.abs(dy)));
                }

                var dxperp = targety - sourcey;
                var dyperp = sourcex - targetx;
                var norm = Math.sqrt(dxperp * dxperp + dyperp * dyperp);
                dxperp /= norm;
                dyperp /= norm;

                var midx = sourcex + dx / 2 + dxperp * (sourceHeight / 4);
                var midy = sourcey + dy / 2 + dyperp * (targetHeight / 4);
                var startx = sourcex + startCutoff * dx;
                var starty = sourcey + startCutoff * dy;
                var endx = targetx - endCutoff * dx;
                var endy = targety - endCutoff * dy;

                // Draw a quadratic bezier curve.
                $scope.augmentedLinks[i].d = (
                  'M' + startx + ' ' + starty + ' Q ' + midx + ' ' + midy +
                  ' ' + endx + ' ' + endy);
              }
            }

            var nodeStrokeWidth = 1;
            var nodeFillOpacity = 0.5;
            var nodeFillColor = 'white';

            // Update the nodes.
            $scope.nodeList = [];
            for (var nodeId in nodeData) {
              nodeData[nodeId].style = (
                'stroke-width: ' + nodeStrokeWidth + '; ' +
                'fill-opacity: ' + nodeFillOpacity + ';' +
                'fill: ' + nodeFillColor + '; ');

              $scope.nodeList.push(nodeData[nodeId]);
            }

            // The translation applied when the graph is first loaded.
            var origTranslations = [0, 0];
            $scope.overallTransformStr = 'translate(0,0)';
            $scope.innerTransformStr = 'translate(0,0)';
          };
        }
      ]
    };
  }]);
