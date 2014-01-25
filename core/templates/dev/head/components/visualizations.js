// Copyright 2012 Google Inc. All Rights Reserved.
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
    scope: {chartData: '=', chartColors: '='},
    controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
      var chart = new google.visualization.BarChart($element[0]);
      $scope.$watch($attrs.chartData, function(value) {
        value = $scope.chartData;
        if (!$.isArray(value)) {
          return;
        }
        var data = google.visualization.arrayToDataTable(value);
        var legendPosition = ($attrs.showLegend == 'false' ? 'none' : 'right');
        chart.draw(data, {
          colors: $scope.chartColors,
          isStacked: true,
          width: $attrs.width,
          height: $attrs.height,
          legend: {position: legendPosition},
          hAxis: {gridlines: {color: 'transparent'}},
          chartArea: {width: $attrs.chartAreaWidth, left:0}
        });
      });
    }]
  };
}]);

oppia.directive('stateGraphViz', ['$filter', function($filter) {
  // constants
  var i = 0;

  return {
    restrict: 'E',
    scope: {
      val: '=',
      highlightStates: '=',
      nodeFill: '@',
      opacityMap: '=',
      forbidNodeDeletion: '@',
      stateStats: '='
    },
    link: function(scope, element, attrs) {
      // The maximum number of nodes to show in a row.
      var MAX_NODES_PER_ROW = 5;

      // The following variable must be at least 3. It represents the maximum length,
      // in characters, for the name of each node label in the graph. It should not be
      // used for layout purposes.
      var MAX_NODE_LABEL_LENGTH = 20;

      scope.truncate = function(text) {
        return $filter('truncate')(text, MAX_NODE_LABEL_LENGTH);
      };

      scope.$watch('val', function (newVal, oldVal) {
        if (newVal) {
          drawGraph(
            newVal.nodes, newVal.links, newVal.initStateName, newVal.finalStateName,
            scope.nodeFill, scope.opacityMap, scope.forbidNodeDeletion,
            scope.highlightStates, scope.stateStats
          );
        }
      });

      // Returns an object representing the nodes of the graph. The keys of the
      // object are the node labels. The corresponding values are objects with
      // the following keys:
      //   - x0: the x-position of the top-left corner of the node, measured
      //       as a percentage of the total width.
      //   - y0: the y-position of the top-left corner of the node, measured
      //       as a percentage of the total height.
      //   - width: the width of the node, measured as a percentage of the total
      //       width.
      //   - height: the height of the node, measured as a percentage of the total
      //       height.
      //   - xLabel: the x-position of the middle of the box containing
      //       the node label, measured as a percentage of the total width.
      //       The node label is centered horizontally within this box.
      //   - yLabel: the y-position of the middle of the box containing
      //       the node label, measured as a percentage of the total height.
      //       The node label is centered vertically within this box.
      //   - labelWidth: the width of the label box, measured as a percentage
      //       of the total width.
      //   - labelHeight: the height of the label box, measured as a percentage
      //       of the total height.
      //   - reachable: whether there is a path from the start node to this node.
      //   - reachableFromEnd: whether there is a path from this node to the END node.
      //   - id: a unique id for the node.
      //   - name: the full name of the node.
      //   - label: the label of the node that is shown in the graph UI.
      function computeLayout(nodes, links, initStateName, finalStateName) {
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
        var totalColumns = 0;
        for (var level in maxOffsetInEachLevel) {
          totalColumns = Math.max(totalColumns, maxOffsetInEachLevel[level]);
        }
        totalColumns += 1;

        // Horizontal padding between the graph and the edge of the graph viewport,
        // measured as a percentage of the entire height.
        var HORIZONTAL_EDGE_PADDING_PERCENT = 5.0;
        // Vertical edge padding between the graph and the edge of the graph viewport,
        // measured as a percentage of the entire height.
        var VERTICAL_EDGE_PADDING_PERCENT = 5.0;

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

        // Helper function that returns a horizontal position, in terms of a percentage of
        // the total width, given a horizontal offset in terms of grid rectangles.
        function getHorizontalPosition(offsetInGridRectangles) {
          var percentageGridWidth = (100.0 - HORIZONTAL_EDGE_PADDING_PERCENT * 2) / totalColumns;
          return HORIZONTAL_EDGE_PADDING_PERCENT + percentageGridWidth * offsetInGridRectangles;
        }

        // Helper function that returns a vertical position, in terms of a percentage of
        // the total height, given a vertical offset in terms of grid rectangles.
        function getVerticalPosition(offsetInGridRectangles) {
          var percentageGridHeight = (100.0 - VERTICAL_EDGE_PADDING_PERCENT * 2) / totalRows;
          return VERTICAL_EDGE_PADDING_PERCENT + percentageGridHeight * offsetInGridRectangles;
        }

        for (var nodeName in nodeData) {
          nodeData[nodeName].y0 = getVerticalPosition(
            nodeData[nodeName].depth + GRID_NODE_Y_PADDING_FRACTION);
          nodeData[nodeName].x0 = getHorizontalPosition(
            nodeData[nodeName].offset + GRID_NODE_X_PADDING_FRACTION);

          nodeData[nodeName].yLabel = getVerticalPosition(nodeData[nodeName].depth + 0.5);
          nodeData[nodeName].xLabel = getHorizontalPosition(nodeData[nodeName].offset + 0.5);

          nodeData[nodeName].height = (
            (100.0 - VERTICAL_EDGE_PADDING_PERCENT * 2) / totalRows
          ) * (1.0 - GRID_NODE_Y_PADDING_FRACTION * 2);
          nodeData[nodeName].width = (
            (100.0 - HORIZONTAL_EDGE_PADDING_PERCENT * 2) / totalColumns
          ) * (1.0 - GRID_NODE_X_PADDING_FRACTION * 2);

          nodeData[nodeName].labelHeight = (
            (100.0 - VERTICAL_EDGE_PADDING_PERCENT * 2) / totalRows
          ) * (1.0 - GRID_NODE_Y_PADDING_FRACTION * 2 - NODE_LABEL_Y_PADDING_FRACTION * 2);
          nodeData[nodeName].labelWidth = (
            (100.0 - HORIZONTAL_EDGE_PADDING_PERCENT * 2) / totalColumns
          ) * (1.0 - GRID_NODE_X_PADDING_FRACTION * 2 - NODE_LABEL_X_PADDING_FRACTION * 2);
        }

        // Assign unique IDs to each node.
        var idCount = 0;
        var nodeList = [];
        for (var nodeName in nodeData) {
          nodeData[nodeName].id = idCount;
          nodeData[nodeName].name = nodeName;
          nodeData[nodeName].label = scope.truncate(nodeName);
          idCount++;
        }

        // Mark nodes that are reachable from the END state via backward links.
        queue = [END_DEST];
        nodeData[END_DEST].reachableFromEnd = true;
        while (queue.length > 0) {
          var currNodeName = queue[0];
          queue.shift();

          for (i = 0; i < links.length; i++) {
            if (links[i].target == currNodeName &&
                !nodeData[links[i].source].reachableFromEnd) {
              nodeData[links[i].source].reachableFromEnd = true;
              queue.push(links[i].source);
            }
          }
        }

        return nodeData;
      }

      function drawGraph(nodes, links, initStateName, finalStateName, nodeFill,
                         opacityMap, forbidNodeDeletion, highlightStates, stateStats) {
        // Clear all SVG elements on the canvas.
        d3.select(element[0]).selectAll('svg').remove();

        var nodeData = computeLayout(nodes, links, initStateName, finalStateName);

        var maxDepth = 0;
        for (var nodeName in nodeData) {
          maxDepth = Math.max(maxDepth, nodeData[nodeName].depth);
        }

        var VIEWPORT_HEIGHT = 100.0 * (maxDepth + 1);
        var VIEWPORT_WIDTH = 650.0;

        var vis = d3.select(element[0]).append('svg:svg').attr({
          'class': 'oppia-graph-viz',
          'height': VIEWPORT_HEIGHT,
          'width': VIEWPORT_WIDTH
        });

        // Change the position values in nodeData to use pixels.
        for (var nodeName in nodeData) {
          var HORIZONTAL_PROPERTIES = ['x0', 'width', 'xLabel', 'labelWidth'];
          var VERTICAL_PROPERTIES = ['y0', 'height', 'yLabel', 'labelHeight'];
          for (var i = 0; i < HORIZONTAL_PROPERTIES.length; i++) {
            nodeData[nodeName][HORIZONTAL_PROPERTIES[i]] = (
              VIEWPORT_WIDTH * nodeData[nodeName][HORIZONTAL_PROPERTIES[i]] / 100.0);
            nodeData[nodeName][VERTICAL_PROPERTIES[i]] = (
              VIEWPORT_HEIGHT * nodeData[nodeName][VERTICAL_PROPERTIES[i]] / 100.0);
          }
        }

        var augmentedLinks = [];
        for (var i = 0; i < links.length; i++) {
          augmentedLinks.push({
            source: nodeData[links[i].source],
            target: nodeData[links[i].target]
          });
        }

        vis.append('svg:defs').selectAll('marker').data(['arrowhead'])
          .enter().append('svg:marker').attr({
            'id': String,
            'viewBox': '-5 -5 18 18',
            'refX': 10,
            'refY': 6,
            'markerWidth': 6,
            'markerHeight': 9,
            'orient': 'auto'
          })
          .append('svg:path').attr({
            'd': 'M -5 0 L 12 6 L -5 12 z',
            'fill': 'grey'
          });

        var gradient = vis.selectAll('defs').selectAll('linearGradient')
            .data(['nodeGradient'])
          .enter().append('svg:linearGradient').attr({
            'id': String,
            'x1': '0%',
            'x2': '100%',
            'y1': '0%',
            'y2': '0%'
          });
        gradient.append('stop')
          .attr({'offset': '0%'})
          .style({'stop-color': nodeFill, 'stop-opacity': 1});
        gradient.append('stop')
          .attr({'offset': '100%'})
          .style({'stop-color': nodeFill, 'stop-opacity': 0.1});

        if (opacityMap) {
          var legendWidth = 210;
          var x = 450;
          var legendHeight = 0;
          var legend = vis.append('svg:rect')
            .attr({'width': legendWidth, 'x': x})
            .style({'fill': 'transparent', 'stroke': 'black'});

          vis.append('svg:rect').attr({
            'width': legendWidth - 20,
            'height': 20,
            'x': x + 10,
            'y': 10
          })
          .style({
            'stroke-width': 0.5,
            'stroke': 'black',
            'fill': 'url(#nodeGradient)'
          });

          vis.append('svg:text').text(opacityMap['legend']).attr({
            'x': x + 10,
            'y': 50
          });

          legendHeight += 70;

          legend.attr('height', legendHeight);
        }

        // Update the links.
        var linkEnter = vis.selectAll('path.link').data(augmentedLinks).enter();
        linkEnter.append('svg:g')
            .attr('class', 'link')
          .insert('svg:path', 'g')
            .style({'stroke-width': 3, 'stroke': '#b3b3b3'})
            .attr({
              'class': 'link',
              'marker-end': function(d) {
                return 'url(#arrowhead)';
              },
              'd': function(d) {
                var sourcex = d.source.xLabel;
                var sourcey = d.source.yLabel;
                var targetx = d.target.xLabel;
                var targety = d.target.yLabel;

                var sourceWidth = d.source.width;
                var sourceHeight = d.source.height;
                var targetWidth = d.target.width;
                var targetHeight = d.target.height;

                var sourceLeft = d.source.x0;

                if (d.source == d.target) {
                  return;
                }

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
                return 'M' + startx + ' ' + starty + ' Q ' + midx + ' ' + midy +
                    ' ' + endx + ' ' + endy;
              }
            });

        // Update the nodes.
        var nodeList = [];
        for (var nodeName in nodeData) {
          nodeList.push(nodeData[nodeName]);
        }
        var nodeEnter = vis.selectAll('g.node')
          .data(nodeList, function(d) { return d.id; }).enter()
          .append('svg:g').attr('class', 'node');

        nodeEnter.append('svg:rect')
          .attr({
            'rx': 4,
            'ry': 4,
            'height': function(d) { return d.height; },
            'width': function(d) { return d.width; },
            'x': function(d) { return d.x0; },
            'y': function(d) { return d.y0; },
            'class': function(d) {
              return d.name !== END_DEST ? 'clickable' : null;
            }
          })
          .style({
            'stroke': 'black',
            'stroke-width': function(d) {
              return (d.name == initStateName || d.name == END_DEST) ? '3' : '2';
            },
            'fill': function(d) {
              return (
                nodeFill ? nodeFill :
                d.name == initStateName ? 'olive' :
                d.name == END_DEST ? 'green' :
                d.reachable === false ? 'pink' :
                d.reachableFromEnd === false ? 'pink' :
                'beige'
              );
            },
            'fill-opacity': function(d) {
              return opacityMap ? opacityMap[d.name] : 0.5;
            }
          })
          .on('click', function(d) {
            if (d.name != END_DEST) {
              scope.$parent.stateName = d.name;
              if (!stateStats) {
                scope.$parent.showStateEditor(d.name);
                // The call to $apply() is needed in order to trigger the
                // tab change event on the parent controller.
                scope.$apply();
              } else {
                scope.$parent.showStateStatsModal(d.name, highlightStates[d.name]);
              }
            }
          });

        nodeEnter.append('svg:title')
          .text(function(d) {
            var warning = '';
            if (d.reachable === false) {
              warning = 'Warning: this state is unreachable.';
            } else if (d.reachableFromEnd === false) {
              warning = 'Warning: there is no path from this state to the END state.';
            }

            var tooltip = d.name;
            if (warning) {
              tooltip += ' (' + warning + ')';
            }
            return tooltip;
          });

        nodeEnter.append('svg:text')
          .text(function(d) { return d.label; })
          .attr({
            'text-anchor': 'middle',
            'x': function(d) { return d.xLabel; },
            'y': function(d) { return d.yLabel; }
          });

        if (highlightStates) {
          nodeEnter.append('svg:rect')
            .attr({
              'width': '16',
              'height': '16',
              'x': function(d) { return d.x0; },
              'y': function(d) { return d.y0; },
              'transform': function(d) {
                return 'rotate(-10,' + (d.x0 - 10) + ',' + (d.y0 - 5) + ')';
              }
            }).style({
              'fill': '#FFFFC2',
              'stroke-width': '1',
              'stroke': '#DDDDDD',
              'fill-opacity': function(d) {
                var isHighlightState = (highlightStates && d.name in highlightStates);
                var hasFeedback = (
                  stateStats && stateStats[d.name] &&
                  Object.keys(stateStats[d.name].readerFeedback).length > 0);
                return (isHighlightState || hasFeedback) ? '1' : '0' ;
              },
              'stroke-opacity': function(d) {
                var isHighlightState = (highlightStates && d.name in highlightStates);
                var hasFeedback = (
                  stateStats && stateStats[d.name] &&
                  Object.keys(stateStats[d.name].readerFeedback).length > 0);
                return (isHighlightState || hasFeedback) ? '1' : '0' ;
              }
            });

          nodeEnter.append('svg:text')
            .text(function(d) {
              var isHighlightState = (d.name in highlightStates);
              var hasFeedback = (
                stateStats && stateStats[d.name] &&
                Object.keys(stateStats[d.name].readerFeedback).length > 0);
              return (isHighlightState || hasFeedback) ? '⚠' : '' ;
            })
            .attr({
              'fill': 'firebrick',
              'text-anchor': 'middle',
              'x': function(d) { return d.x0 + 8; },
              'y': function(d) { return d.y0 + 14; },
              'transform': function(d) {
                return 'rotate(-10,' + (d.x0 - 10) + ',' + (d.y0 - 5) + ')';
              }
            }).style({
              'font-size': '16px',
            });
        }

        if (!forbidNodeDeletion) {
          // Add a 'delete node' handler.
          // TODO(sll): Do not add this handler at all for the start or END nodes.
          nodeEnter.append('svg:rect')
            .attr({
              'height': '15px',
              'width': '15px',
              'opacity': 0,  // developers: comment out this line to see the delete target
              'stroke-width': '0',
              'x': function(d) { return (d.x0 + d.width); },
              'y': function(d) { return d.y0; },
              'transform': function(d) {
                return 'translate(' + (+0) + ',' + (-15) + ')';
              },
              'class': function(d) {
                if (d.name !== initStateName && d.name !== END_DEST) {
                  return 'clickable';
                }
              }
            })
            .style('fill', 'pink')
            .on('click', function(d) {
              if (d.name !== initStateName && d.name !== END_DEST) {
                scope.$parent.deleteState(d.name);
              }
            })

          nodeEnter.append('svg:text')
            .attr({
              'dx': function(d) { return (d.x0 + d.width); },
              'dy': function(d) { return d.y0; },
              'text-anchor': 'right'
            })
            .text(function(d) {
              return (d.name !== initStateName && d.name !== END_DEST) ? 'x' : '';
            });
        }

      }
    }
  };
}]);
