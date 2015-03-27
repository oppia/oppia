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

  var MAX_INDENTATION_LEVEL = 2.5;

  var _getGraphAsAdjacencyLists = function(nodes, links) {
    var adjacencyLists = {};

    for (var nodeId in nodes) {
      adjacencyLists[nodeId] = [];
    }
    for (var i = 0; i < links.length; i++) {
      if (links[i].source !== links[i].target &&
          adjacencyLists[links[i].source].indexOf(links[i].target) === -1) {
        adjacencyLists[links[i].source].push(links[i].target);
      }
    }

    return adjacencyLists;
  };

  var _getIndentationLevels = function(adjacencyLists, trunkNodeIds) {
    var indentationLevels = [];

    // Recursively find and indent the longest shortcut for the segment of
    // nodes ranging from trunkNodeIds[startInd] to trunkNodeIds[endInd]
    // (inclusive). It's possible that this shortcut starts from a trunk
    // node within this interval (A, say) and ends at a trunk node after
    // this interval, in which case we indent all nodes from A + 1 onwards.
    // NOTE: this mutates indentationLevels as a side-effect.
    var indentLongestShortcut = function(startInd, endInd) {
      if (startInd >= endInd || indentationLevels[startInd] >= MAX_INDENTATION_LEVEL) {
        return;
      }

      var bestSourceInd = -1;
      var bestTargetInd = -1;

      for (var sourceInd = startInd; sourceInd < endInd; sourceInd++) {
        var sourceNodeId = trunkNodeIds[sourceInd];
        for (var i = 0; i < adjacencyLists[sourceNodeId].length; i++) {
          var possibleTargetInd = trunkNodeIds.indexOf(
            adjacencyLists[sourceNodeId][i]);
          if (possibleTargetInd !== -1 && sourceInd < possibleTargetInd) {
            targetInd = Math.min(possibleTargetInd, endInd + 1);
            if (targetInd - sourceInd > bestTargetInd - bestSourceInd) {
              bestSourceInd = sourceInd;
              bestTargetInd = targetInd;
            }
          }
        }
      }

      if (bestTargetInd - bestSourceInd > 1) {
        // Indent nodes in [bestSourceInd + 1, bestTargetInd - 1].
        for (var i = bestSourceInd + 1; i < bestTargetInd; i++) {
          indentationLevels[i] += 0.5;
        }

        // Recursively attempt to indent nodes before, within and after this
        // interval.
        indentLongestShortcut(startInd, bestSourceInd);
        indentLongestShortcut(bestSourceInd + 1, bestTargetInd - 1);
        indentLongestShortcut(bestTargetInd, endInd);
      }
    }

    for (var i = 0; i < trunkNodeIds.length; i++) {
      indentationLevels.push(0);
    }
    indentLongestShortcut(0, trunkNodeIds.length - 1);
    return indentationLevels;
  };

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
    computeLayout: function(nodes, links, initNodeId, finalNodeIds) {
      var adjacencyLists = _getGraphAsAdjacencyLists(nodes, links);

      // Find a long path through the graph from the initial state to a terminal
      // state via simple backtracking. Limit the algorithm to a constant number
      // of calls in order to ensure that the calculation does not take too long.
      var MAX_BACKTRACKING_CALLS = 1000;
      var numBacktrackingCalls = 0;
      var bestPath = [initNodeId];
      // Note that this is a 'global variable' for the purposes of the backtracking
      // computation.
      var currentPath = [];

      var _backtrack = function(currentNodeId) {
        currentPath.push(currentNodeId);

        // If the current node leads to no other nodes, we consider it a 'terminal state'.
        if (adjacencyLists[currentNodeId].length === 0) {
          if (currentPath.length > bestPath.length) {
            bestPath = angular.copy(currentPath);
          }
        } else {
          numBacktrackingCalls++;
          if (numBacktrackingCalls <= MAX_BACKTRACKING_CALLS) {
            for (var i = 0; i < adjacencyLists[currentNodeId].length; i++) {
              if (currentPath.indexOf(adjacencyLists[currentNodeId][i]) === -1) {
                _backtrack(adjacencyLists[currentNodeId][i]);
              }
            }
          }
        }

        currentPath.pop();
      }

      _backtrack(initNodeId);

      // In this implementation, nodes are aligned with a rectangular grid.
      // We calculate two additional internal variables for each node in
      // nodeData:
      //   - depth: its depth in the graph.
      //   - offset: its horizontal offset in the graph.
      // The depth and offset are measured in terms of grid squares.
      //
      // We first take the longest path through the graph (the 'trunk') and
      // find the longest possible shortcuts within that path, then indent
      // the nodes within those shortcuts and assign depths/offsets to them.
      // The indentation is done by only half a node width, so that the nodes
      // still feel 'close' together.
      //
      // After that, we traverse all remaining nodes via BFS and arrange them
      // such that nodes that are immediate descendants of nodes in the trunk
      // fall in the level just below their parent, and their children fall in
      // the next level, etc. All these nodes are placed to the right of the
      // trunk.
      //
      // NOTE: This algorithm does not work so well in clarifying articulation
      // points and 'subclusters' within a graph. For an illustration of this,
      // see the 'Parameterized Adventure' demo exploration.
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

      var maxDepth = 0;
      var maxOffsetInEachLevel = {0: 0};
      var trunkNodesIndentationLevels = _getIndentationLevels(adjacencyLists, bestPath);

      for (var i = 0; i < bestPath.length; i++) {
        nodeData[bestPath[i]].depth = maxDepth;
        nodeData[bestPath[i]].offset = trunkNodesIndentationLevels[i];
        nodeData[bestPath[i]].reachable = true;
        maxOffsetInEachLevel[maxDepth] = trunkNodesIndentationLevels[i];
        maxDepth++;
      }

      // Do a breadth-first search to calculate the depths and offsets for other nodes.
      var seenNodes = [initNodeId];
      var queue = [initNodeId];

      while (queue.length > 0) {
        var currNodeId = queue[0];
        queue.shift();

        nodeData[currNodeId].reachable = true;

        for (var i = 0; i < adjacencyLists[currNodeId].length; i++) {
          var linkTarget = adjacencyLists[currNodeId][i];

          // If the target node is a trunk node, but isn't at the correct depth to
          // process now, we ignore it for now and stick it back in the queue to
          // be processed later.
          if (bestPath.indexOf(linkTarget) !== -1 &&
              nodeData[linkTarget].depth !== nodeData[currNodeId].depth + 1) {
            if (seenNodes.indexOf(linkTarget) === -1 &&
                queue.indexOf(linkTarget) === -1) {
              queue.push(linkTarget);
            }
            continue;
          }

          // Assign depths and offsets to nodes only if we're processing them
          // for the first time.
          if (seenNodes.indexOf(linkTarget) === -1) {
            seenNodes.push(linkTarget);

            if (nodeData[linkTarget].depth === SENTINEL_DEPTH) {
              nodeData[linkTarget].depth = nodeData[currNodeId].depth + 1;
              nodeData[linkTarget].offset = (
                nodeData[linkTarget].depth in maxOffsetInEachLevel ?
                maxOffsetInEachLevel[nodeData[linkTarget].depth] + 1 : 0);

              maxDepth = Math.max(maxDepth, nodeData[linkTarget].depth);
              maxOffsetInEachLevel[nodeData[linkTarget].depth] = nodeData[linkTarget].offset;
            }

            if (queue.indexOf(linkTarget) === -1) {
              queue.push(linkTarget);
            }
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
          maxOffsetInEachLevel[maxDepth] += 1;
        }
      }
      if (orphanedNodesExist) {
        maxDepth++;
      }

      // Build the 'inverse index' -- for each row, store the (offset, nodeId)
      // pairs in ascending order of offset.
      var nodePositionsToIds = [];
      for (var i = 0; i <= maxDepth; i++) {
        nodePositionsToIds.push([]);
      }
      for (var nodeId in nodeData) {
        if (nodeData[nodeId].depth !== SENTINEL_DEPTH) {
          nodePositionsToIds[nodeData[nodeId].depth].push({
            offset: nodeData[nodeId].offset,
            nodeId: nodeId
          });
        }
      }
      for (var i = 0; i <= maxDepth; i++) {
        nodePositionsToIds[i].sort(function(a, b) {
          return a.offset - b.offset;
        });
      }

      // Recalculate the node depths and offsets, taking into account MAX_NODES_PER_ROW.
      // If there are too many nodes in a row, we overflow them into the next one.
      var currentDepth = 0;
      var currentLeftMargin = 0;
      var currentLeftOffset = 0;
      for (var i = 0; i <= maxDepth; i++) {
        if (nodePositionsToIds[i].length > 0) {
          // currentLeftMargin represents the offset of the leftmost node at this depth.
          // If there are too many nodes in this depth, this variable is used to figure
          // out which offset to start the continuation rows from.
          currentLeftMargin = nodePositionsToIds[i][0].offset;
          // currentLeftOffset represents the offset of the current node under
          // consideration.
          currentLeftOffset = currentLeftMargin;

          for (var j = 0; j < nodePositionsToIds[i].length; j++) {
            var computedOffset = currentLeftOffset;
            if (computedOffset >= MAX_NODES_PER_ROW) {
              currentDepth++;
              computedOffset = currentLeftMargin + 1;
              currentLeftOffset = computedOffset;
            }

            nodeData[nodePositionsToIds[i][j].nodeId].depth = currentDepth;
            nodeData[nodePositionsToIds[i][j].nodeId].offset = currentLeftOffset;

            currentLeftOffset += 1;
          }
          currentDepth++;
        }
      }

      // Calculate the width and height of each grid rectangle.
      var totalRows = currentDepth;
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
      queue = finalNodeIds;
      for (var i = 0; i < finalNodeIds.length; i++) {
        nodeData[finalNodeIds[i]].reachableFromEnd = true;
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
    controller: ['$scope', '$element', '$timeout', function($scope, $element, $timeout) {
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

            var midx = sourcex + dx/2 + dxperp*(sourceHeight/4),
                midy = sourcey + dy/2 + dyperp*(targetHeight/4),
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
          $timeout(function() {
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
          }, 10);
        }

        if ($scope.centerAtCurrentState) {
          $timeout(function() {
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
          }, 20);
        }
      };
    }]
  };
}]);
