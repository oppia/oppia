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
 * @fileoverview Directive for the state graph visualization.
 */

/* eslint-disable angular/directive-restrict */
oppia.directive('stateGraphViz', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      // Note: This directive is used as attribute because pannability does not
      //    work when directive is used as element. (Convention in the codebase
      //    is to use directive as element.)
      restrict: 'A',
      scope: {
        allowPanning: '@',
        centerAtCurrentState: '@',
        currentStateId: '&',
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
        // Object whose keys are ids of nodes to display a warning tooltip over
        highlightStates: '=',
        // Id of a second initial state, which will be styled as an initial
        // state
        initStateId2: '=',
        isEditable: '=',
        // Object which maps linkProperty to a style
        linkPropertyMapping: '=',
        // Object whose keys are node ids and whose values are node colors
        nodeColors: '=',
        // A value which is the color of all nodes
        nodeFill: '@',
        // Object whose keys are node ids with secondary labels and whose
        // values are secondary labels. If this is undefined, it means no nodes
        // have secondary labels.
        nodeSecondaryLabels: '=',
        // Function called when node is clicked. Should take a parameter
        // node.id.
        onClickFunction: '=',
        onDeleteFunction: '=',
        onMaximizeFunction: '=',
        // Object whose keys are ids of nodes, and whose values are the
        // corresponding node opacities.
        opacityMap: '=',
        showWarningSign: '@'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'state_graph_visualization_directive.html'),
      controller: [
        '$scope', '$element', '$timeout', '$filter', 'StateGraphLayoutService',
        'ExplorationWarningsService', 'MAX_NODES_PER_ROW',
        'MAX_NODE_LABEL_LENGTH',
        function(
            $scope, $element, $timeout, $filter, StateGraphLayoutService,
            ExplorationWarningsService, MAX_NODES_PER_ROW,
            MAX_NODE_LABEL_LENGTH) {
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
          $scope.$watch('currentStateId()', redrawGraph);
          // If statistics for a different version of the exploration are
          // loaded, this may change the opacities of the nodes.
          $scope.$watch('opacityMap', redrawGraph);
          $(window).resize(redrawGraph);

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

          $scope.getGraphHeightInPixels = function() {
            return Math.max($scope.GRAPH_HEIGHT, 300);
          };

          $scope.drawGraph = function(
              nodes, originalLinks, initStateId, finalStateIds) {
            $scope.finalStateIds = finalStateIds;
            var links = angular.copy(originalLinks);

            var nodeData = StateGraphLayoutService.computeLayout(
              nodes, links, initStateId, angular.copy(finalStateIds));

            $scope.GRAPH_WIDTH = StateGraphLayoutService.getGraphWidth(
              MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH);
            $scope.GRAPH_HEIGHT = StateGraphLayoutService.getGraphHeight(
              nodeData);

            nodeData = StateGraphLayoutService.modifyPositionValues(
              nodeData, $scope.GRAPH_WIDTH, $scope.GRAPH_HEIGHT);

            // These constants correspond to the rectangle that, when clicked
            // and dragged, translates the graph. Its height, width, and x and
            // y offsets are set to arbitrary large values so that the
            // draggable area extends beyond the graph.
            $scope.VIEWPORT_WIDTH = Math.max(10000, $scope.GRAPH_WIDTH * 5);
            $scope.VIEWPORT_HEIGHT = Math.max(10000, $scope.GRAPH_HEIGHT * 5);
            $scope.VIEWPORT_X = -Math.max(1000, $scope.GRAPH_WIDTH * 2);
            $scope.VIEWPORT_Y = -Math.max(1000, $scope.GRAPH_HEIGHT * 2);

            var graphBounds = StateGraphLayoutService.getGraphBoundaries(
              nodeData);

            $scope.augmentedLinks = StateGraphLayoutService.getAugmentedLinks(
              nodeData, links);

            for (var i = 0; i < $scope.augmentedLinks.length; i++) {
              // Style links if link properties and style mappings are
              // provided
              if (links[i].hasOwnProperty('linkProperty') &&
                  $scope.linkPropertyMapping) {
                if ($scope.linkPropertyMapping.hasOwnProperty(
                  links[i].linkProperty)) {
                  $scope.augmentedLinks[i].style = (
                    $scope.linkPropertyMapping[links[i].linkProperty]);
                }
              }
            }

            var getNodeStrokeWidth = function(nodeId) {
              var currentNodeIsTerminal = (
                $scope.finalStateIds.indexOf(nodeId) !== -1);
              return (
                nodeId === $scope.currentStateId() ? '3' :
                (nodeId === $scope.initStateId2 || currentNodeIsTerminal) ?
                  '2' : '1');
            };

            var getNodeFillOpacity = function(nodeId) {
              return $scope.opacityMap ? $scope.opacityMap[nodeId] : 0.5;
            };

            $scope.isStateFlagged = function(nodeId) {
              return (
                $scope.highlightStates &&
                $scope.highlightStates.hasOwnProperty(nodeId));
            };

            $scope.getNodeTitle = function(node) {
              var warning = '';
              if (node.reachable === false) {
                warning = 'Warning: this state is unreachable.';
              } else if (node.reachableFromEnd === false) {
                warning = (
                  'Warning: there is no path from this state to the END state.'
                );
              }

              var tooltip = node.label;

              if (node.hasOwnProperty('secondaryLabel')) {
                tooltip += ' ' + node.secondaryLabel;
              }

              if (warning) {
                tooltip += ' (' + warning + ')';
              }
              return tooltip;
            };

            $scope.onNodeDeletionClick = function(nodeId) {
              if (nodeId !== initStateId) {
                $scope.onDeleteFunction(nodeId);
              }
            };

            $scope.getHighlightTransform = function(x0, y0) {
              return 'rotate(-10,' + (x0 - 10) + ',' + (y0 - 5) + ')';
            };

            $scope.getHighlightTextTransform = function(x0, y0) {
              return 'rotate(-10,' + x0 + ',' + (y0 - 4) + ')';
            };

            $scope.canNavigateToNode = function(nodeId) {
              return nodeId !== $scope.currentStateId();
            };

            $scope.getTruncatedLabel = function(nodeLabel) {
              return $filter('truncate')(nodeLabel, MAX_NODE_LABEL_LENGTH);
            };

            // Update the nodes.
            $scope.nodeList = [];
            for (var nodeId in nodeData) {
              nodeData[nodeId].style = (
                'stroke-width: ' + getNodeStrokeWidth(nodeId) + '; ' +
                'fill-opacity: ' + getNodeFillOpacity(nodeId) + ';');

              if ($scope.nodeFill) {
                nodeData[nodeId].style += ('fill: ' + $scope.nodeFill + '; ');
              }

              // Color nodes
              if ($scope.nodeColors) {
                nodeData[nodeId].style += (
                  'fill: ' + $scope.nodeColors[nodeId] + '; ');
              }

              // Add secondary label if it exists
              if ($scope.nodeSecondaryLabels) {
                if ($scope.nodeSecondaryLabels.hasOwnProperty(nodeId)) {
                  nodeData[nodeId].secondaryLabel = (
                    $scope.nodeSecondaryLabels[nodeId]);
                  nodeData[nodeId].height *= 1.1;
                }
              }

              var currentNodeIsTerminal = (
                $scope.finalStateIds.indexOf(nodeId) !== -1);

              nodeData[nodeId].nodeClass = (
                currentNodeIsTerminal ? 'terminal-node' :
                nodeId === $scope.currentStateId() ? 'current-node' :
                nodeId === initStateId ? 'init-node' :
                !(nodeData[nodeId].reachable &&
                  nodeData[nodeId].reachableFromEnd) ? 'bad-node' :
                'normal-node');

              nodeData[nodeId].canDelete = (nodeId !== initStateId);
              $scope.nodeList.push(nodeData[nodeId]);
            }

            $scope.getNodeErrorMessage = function(nodeLabel) {
              var warnings =
                ExplorationWarningsService.getAllStateRelatedWarnings();
              if (warnings.hasOwnProperty(nodeLabel)) {
                return warnings[nodeLabel][0].toString();
              }
            };

            // The translation applied when the graph is first loaded.
            var origTranslations = [0, 0];
            $scope.overallTransformStr = 'translate(0,0)';
            $scope.innerTransformStr = 'translate(0,0)';

            if ($scope.allowPanning) {
              // Without the timeout, $element.find fails to find the required
              // rect in the state graph modal dialog.
              $timeout(function() {
                var dimensions = getElementDimensions();

                d3.select($element.find('rect.pannable-rect')[0])
                  .call(d3.behavior.zoom().scaleExtent([1, 1])
                    .on('zoom', function() {
                      if (graphBounds.right - graphBounds.left < dimensions.w) {
                        d3.event.translate[0] = 0;
                      } else {
                        d3.event.translate[0] = clamp(
                          d3.event.translate[0],
                          dimensions.w - graphBounds.right -
                           origTranslations[0],
                          -graphBounds.left - origTranslations[0]);
                      }

                      if (graphBounds.bottom - graphBounds.top < dimensions.h) {
                        d3.event.translate[1] = 0;
                      } else {
                        d3.event.translate[1] = clamp(
                          d3.event.translate[1],
                          dimensions.h - graphBounds.bottom -
                           origTranslations[1],
                          -graphBounds.top - origTranslations[1]);
                      }

                      // We need a separate layer here so that the translation
                      // does not influence the panning event receivers.
                      $scope.innerTransformStr = (
                        'translate(' + d3.event.translate + ')');
                      $scope.$apply();
                    })
                  );
              }, 10);
            }

            if ($scope.centerAtCurrentState) {
              $timeout(function() {
                var dimensions = getElementDimensions();

                // Center the graph at the node representing the current state.
                origTranslations[0] = (
                  dimensions.w / 2 - nodeData[$scope.currentStateId()].x0 -
                  nodeData[$scope.currentStateId()].width / 2);
                origTranslations[1] = (
                  dimensions.h / 2 - nodeData[$scope.currentStateId()].y0 -
                  nodeData[$scope.currentStateId()].height / 2);

                if (graphBounds.right - graphBounds.left < dimensions.w) {
                  origTranslations[0] = (
                    dimensions.w / 2 -
                    (graphBounds.right + graphBounds.left) / 2);
                } else {
                  origTranslations[0] = clamp(
                    origTranslations[0],
                    dimensions.w - graphBounds.right,
                    -graphBounds.left);
                }

                if (graphBounds.bottom - graphBounds.top < dimensions.h) {
                  origTranslations[1] = (
                    dimensions.h / 2 -
                    (graphBounds.bottom + graphBounds.top) / 2);
                } else {
                  origTranslations[1] = clamp(
                    origTranslations[1],
                    dimensions.h - graphBounds.bottom,
                    -graphBounds.top);
                }

                $scope.overallTransformStr = (
                  'translate(' + origTranslations + ')');
                $scope.$apply();
              }, 20);
            }
          };
        }
      ]
    };
  }]);
/* eslint-enable angular/directive-restrict */
