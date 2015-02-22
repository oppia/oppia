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
 * @fileoverview Directives for reusable data visualization components.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('barChart', [function() {
  return {
    restrict: 'E',
    scope: {
      // A read-only array representing the table of chart data.
      data: '&',
      // A read-only object containing several chart options. This object
      // should have the following keys: chartAreaWidth, colors, height,
      // legendPosition and width.
      options: '&'
    },
    controller: ['$scope', '$element', function($scope, $element) {
      if (!$.isArray($scope.data())) {
        return;
      }
      var options = $scope.options();
      var chart = new google.visualization.BarChart($element[0]);
      var _redrawChart = function() {
        chart.draw(
          google.visualization.arrayToDataTable($scope.data()), {
          chartArea: {
            left: 0,
            width: options.chartAreaWidth
          },
          colors: options.colors,
          hAxis: {gridlines: {color: 'transparent'}},
          height: options.height,
          isStacked: true,
          legend: {position:  options.legendPosition || 'none'},
          width: options.width
        });
      }
      $scope.$watch('data()', _redrawChart);
      $(window).resize(_redrawChart);

    }]
  };
}]);

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', 4);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
oppia.constant('MAX_NODE_LABEL_LENGTH', 15);

// Service for computing layout of state graph nodes.
oppia.factory('stateGraphArranger', [
    '$log', '$filter', 'MAX_NODES_PER_ROW', 'MAX_NODE_LABEL_LENGTH', function(
        $log, $filter, MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH) {
  return {
    // Returns an object representing the nodes of the graph. The keys of the
    // object are the node labels. The corresponding values are objects with
    // the following keys:
    //   - x0: the x-position of the top-left corner of the node, measured
    //       as a fraction of the total width.
    //   - y0: the y-position of the top-left corner of the node, measured
    //       as a fraction of the total height.
    //   - width: the width of the node, measured as a fraction of the total
    //       width.
    //   - height: the height of the node, measured as a fraction of the total
    //       height.
    //   - xLabel: the x-position of the middle of the box containing
    //       the node label, measured as a fraction of the total width.
    //       The node label is centered horizontally within this box.
    //   - yLabel: the y-position of the middle of the box containing
    //       the node label, measured as a fraction of the total height.
    //       The node label is centered vertically within this box.
    //   - reachable: whether there is a path from the start node to this node.
    //   - reachableFromEnd: whether there is a path from this node to the END node.
    //   - id: a unique id for the node.
    //   - label: the full label of the node.
    computeLayout: function(nodes, links, initStateId, finalStateIds) {
      // In this implementation, nodes are snapped to a grid. We first compute
      // two additional internal variables for each node:
      //   - depth: its depth in the graph.
      //   - offset: its horizontal offset in the graph.
      // The depth and offset are measured in terms of grid squares.
      var SENTINEL_DEPTH = -1;
      var SENTINEL_OFFSET = -1;

      var nodeData = {};
      for (var nodeId in nodes) {
        nodeData[nodeId] = {
          depth: SENTINEL_DEPTH,
          offset: SENTINEL_OFFSET,
          reachable: false
        };
      }

      // Do a breadth-first search to calculate the depths and offsets.
      var maxDepth = 0;
      var maxOffsetInEachLevel = {0: 0};
      nodeData[initStateId].depth = 0;
      nodeData[initStateId].offset = 0;
      var seenNodes = [initStateId];
      var queue = [initStateId];

      while (queue.length > 0) {
        var currNodeId = queue[0];
        queue.shift();

        nodeData[currNodeId].reachable = true;

        for (var i = 0; i < links.length; i++) {
          // Assign depths and offsets to nodes only when they are first encountered.
          if (links[i].source == currNodeId && seenNodes.indexOf(links[i].target) == -1) {
            seenNodes.push(links[i].target);
            nodeData[links[i].target].depth = nodeData[currNodeId].depth + 1;
            nodeData[links[i].target].offset = (
              nodeData[links[i].target].depth in maxOffsetInEachLevel ?
              maxOffsetInEachLevel[nodeData[links[i].target].depth] + 1 : 0
            );

            while (nodeData[links[i].target].offset >= MAX_NODES_PER_ROW) {
              nodeData[links[i].target].depth += 1;
              nodeData[links[i].target].offset = (
                nodeData[links[i].target].depth in maxOffsetInEachLevel ?
                maxOffsetInEachLevel[nodeData[links[i].target].depth] + 1 : 0
              );
            }

            maxDepth = Math.max(maxDepth, nodeData[links[i].target].depth);
            maxOffsetInEachLevel[nodeData[links[i].target].depth] = (
              nodeData[links[i].target].offset);

            queue.push(links[i].target);
          }
        }
      }

      // Handle nodes that were not visited in the forward traversal.
      maxOffsetInEachLevel[maxDepth + 1] = 0;
      maxDepth += 1;
      var orphanedNodesExist = false;
      for (var nodeId in nodeData) {
        if (nodeData[nodeId].depth === SENTINEL_DEPTH) {
          orphanedNodesExist = true;
          nodeData[nodeId].depth = maxDepth;
          nodeData[nodeId].offset = maxOffsetInEachLevel[maxDepth];
          if (maxOffsetInEachLevel[maxDepth] + 1 >= MAX_NODES_PER_ROW) {
            maxOffsetInEachLevel[maxDepth + 1] = 0;
            maxDepth += 1;
          } else {
            maxOffsetInEachLevel[maxDepth] += 1;
          }
        }
      }
      if (orphanedNodesExist) {
        maxDepth++;
      }

      // Calculate the width and height of each grid rectangle.
      var totalRows = maxDepth;
      // Set totalColumns to be MAX_NODES_PER_ROW, so that the width of the graph
      // visualization can be calculated based on a fixed constant, MAX_NODES_PER_ROW.
      // Otherwise, the width of the individual nodes is dependent on the number
      // of nodes in the longest row, and this makes the nodes too wide if, e.g., the
      // overall graph is just a single column wide.
      var totalColumns = MAX_NODES_PER_ROW;

      // Horizontal padding between the graph and the edge of the graph visualization,
      // measured as a fraction of the entire height.
      var HORIZONTAL_EDGE_PADDING_FRACTION = 0.05;
      // Vertical edge padding between the graph and the edge of the graph visualization,
      // measured as a fraction of the entire height.
      var VERTICAL_EDGE_PADDING_FRACTION = 0.05;

      // The vertical padding, measured as a fraction of the height of a grid rectangle,
      // between the top of the grid rectangle and the top of the node. An equivalent amount
      // of padding will be used for the space between the bottom of the grid rectangle and
      // the bottom of the node.
      var GRID_NODE_Y_PADDING_FRACTION = 0.2;
      // As above, but for the horizontal padding.
      var GRID_NODE_X_PADDING_FRACTION = 0.1;
      // The vertical padding, measured as a fraction of the height of a grid rectangle,
      // between the top of the node and the top of the node label. An equivalent amount
      // of padding will be used for the space between the bottom of the node and the
      // bottom of the node label.
      var NODE_LABEL_Y_PADDING_FRACTION = 0.15;
      // As above, but for the horizontal padding.
      var NODE_LABEL_X_PADDING_FRACTION = 0.05;

      // Helper function that returns a horizontal position, in terms of a fraction of
      // the total width, given a horizontal offset in terms of grid rectangles.
      function getHorizontalPosition(offsetInGridRectangles) {
        var fractionalGridWidth = (1.0 - HORIZONTAL_EDGE_PADDING_FRACTION * 2) / totalColumns;
        return HORIZONTAL_EDGE_PADDING_FRACTION + fractionalGridWidth * offsetInGridRectangles;
      }

      // Helper function that returns a vertical position, in terms of a fraction of
      // the total height, given a vertical offset in terms of grid rectangles.
      function getVerticalPosition(offsetInGridRectangles) {
        var fractionalGridHeight = (1.0 - VERTICAL_EDGE_PADDING_FRACTION * 2) / totalRows;
        return VERTICAL_EDGE_PADDING_FRACTION + fractionalGridHeight * offsetInGridRectangles;
      }

      for (var nodeId in nodeData) {
        nodeData[nodeId].y0 = getVerticalPosition(
          nodeData[nodeId].depth + GRID_NODE_Y_PADDING_FRACTION);
        nodeData[nodeId].x0 = getHorizontalPosition(
          nodeData[nodeId].offset + GRID_NODE_X_PADDING_FRACTION);

        nodeData[nodeId].yLabel = getVerticalPosition(nodeData[nodeId].depth + 0.5);
        nodeData[nodeId].xLabel = getHorizontalPosition(nodeData[nodeId].offset + 0.5);

        nodeData[nodeId].height = (
          (1.0 - VERTICAL_EDGE_PADDING_FRACTION * 2) / totalRows
        ) * (1.0 - GRID_NODE_Y_PADDING_FRACTION * 2);
        nodeData[nodeId].width = (
          (1.0 - HORIZONTAL_EDGE_PADDING_FRACTION * 2) / totalColumns
        ) * (1.0 - GRID_NODE_X_PADDING_FRACTION * 2);
      }

      // Assign id and label to each node.
      for (var nodeId in nodeData) {
        nodeData[nodeId].id = nodeId;
        nodeData[nodeId].label = nodes[nodeId];
      }

      // Mark nodes that are reachable from any end state via backward links.
      queue = finalStateIds;
      for (var i = 0; i < finalStateIds.length; i++) {
        nodeData[finalStateIds[i]].reachableFromEnd = true;
      }
      while (queue.length > 0) {
        var currNodeId = queue[0];
        queue.shift();

        for (var i = 0; i < links.length; i++) {
          if (links[i].target == currNodeId &&
              !nodeData[links[i].source].reachableFromEnd) {
            nodeData[links[i].source].reachableFromEnd = true;
            queue.push(links[i].source);
          }
        }
      }

      return nodeData;
    }
  };
}]);


oppia.directive('stateGraphViz', [
    '$filter', '$timeout', 'stateGraphArranger', 'MAX_NODES_PER_ROW', 'MAX_NODE_LABEL_LENGTH',
    function($filter, $timeout, stateGraphArranger, MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH) {
  return {
    restrict: 'A',
    scope: {
      // A function returning an object with these keys:
      //  - 'nodes': An object whose keys are node ids and whose values are
      //             node labels
      //  - 'links': A list of objects with keys:
      //            'source': id of source node
      //            'target': id of target node
      //            'linkProperty': property of link which determines how it is
      //              styled (styles in linkPropertyMapping). If linkProperty or
      //              corresponding linkPropertyMatching is undefined,
      //              link style defaults to the gray arrow.
      //  - 'initStateId': The initial state id
      //  - 'finalStateIds': The list of ids corresponding to terminal states (i.e.,
      //             those whose interactions are terminal, or 'END').
      graphData: '&',
      // Object whose keys are ids of nodes to display a warning tooltip over
      highlightStates: '=',
      // A value which is the color of all nodes
      nodeFill: '@',
      // Object whose keys are ids of nodes, and values are the opacity of the node
      opacityMap: '=',
      allowPanning: '@',
      currentStateId: '&',
      centerAtCurrentState: '@',
      // Function called when node is clicked. Should take a parameter node.id.
      onClickFunction: '=',
      onDeleteFunction: '=',
      onMaximizeFunction: '=',
      isEditable: '=',
      // Object whose keys are node ids and whose values are node colors
      nodeColors: '=',
      // Object whose keys are node ids with secondary labels and whose values
      // are secondary labels. If this is undefined, it means no nodes have
      // secondary labels.
      nodeSecondaryLabels: '=',
      // Id of a second initial state, which will be styled as an initial state
      initStateId2: '=',
      // Object which maps linkProperty to a style
      linkPropertyMapping: '='
    },
    templateUrl: 'visualizations/stateGraphViz',
    controller: ['$scope', '$element', function($scope, $element) {
      var _redrawGraph = function() {
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
        _redrawGraph();
      });

      $scope.$watch('graphData()', _redrawGraph, true);
      $scope.$watch('currentStateId()', _redrawGraph);
      // If statistics for a different version of the exploration are loaded,
      // this may change the opacities of the nodes.
      $scope.$watch('opacityMap', _redrawGraph);
      $(window).resize(_redrawGraph);

      // A rough upper bound for the width of a single letter, in pixels, to use
      // as a scaling factor to determine the width of graph nodes. This is not
      // an entirely accurate description because it also takes into account the
      // horizontal whitespace between graph nodes.
      var LETTER_WIDTH_IN_PIXELS = 10.5;
      var HORIZONTAL_NODE_PROPERTIES = ['x0', 'width', 'xLabel'];
      var VERTICAL_NODE_PROPERTIES = ['y0', 'height', 'yLabel'];
      $scope.GRAPH_WIDTH = MAX_NODES_PER_ROW * MAX_NODE_LABEL_LENGTH * LETTER_WIDTH_IN_PIXELS;

      var _getElementDimensions = function() {
        return {
          'h': $element.height(),
          'w': $element.width()
        };
      };

      // Returns the closest number to `value` in the range [bound1, bound2].
      var _ensureBetween = function(value, bound1, bound2) {
        var minValue = Math.min(bound1, bound2);
        var maxValue = Math.max(bound1, bound2);
        return Math.min(Math.max(value, minValue), maxValue);
      };

      var _getGraphBoundaries = function(nodeData) {
        var INFINITY = 1e30;
        var BORDER_PADDING = 5;

        var leftEdge = INFINITY;
        var topEdge = INFINITY;
        var bottomEdge = -INFINITY;
        var rightEdge = -INFINITY;

        for (var nodeId in nodeData) {
          leftEdge = Math.min(nodeData[nodeId].x0 - BORDER_PADDING, leftEdge);
          topEdge = Math.min(nodeData[nodeId].y0 - BORDER_PADDING, topEdge);
          rightEdge = Math.max(
            nodeData[nodeId].x0 + BORDER_PADDING + nodeData[nodeId].width,
            rightEdge);
          bottomEdge = Math.max(
            nodeData[nodeId].y0 + BORDER_PADDING + nodeData[nodeId].height,
            bottomEdge);
        }

        return {
          left: leftEdge,
          top: topEdge,
          bottom: bottomEdge,
          right: rightEdge
        };
      };

      $scope.getGraphHeightInPixels = function() {
        return Math.max($scope.GRAPH_HEIGHT, 300);
      };

      $scope.drawGraph = function(nodes, links, initStateId, finalStateIds) {
        $scope.finalStateIds = finalStateIds;
        var nodeData = stateGraphArranger.computeLayout(
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
              $scope.GRAPH_WIDTH * nodeData[nodeId][HORIZONTAL_NODE_PROPERTIES[i]]);
            nodeData[nodeId][VERTICAL_NODE_PROPERTIES[i]] = (
              $scope.GRAPH_HEIGHT * nodeData[nodeId][VERTICAL_NODE_PROPERTIES[i]]);
          }
        }

        // These constants correspond to the rectangle that, when clicked and
        // dragged, translates the graph. Its height, width, and x and y offsets
        // are set to arbitrary large values so that the draggable area extends beyond
        // the graph.
        $scope.VIEWPORT_WIDTH = Math.max(10000, $scope.GRAPH_WIDTH * 5);
        $scope.VIEWPORT_HEIGHT = Math.max(10000, $scope.GRAPH_HEIGHT * 5);
        $scope.VIEWPORT_X = -Math.max(1000, $scope.GRAPH_WIDTH * 2);
        $scope.VIEWPORT_Y = -Math.max(1000, $scope.GRAPH_HEIGHT * 2);

        var graphBoundaries = _getGraphBoundaries(nodeData);

        $scope.augmentedLinks = links.map(function(link) {
          return {
            source: angular.copy(nodeData[link.source]),
            target: angular.copy(nodeData[link.target])
          };
        });

        for (var i = 0; i < $scope.augmentedLinks.length; i++) {
          var link = $scope.augmentedLinks[i];
          if (link.source.label != link.target.label) {
            var sourcex = link.source.xLabel;
            var sourcey = link.source.yLabel;
            var targetx = link.target.xLabel;
            var targety = link.target.yLabel;

            if (sourcex == targetx && sourcey == targety) {
              // TODO(sll): Investigate why this happens.
              return;
            }

            var sourceWidth = link.source.width;
            var sourceHeight = link.source.height;
            var targetWidth = link.target.width;
            var targetHeight = link.target.height;

            var dx = targetx - sourcex,
                dy = targety - sourcey;

            /* Fractional amount of truncation to be applied to the end of
               each link. */
            var startCutoff = (sourceWidth/2)/Math.abs(dx);
            var endCutoff = (targetWidth/2)/Math.abs(dx);
            if (dx === 0 || dy !== 0) {
              startCutoff = (dx === 0) ? (sourceHeight/2)/Math.abs(dy) : Math.min(
                  startCutoff, (sourceHeight/2)/Math.abs(dy));
              endCutoff = (dx === 0) ? (targetHeight/2)/Math.abs(dy) : Math.min(
                  endCutoff, (targetHeight/2)/Math.abs(dy));
            }

            var dxperp = targety - sourcey,
                dyperp = sourcex - targetx,
                norm = Math.sqrt(dxperp*dxperp + dyperp*dyperp);
            dxperp /= norm;
            dyperp /= norm;

            var midx = sourcex + dx/2 + dxperp*(sourceHeight/2),
                midy = sourcey + dy/2 + dyperp*(targetHeight/2),
                startx = sourcex + startCutoff*dx,
                starty = sourcey + startCutoff*dy,
                endx = targetx - endCutoff*dx,
                endy = targety - endCutoff*dy;

            // Draw a quadratic bezier curve.
            $scope.augmentedLinks[i].d = (
              'M' + startx + ' ' + starty + ' Q ' + midx + ' ' + midy +
              ' ' + endx + ' ' + endy);

            // Style links if link properties and style mappings are provided
            if (links[i].hasOwnProperty('linkProperty') && $scope.linkPropertyMapping) {
              if ($scope.linkPropertyMapping.hasOwnProperty(links[i].linkProperty)) {
                $scope.augmentedLinks[i].style =
                  $scope.linkPropertyMapping[links[i].linkProperty];
              }
            }
          }
        }

        var _getNodeStrokeWidth = function(nodeId) {
          return nodeId == $scope.currentStateId() ? '4' :
                 (nodeId == initStateId || nodeId == $scope.initStateId2 ||
                 nodeId == 'END') ? '2' : '1';
        };

        var _getNodeFillOpacity = function(nodeId) {
          return $scope.opacityMap ? $scope.opacityMap[nodeId] : 0.5;
        };

        $scope.isStateFlagged = function(nodeId) {
          return $scope.highlightStates && $scope.highlightStates.hasOwnProperty(nodeId);
        };

        $scope.getNodeTitle = function(node) {
          var warning = '';
          if (node.reachable === false) {
            warning = 'Warning: this state is unreachable.';
          } else if (node.reachableFromEnd === false) {
            warning = 'Warning: there is no path from this state to the END state.';
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
          if (nodeId != initStateId && nodeId !== 'END') {
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
          return nodeId !== 'END' && nodeId != $scope.currentStateId();
        };

        $scope.getTruncatedLabel = function(nodeLabel) {
          return $filter('truncate')(nodeLabel, MAX_NODE_LABEL_LENGTH);
        };

        // Update the nodes.
        $scope.nodeList = [];
        for (var nodeId in nodeData) {
          nodeData[nodeId].style = (
            'stroke-width: ' + _getNodeStrokeWidth(nodeId) + '; ' +
            'fill-opacity: ' + _getNodeFillOpacity(nodeId) + ';');

          if ($scope.nodeFill) {
            nodeData[nodeId].style += ('fill: ' + $scope.nodeFill + '; ');
          }

          // Color nodes
          if ($scope.nodeColors) {
            nodeData[nodeId].style += ('fill: ' + $scope.nodeColors[nodeId] + '; ');
          }

          // Add secondary label if it exists
          if ($scope.nodeSecondaryLabels) {
            if ($scope.nodeSecondaryLabels.hasOwnProperty(nodeId)) {
              nodeData[nodeId].secondaryLabel = $scope.nodeSecondaryLabels[nodeId];
              nodeData[nodeId].height *= 1.1;
            }
          }

          var currentNodeIsTerminal = (
            $scope.finalStateIds.indexOf(nodeId) !== -1);

          nodeData[nodeId].nodeClass = (
            nodeId === 'END'                     ? 'end-node' :
            nodeId === $scope.currentStateId()   ? 'current-node' :
            nodeId === initStateId               ? 'init-node' :
            currentNodeIsTerminal                ? 'terminal-node' :
            !(nodeData[nodeId].reachable &&
              nodeData[nodeId].reachableFromEnd) ? 'bad-node' :
                                                   'normal-node');

          nodeData[nodeId].canDelete = (nodeId != initStateId && nodeId !== 'END');
          $scope.nodeList.push(nodeData[nodeId]);
        }

        // The translation applied when the graph is first loaded.
        var originalTranslationAmounts = [0, 0];
        $scope.overallTransformStr = 'translate(0,0)';
        $scope.innerTransformStr = 'translate(0,0)';

        if ($scope.allowPanning) {
          // Without the timeout, $element.find fails to find the required rect in the
          // state graph modal dialog.
          setTimeout(function() {
            var dimensions = _getElementDimensions();

            d3.select($element.find('rect.pannable-rect')[0]).call(
                d3.behavior.zoom().scaleExtent([1, 1]).on('zoom', function() {
              if (graphBoundaries.right - graphBoundaries.left < dimensions.w) {
                d3.event.translate[0] = 0;
              } else {
                d3.event.translate[0] = _ensureBetween(
                  d3.event.translate[0],
                  dimensions.w - graphBoundaries.right - originalTranslationAmounts[0],
                  - graphBoundaries.left - originalTranslationAmounts[0]);
              }

              if (graphBoundaries.bottom - graphBoundaries.top < dimensions.h) {
                d3.event.translate[1] = 0;
              } else {
                d3.event.translate[1] = _ensureBetween(
                  d3.event.translate[1],
                  dimensions.h - graphBoundaries.bottom - originalTranslationAmounts[1],
                  - graphBoundaries.top - originalTranslationAmounts[1]);
              }

              // We need a separate layer here so that the translation does not
              // influence the panning event receivers.
              $scope.innerTransformStr = 'translate(' + d3.event.translate + ')';
              $scope.$apply();
            }));
          });
        }

        if ($scope.centerAtCurrentState) {
          setTimeout(function() {
            var dimensions = _getElementDimensions();

            // Center the graph at the node representing the current state.
            originalTranslationAmounts[0] = (
              dimensions.w / 2 - nodeData[$scope.currentStateId()].x0 -
              nodeData[$scope.currentStateId()].width / 2);
            originalTranslationAmounts[1] = (
              dimensions.h / 2 - nodeData[$scope.currentStateId()].y0 -
              nodeData[$scope.currentStateId()].height / 2);

            if (graphBoundaries.right - graphBoundaries.left < dimensions.w) {
              originalTranslationAmounts[0] = (
                dimensions.w / 2 - (graphBoundaries.right + graphBoundaries.left) / 2);
            } else {
              originalTranslationAmounts[0] = _ensureBetween(
                originalTranslationAmounts[0],
                dimensions.w - graphBoundaries.right, - graphBoundaries.left);
            }

            if (graphBoundaries.bottom - graphBoundaries.top < dimensions.h) {
              originalTranslationAmounts[1] = (
                dimensions.h / 2 - (graphBoundaries.bottom + graphBoundaries.top) / 2);
            } else {
              originalTranslationAmounts[1] = _ensureBetween(
                originalTranslationAmounts[1],
                dimensions.h - graphBoundaries.bottom, - graphBoundaries.top);
            }

            $scope.overallTransformStr = 'translate(' + originalTranslationAmounts + ')';
            $scope.$apply();
          });
        }
      };
    }]
  };
}]);
