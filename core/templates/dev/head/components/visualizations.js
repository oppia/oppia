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
    }]
  };
}]);

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', 5);
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
    //   - name: the full name of the node.
    //   - label: the label of the node that is shown in the graph UI.
    computeLayout: function(nodes, links, initStateName, finalStateName) {
      // In this implementation, nodes are snapped to a grid. We first compute
      // two additional internal variables for each node:
      //   - depth: its depth in the graph.
      //   - offset: its horizontal offset in the graph.
      // The depth and offset are measured in terms of grid squares.
      var SENTINEL_DEPTH = -1;
      var SENTINEL_OFFSET = -1;

      var nodeData = {};
      for (var i = 0; i < nodes.length; i++) {
        nodeData[nodes[i]] = {
          depth: SENTINEL_DEPTH,
          offset: SENTINEL_OFFSET,
          reachable: false
        };
      }

      // Do a breadth-first search to calculate the depths and offsets.
      var maxDepth = 0;
      var maxOffsetInEachLevel = {0: 0};
      nodeData[initStateName].depth = 0;
      nodeData[initStateName].offset = 0;
      var seenNodes = [initStateName];
      var queue = [initStateName];

      while (queue.length > 0) {
        var currNodeName = queue[0];
        queue.shift();

        nodeData[currNodeName].reachable = true;

        for (var i = 0; i < links.length; i++) {
          // Assign depths and offsets to nodes only when they are first encountered.
          if (links[i].source == currNodeName && seenNodes.indexOf(links[i].target) == -1) {
            seenNodes.push(links[i].target);
            nodeData[links[i].target].depth = nodeData[currNodeName].depth + 1;
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
      // TODO(sll): Consider bounding the maximum offset for these nodes based on
      // the graph computed so far, and spilling over to additional rows if
      // necessary.
      maxOffsetInEachLevel[maxDepth + 1] = 0;
      maxDepth += 1;
      for (var nodeName in nodeData) {
        if (nodeData[nodeName].depth === SENTINEL_DEPTH) {
          nodeData[nodeName].depth = maxDepth;
          nodeData[nodeName].offset = maxOffsetInEachLevel[maxDepth];
          maxOffsetInEachLevel[maxDepth] += 1;
        }
      }

      // Calculate the width and height of each grid rectangle.
      var totalRows = maxDepth + 1;
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

      for (var nodeName in nodeData) {
        nodeData[nodeName].y0 = getVerticalPosition(
          nodeData[nodeName].depth + GRID_NODE_Y_PADDING_FRACTION);
        nodeData[nodeName].x0 = getHorizontalPosition(
          nodeData[nodeName].offset + GRID_NODE_X_PADDING_FRACTION);

        nodeData[nodeName].yLabel = getVerticalPosition(nodeData[nodeName].depth + 0.5);
        nodeData[nodeName].xLabel = getHorizontalPosition(nodeData[nodeName].offset + 0.5);

        nodeData[nodeName].height = (
          (1.0 - VERTICAL_EDGE_PADDING_FRACTION * 2) / totalRows
        ) * (1.0 - GRID_NODE_Y_PADDING_FRACTION * 2);
        nodeData[nodeName].width = (
          (1.0 - HORIZONTAL_EDGE_PADDING_FRACTION * 2) / totalColumns
        ) * (1.0 - GRID_NODE_X_PADDING_FRACTION * 2);
      }

      // Assign unique IDs to each node.
      var idCount = 0;
      for (var nodeName in nodeData) {
        nodeData[nodeName].id = idCount;
        nodeData[nodeName].name = nodeName;
        nodeData[nodeName].label = $filter('truncate')(nodeName, MAX_NODE_LABEL_LENGTH);
        idCount++;
      }

      // Mark nodes that are reachable from the END state via backward links.
      queue = [END_DEST];
      nodeData[END_DEST].reachableFromEnd = true;
      while (queue.length > 0) {
        var currNodeName = queue[0];
        queue.shift();

        for (var i = 0; i < links.length; i++) {
          if (links[i].target == currNodeName &&
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
    '$filter', 'stateGraphArranger', 'MAX_NODES_PER_ROW', 'MAX_NODE_LABEL_LENGTH',
    function($filter, stateGraphArranger, MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH) {
  return {
    restrict: 'A',
    scope: {
      val: '&',
      highlightStates: '=',
      nodeFill: '@',
      opacityMap: '=',
      allowPanning: '@',
      currentStateName: '&',
      centerAtCurrentState: '@',
      onClickFunction: '=',
      onDeleteFunction: '=',
      onMaximizeFunction: '=',
      isEditable: '='
    },
    templateUrl: 'visualizations/stateGraphViz',
    controller: ['$scope', '$element', function($scope, $element) {
      var _redrawGraph = function() {
        if ($scope.val()) {
          $scope.drawGraph(
            $scope.val().nodes, $scope.val().links,
            $scope.val().initStateName, $scope.val().finalStateName
          );
        }
      };

      $scope.$watch('val()', _redrawGraph, true);
      $scope.$watch('currentStateName()', _redrawGraph);
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

        for (var nodeName in nodeData) {
          leftEdge = Math.min(nodeData[nodeName].x0 - BORDER_PADDING, leftEdge);
          topEdge = Math.min(nodeData[nodeName].y0 - BORDER_PADDING, topEdge);
          rightEdge = Math.max(
            nodeData[nodeName].x0 + BORDER_PADDING + nodeData[nodeName].width,
            rightEdge);
          bottomEdge = Math.max(
            nodeData[nodeName].y0 + BORDER_PADDING + nodeData[nodeName].height,
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

      $scope.drawGraph = function(nodes, links, initStateName, finalStateName) {
        var nodeData = stateGraphArranger.computeLayout(
          nodes, links, initStateName, finalStateName);

        var maxDepth = 0;
        for (var nodeName in nodeData) {
          maxDepth = Math.max(maxDepth, nodeData[nodeName].depth);
        }
        $scope.GRAPH_HEIGHT = 80.0 * (maxDepth + 1);

        var dimensions = _getElementDimensions();

        // Change the position values in nodeData to use pixels.
        for (var nodeName in nodeData) {
          for (var i = 0; i < HORIZONTAL_NODE_PROPERTIES.length; i++) {
            nodeData[nodeName][HORIZONTAL_NODE_PROPERTIES[i]] = (
              $scope.GRAPH_WIDTH * nodeData[nodeName][HORIZONTAL_NODE_PROPERTIES[i]]);
            nodeData[nodeName][VERTICAL_NODE_PROPERTIES[i]] = (
              $scope.GRAPH_HEIGHT * nodeData[nodeName][VERTICAL_NODE_PROPERTIES[i]]);
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

        // The translation applied when the graph is first loaded.
        var originalTranslationAmounts = [0, 0];
        $scope.overallTransformStr = 'translate(0,0)';
        $scope.innerTransformStr = 'translate(0,0)';
        if ($scope.centerAtCurrentState) {
          // Center the graph at the node representing the current state.
          originalTranslationAmounts[0] = (
            dimensions.w / 2 - nodeData[$scope.currentStateName()].x0 -
            nodeData[$scope.currentStateName()].width / 2);
          originalTranslationAmounts[1] = (
            dimensions.h / 2 - nodeData[$scope.currentStateName()].y0 -
            nodeData[$scope.currentStateName()].height / 2);

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
          $scope.innerTransformStr = 'translate(0,0)';
        }

        if ($scope.allowPanning) {
          // Without the timeout, $element.find fails to find the required rect in the
          // state graph modal dialog.
          setTimeout(function() {
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

        $scope.augmentedLinks = links.map(function(link) {
          return {
            source: angular.copy(nodeData[link.source]),
            target: angular.copy(nodeData[link.target])
          };
        });

        for (var i = 0; i < $scope.augmentedLinks.length; i++) {
          var link = $scope.augmentedLinks[i];
          if (link.source.name !== link.target.name) {
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
          }
        }

        var _getNodeStrokeWidth = function(nodeName) {
          return nodeName == $scope.currentStateName() ? '4' :
                 (nodeName == initStateName || nodeName == END_DEST) ? '2' : '1';
        };

        var _getNodeFillOpacity = function(nodeName) {
          return $scope.opacityMap ? $scope.opacityMap[nodeName] : 0.5;
        };

        $scope.isStateFlagged = function(nodeName) {
          return $scope.highlightStates && $scope.highlightStates.hasOwnProperty(nodeName);
        };

        $scope.getNodeTitle = function(node) {
          var warning = '';
          if (node.reachable === false) {
            warning = 'Warning: this state is unreachable.';
          } else if (node.reachableFromEnd === false) {
            warning = 'Warning: there is no path from this state to the END state.';
          }

          var tooltip = node.name;
          if (warning) {
            tooltip += ' (' + warning + ')';
          }
          return tooltip;
        };

        $scope.onNodeDeletionClick = function(nodeName) {
          if (nodeName !== initStateName && nodeName !== END_DEST) {
            $scope.onDeleteFunction(nodeName);
          }
        };

        $scope.getHighlightTransform = function(x0, y0) {
          return 'rotate(-10,' + (x0 - 10) + ',' + (y0 - 5) + ')';
        };

        $scope.getHighlightTextTransform = function(x0, y0) {
          return 'rotate(-10,' + x0 + ',' + (y0 - 4) + ')';
        };

        $scope.canNavigateToNode = function(nodeName) {
          return nodeName !== END_DEST && nodeName !== $scope.currentStateName();
        };

        // Update the nodes.
        $scope.nodeList = [];
        for (var nodeName in nodeData) {
          nodeData[nodeName].style = (
            'stroke-width: ' + _getNodeStrokeWidth(nodeName) + '; ' +
            'fill-opacity: ' + _getNodeFillOpacity(nodeName) + ';');

          if ($scope.nodeFill) {
            nodeData[nodeName].style += ('fill: ' + $scope.nodeFill + '; ');
          }

          nodeData[nodeName].isInitNode = (nodeName === initStateName);
          nodeData[nodeName].isEndNode = (nodeName === END_DEST);
          nodeData[nodeName].isBadNode = (
            nodeName !== initStateName && nodeName !== END_DEST &&
            !(nodeData[nodeName].reachable && nodeData[nodeName].reachableFromEnd));
          nodeData[nodeName].isNormalNode = (
            nodeName !== initStateName && nodeName !== END_DEST &&
            nodeData[nodeName].reachable && nodeData[nodeName].reachableFromEnd);

          nodeData[nodeName].canDelete = (nodeName !== initStateName && nodeName !== END_DEST);
          $scope.nodeList.push(nodeData[nodeName]);
        }
      }
    }]
  };
}]);
