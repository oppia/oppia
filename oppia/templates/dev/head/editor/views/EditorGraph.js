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
 * @fileoverview Controllers for the editor's state graph.
 *
 * @author sll@google.com (Sean Lip)
 */

function EditorGraph($scope, $filter, explorationData) {
  $scope.updateViz = function() {
    explorationData.getData().then(function(data) {
    });
  };

  // At the start, update the graph.
  $scope.updateViz();

  // Also update the graph when an update event is broadcast.
  $scope.$on('updateViz', $scope.updateViz);
}


oppia.directive('stateGraphViz', function(explorationData) {
  // constants
  var w = 960,
      h = 4000,
      i = 0;
  var NODE_PADDING_X = 8;
  // The following variable must be at least 3.
  var MAX_CATEGORY_LENGTH = 20;

  var getTextWidth = function(text) {
    return 40 + Math.min(MAX_CATEGORY_LENGTH, text.length) * 5;
  };

  return {
    restrict: 'E',
    scope: {
      val: '=',
      grouped: '=',
      stats: '='
    },
    link: function(scope, element, attrs) {
      scope.truncate = function(text) {
        if (text.length > MAX_CATEGORY_LENGTH) {
          return text.substring(0, MAX_CATEGORY_LENGTH - 3) + '...';
        } else {
          return text;
        }
      };

      var vis = d3.select(element[0]).append('svg:svg')
          .attr('height', h)
          .attr('class', 'oppia-graph-viz')
        .append('svg:g')
          .attr('transform', 'translate(20,30)');


      scope.$watch('val', function (newVal, oldVal) {
        // if 'val' is undefined, exit
        if (!newVal) {
          return;
        }

        var source = newVal;
        var nodes = source.nodes;
        var links = source.links;
        var initStateId = source.initStateId;
        create(nodes, links, initStateId, scope.stats);
      });

      scope.$watch('stats', function(newVal, oldVal) {
        if (!scope.val) {
          return;
        }
        create(scope.val.nodes, scope.val.links, scope.val.initStateId, newVal);
      });

      function create(nodes, links, initStateId, stats) {
        // clear the elements inside of the directive
        vis.selectAll('*').remove();


        // Update the links
        var link = vis.selectAll('path.link')
            .data(links);

        vis.append('svg:defs').selectAll('marker')
            .data(['arrowhead'])
          .enter().append('svg:marker')
            .attr('id', String)
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 10)
            .attr('refY', 5)
            .attr('markerWidth', 6)
            .attr('markerHeight', 4.5)
            .attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 z')
            .attr('fill', 'black');

        var linkEnter = link.enter().append('svg:g')
            .attr('class', 'link');

        linkEnter.insert('svg:path', 'g')
            .style('stroke-width', 3)
            .style('stroke', 'grey')
            .attr('opacity', 0.6)
            .attr('class', 'link')
            .attr('d', function(d) {
              var sourceWidth = getTextWidth(d.source.name);
              var targetWidth = getTextWidth(d.target.name);

              var sourcex = d.source.x0 + sourceWidth/2;
              var sourcey = d.source.y0 + 20;
              var targetx = d.target.x0 + targetWidth/2;
              var targety = d.target.y0 + 20;

              if (d.source == d.target) {
                return 'M' + sourcex + ' ' + sourcey;
              }

              var dx = targetx - sourcex;
              var dy = targety - sourcey;

              /* Fractional amount of truncation to be applied to the end of
                 each link. */
              var startCutoff = (sourceWidth/2)/Math.abs(dx);
              var endCutoff = (targetWidth/2)/Math.abs(dx);
              if (dx === 0 || dy !== 0) {
                startCutoff = (dx === 0) ? 20.0/Math.abs(dy) : Math.min(
                    startCutoff, 20.0/Math.abs(dy));
                endCutoff = (dx === 0) ? 20.0/Math.abs(dy) : Math.min(
                    endCutoff, 20.0/Math.abs(dy));
              }

              var dxperp = targety - sourcey;
              var dyperp = sourcex - targetx;
              var norm = Math.sqrt(dxperp*dxperp + dyperp*dyperp);
              dxperp /= norm;
              dyperp /= norm;

              var midx = sourcex + dx/2 + dxperp*20;
              var midy = sourcey + dy/2 + dyperp*20;

              var startx = sourcex + startCutoff*dx;
              var starty = sourcey + startCutoff*dy;
              var endx = targetx - endCutoff*dx;
              var endy = targety - endCutoff*dy;

              // Draw a quadratic bezier curve.
              return 'M' + startx + ' ' + starty + ' Q ' + midx + ' ' + midy +
                  ' ' + endx + ' ' + endy;
            })
            .attr('marker-end', function(d) {
              if (d.source.x0 == d.target.x0 && d.source.y0 == d.target.y0) {
                return '';
              } else {
                return 'url(#arrowhead)';
              }
            });

        // Update the nodes
        // TODO(sll): Put a blue border around the current node.
        var node = vis.selectAll('g.node')
            .data(nodes, function(d) { return d.id; });

        var nodeEnter = node.enter().append('svg:g')
            .attr('class', 'node');

        // Add nodes to the canvas.
        nodeEnter.append('svg:rect')
            .attr('x', function(d) { return d.x0 - NODE_PADDING_X; })
            .attr('y', function(d) { return d.y0; })
            .attr('ry', function(d) { return 4; })
            .attr('rx', function(d) { return 4; })
            .attr('width', function(d) { return getTextWidth(d.name) + 2*NODE_PADDING_X; })
            .attr('height', function(d) { return 40; })
            .attr('class', function(d) {
              if (d.hashId != END_DEST) {
                return 'clickable';
              }
            })
            .style('stroke', 'black')
            .style('stroke-width', function(d) {
              if (d.hashId == initStateId || d.hashId == END_DEST) {
                return '3';
              }
              return '2';
            })
            .style('fill', function(d) {
              if (stats) {
                return 'green';
              }
              if (d.hashId == initStateId) {
                return 'olive';
              } else if (d.hashId == END_DEST) {
                return 'green';
              } else if (d.reachable === false) {
                return 'pink';
              } else {
                return 'beige';
              }
            })
            .style('opacity', function(d) {
              if (!stats) {
                return 1;
              } else {
                 var percent;
                 if (d.hashId == END_DEST) {
                   percent = stats.numCompletions / stats.numVisits;
                 } else {
                   percent = stats.stateStats[d.hashId].count / stats.numVisits;
                 }
                 if (percent < .05) {
                   return .05;
                 }
                 return percent;
              }
            })
            .on('click', function (d) {
              if (d.hashId == END_DEST) {
                return;
              }
              explorationData.getStateData(d.hashId);
              scope.$parent.$parent.stateId = d.hashId;
              $('#editorViewTab a[href="#stateEditor"]').tab('show');
            })
            .append('svg:title')
            .text(function(d) { return d.name; });

        nodeEnter.append('svg:text')
            .attr('text-anchor', 'middle')
            .attr('x', function(d) { return d.x0 + (getTextWidth(d.name) / 2); })
            .attr('y', function(d) { return d.y0 + 25; })
            .text(function(d) { return scope.truncate(d.name); });

        if (!stats) {
          // Add a 'delete node' handler.
          nodeEnter.append('svg:rect')
              .attr('y', function(d) { return d.y0; })
              .attr('x', function(d) { return d.x0; })
              .attr('height', 20)
              .attr('width', 20)
              .attr('opacity', 0) // comment out this line to see the delete target
              .attr('transform', function(d) {
                return 'translate(' + (getTextWidth(d.name) - 15) + ',' + (+0) + ')'; }
              )
              .attr('stroke-width', '0')
              .style('fill', 'pink')
              .on('click', function (d) {
                if (d.hashId == initStateId || d.hashId == END_DEST) {
                  return;
                }
                scope.$parent.$parent.openDeleteStateModal(d.hashId);
              });

          nodeEnter.append('svg:text')
              .attr('text-anchor', 'right')
              .attr('dx', function(d) { return d.x0 + getTextWidth(d.name) -10; })
              .attr('dy', function(d) { return d.y0 + 10; })
              .text(function(d) {
                if (d.hashId == initStateId || d.hashId == END_DEST) {
                  return;
                }
                return 'x';
              });
        }
      }
    }
  };
});

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorGraph.$inject = ['$scope', '$filter', 'explorationData'];
