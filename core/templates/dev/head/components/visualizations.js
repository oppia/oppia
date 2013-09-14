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

oppia.directive('barChart', function() {
  return {
    restrict: 'E',
    scope: {chartData: '=', chartColors: '='},
    controller: function($scope, $element, $attrs) {
      var chart = new google.visualization.BarChart($element[0]);
      $scope.$watch($attrs.chartData, function(value) {
        value = $scope.chartData;
        if (!$.isArray(value)) {
          return;
        }
        var data = google.visualization.arrayToDataTable(value);
        var legendPosition = 'right';
        if ($attrs.showLegend == 'false') {
          legendPosition = 'none';
        }
        var options =  {
          title: $attrs.chartTitle,
          colors: $scope.chartColors,
          isStacked: true,
          width: $attrs.width,
          height: $attrs.height,
          legend: {position: legendPosition},
          hAxis: {gridlines: {color: 'transparent'}},
          chartArea: {width: $attrs.chartAreaWidth, left:0}
        };
        chart.draw(data, options);
      });
    }
  };
});

oppia.directive('stateGraphViz', function(explorationData, $filter) {
  // constants
  var i = 0;
  var NODE_PADDING_X = 8;
  // The following variable must be at least 3.
  var MAX_NODE_LABEL_LENGTH = 20;

  var getTextWidth = function(text) {
    return 40 + Math.min(MAX_NODE_LABEL_LENGTH, text.length) * 5;
  };

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
      scope.truncate = function(text) {
        return $filter('truncate')(text, MAX_NODE_LABEL_LENGTH);
      };

      var height = 0;
      var width = 0;

      scope.$watch('val', function (newVal, oldVal) {
        if (newVal) {
          drawGraph(newVal.nodes, newVal.links, newVal.initStateId,
                    scope.nodeFill, scope.opacityMap, scope.forbidNodeDeletion,
                    scope.highlightStates, scope.stateStats);
          for (var i = 0; i < document.getElementsByClassName('oppia-graph-viz').length; ++i) {
            document.getElementsByClassName('oppia-graph-viz')[i].style.height = height;
            document.getElementsByClassName('oppia-graph-viz')[i].style.width = width > 680 ? width : 680;
          }
        }
      });

      function addPopup(vis, expId, stateId, stateName, stats, improvementType) {
        var modal = d3.select(element[0]).append('div')
          .attr('class', 'modal')
          .attr('aria-hidden', 'false')
          .attr('id','infoModal')
          .style('top', '400px');
        var header =  modal.append('div')
          .attr('class', 'modal-header');
        header.append('button')
          .attr('class', 'close')
          .attr('data-dismiss', 'modal')
          .attr('aria-hidden', 'true')
          .html('&times;')
          .on('click', function (d) {
            modal.remove() 
          });

        header.append('h3')
          .attr('class', 'customizeModalLabel')
          .text('Statistics for ' + stateName);
        var body = modal.append('div')
          .attr('class', 'modal-body');
        if (improvementType) {
          var CONFUSING_EXPLANATION = 'Students often leave the page when they get ' +
              'to this state -- this could mean the non-interactive content didn\'t ' +
              'make sense, so they didn\'t know how to respond to it.';
          var NEED_FEEDBACK_EXPLANATION = 'Students often return to this state ' +
              'after giving an answer -- this could mean that the feedback they are ' +
              'getting is insufficient to help them learn.';

          var improvementExplanation = (
              improvementType == 'May be confusing' ?
              CONFUSING_EXPLANATION : NEED_FEEDBACK_EXPLANATION);

          var improvementDiv = body.append('div')
            .text("It looks like this state " + improvementType.toLowerCase());
          improvementDiv.append('img')
            .attr('class', 'oppia-help')
            .attr('src', '/images/help.png')
            .attr('ui-jq', 'tooltip')
            .attr('title', improvementExplanation)
            .style('margin-left', '5px');
        }
        body.append('div')
          .style('font-weight', 'bold')
          .text('Times hit:')
          .append('span')
            .style('font-weight', 'normal')
            .style('margin-left', '5px')
            .text(stats.totalEntryCount);
        var showTitle = false;
        var title = body.append('div')
          .style('font-weight', 'bold')
          .text('Answers:');
        var ruleList = body.append('ul')
        for(rule in stats.rule_stats) {
          if (stats.rule_stats[rule].answers.length == 0) {
            continue;
          }
          showTitle = true;
          var answerList = ruleList.append('li')
            .attr('text-anchor', 'start')
            .text(rule)
            .append('ul');
          for (ans in stats.rule_stats[rule].answers) {
            var answer = stats.rule_stats[rule].answers[ans][0];
            var count = stats.rule_stats[rule].answers[ans][1];
            answerList.append('li')
              .text(answer + " (" + count  + " time" + (count > 1 ? "s" : "") + ")")
              .append('a')
                .style('font-weight', 'normal')
                .style('font-size', '12px')
                .style('margin-left', '5px')
                .attr('href', expId + '#/gui/' + stateId + '?scrollTo=rules')
                .text('Add a rule for this answer');
          }
        }       
        if (!showTitle) {
          if (stats.totalEntryCount) {
            body.append('i')
              .text('No students gave answers')
              .append('a')
                .style('font-weight', 'normal')
                .style('font-size', '12px')
                .style('font-style', 'normal')
                .style('margin-left', '5px')
                .attr('href', expId + '#/gui/' + stateId + '?scrollTo=noninteractive')
                .text('Edit non-interactive content');
          }
          title.remove();
        }
        var footer = modal.append('div')
          .attr('class', 'modal-footer');
        footer.append('a')
          .attr('class', 'btn')
          .attr('data-dismiss', 'modal')
          .text('Close')
          .on('click', function (d) {modal.remove() });
      }

      function drawGraph(nodes, links, initStateId, nodeFill, opacityMap, forbidNodeDeletion, highlightStates, stateStats) {
        height = 0;
        width = 0;

        // Clear existing SVG elements on the graph visualization canvas.
        d3.select(element[0]).selectAll('svg').remove();

        var vis = d3.select(element[0]).append('svg:svg')
            .attr('class', 'oppia-graph-viz')
            .attr('width', 680);

        // Update the links
        var link = vis.selectAll('path.link')
            .data(links);

        vis.append('svg:defs').selectAll('marker')
            .data(['arrowhead'])
          .enter().append('svg:marker')
            .attr('id', String)
            .attr('viewBox', '-5 -5 18 18')
            .attr('refX', 10)
            .attr('refY', 6)
            .attr('markerWidth', 6)
            .attr('markerHeight', 9)
            .attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M -5 0 L 12 6 L -5 12 z')
            .attr('fill', 'grey');
     
       var gradient = vis.selectAll('defs').selectAll('linearGradient')
           .data(['nodeGradient'])
         .enter().append('svg:linearGradient')
           .attr('id', String)
           .attr('x1', '0%')
           .attr('x2', '100%')
           .attr('y1', '0%')
           .attr('y2', '0%');
       gradient.append('stop')
           .attr('offset', '0%')
           .style('stop-color', nodeFill)
           .style('stop-opacity', 1);
       gradient.append('stop')
           .attr('offset', '100%')
           .style('stop-color', nodeFill)
           .style('stop-opacity', 0.1);

        if (opacityMap || highlightStates) {
            var wth = 200;
            var x = 450;
            var legendHeight = 0;
            var legend = vis.append('svg:rect')
              .attr('width', wth)
              .attr('x', x)
              .style('fill', 'transparent')
              .style('stroke', 'black');
            if (opacityMap) {
              vis.append('svg:rect')
                .attr('width', wth - 20)
                .attr('height', 20)
                .attr('x', x + 10)
                .attr('y', 10)
                .style('stroke-width', 0.5)
                .style('stroke', 'black')
                .style('fill', 'url(#nodeGradient)');
              vis.append('svg:text')
                .text(opacityMap['legend'])
                .attr('x', x + 10)
                .attr('y', 50);
              legendHeight += 70;
            }
            if (highlightStates) {
              var legendData = highlightStates['legend'].split(',');
              for (var i = 0; i < legendData.length; i++) {
                 legendHeight += 40;
                 var color = legendData[i].split(':')[0];
                 var desc = legendData[i].split(':')[1];
                 var leg_y;
                 if (opacityMap) {
                   leg_y = 70;
                 } else {
                   leg_y = 10;
                 }
                 leg_y += (i * 40);
                 vis.append('svg:rect')
                  .attr('height', 30)
                  .attr('width', 30)
                  .attr('rx', 4)
                  .attr('ry', 4)
                  .attr('x', x + 10)
                  .attr('y', leg_y)
                  .style('stroke', color)
                  .style('fill', 'transparent')
                  .style('stroke-width', 3);
                 vis.append('svg:text')
                  .text(desc)
                  .attr('x', x + 50)
                  .attr('y', leg_y + 17);
              }
            }
            legend.attr('height', legendHeight);
        }
        var linkEnter = link.enter().append('svg:g')
            .attr('class', 'link');

        linkEnter.insert('svg:path', 'g')
            .style('stroke-width', 3)
            .style('stroke', '#b3b3b3')
            .attr('class', 'link')
            .attr('d', function(d) {
              var sourceWidth = getTextWidth(d.source.name);
              var targetWidth = getTextWidth(d.target.name);

              var sourcex = d.source.x0 + sourceWidth/2;
              var sourcey = d.source.y0 + 20;
              var targetx = d.target.x0 + targetWidth/2;
              var targety = d.target.y0 + 20;

              if (d.source == d.target) {
                return 'M' + (sourcex - sourceWidth/4)  + ',' + (sourcey + 20) +
                       'A' + (sourceWidth/4) + ',20 0 1,1' +
                       (sourcex-10-sourceWidth/2) + ' ' + sourcey;
              }

              var dx = targetx - sourcex,
                  dy = targety - sourcey;

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

              var dxperp = targety - sourcey,
                  dyperp = sourcex - targetx,
                  norm = Math.sqrt(dxperp*dxperp + dyperp*dyperp);
              dxperp /= norm;
              dyperp /= norm;

              var midx = sourcex + dx/2 + dxperp*20,
                  midy = sourcey + dy/2 + dyperp*20,
                  startx = sourcex + startCutoff*dx,
                  starty = sourcey + startCutoff*dy,
                  endx = targetx - endCutoff*dx,
                  endy = targety - endCutoff*dy;

              // Draw a quadratic bezier curve.
              return 'M' + startx + ' ' + starty + ' Q ' + midx + ' ' + midy +
                  ' ' + endx + ' ' + endy;
            })
            .attr('marker-end', function(d) {
              return 'url(#arrowhead)';
            });

        // Update the nodes
        // TODO(sll): Put a blue border around the current node.
        var node = vis.selectAll('g.node')
            .data(nodes, function(d) { return d.id; });

        var nodeEnter = node.enter().append('svg:g')
            .attr('class', 'node');

        // Add nodes to the canvas.
        nodeEnter.append('svg:rect')
            .attr('x', function(d) {
              width = width > d.x0 + 200 ? width: d.x0 + 200;
              return d.x0 - NODE_PADDING_X;
            })
            .attr('y', function(d) {
              height = height > d.y0 + 100 ? height : d.y0 + 100;
              return d.y0;
            })
            .attr('ry', function(d) { return 4; })
            .attr('rx', function(d) { return 4; })
            .attr('width', function(d) {
               return getTextWidth(d.name) + 2*NODE_PADDING_X; })
            .attr('height', function(d) { return 40; })
            .attr('class', function(d) {
              return d.hashId != END_DEST ? 'clickable' : null; })
            .style('stroke', function(d) {
              return (highlightStates? (
                  d.hashId in highlightStates ? highlightStates[d.hashId] : '#CCCCCC'
              ) : 'black');
            })
            .style('stroke-width', function(d) {
              return (d.hashId == initStateId || d.hashId == END_DEST || highlightStates) ? '3' : '2';
            })
            .style('fill', function(d) {
              if (nodeFill) {
                return nodeFill;
              } else {
                return (
                  d.hashId == initStateId ? 'olive' :
                  d.hashId == END_DEST ? 'green' :
                  d.reachable === false ? 'pink' :
                  d.reachableFromEnd === false ? 'pink' :
                  'beige'
                );
              }
            })
            .style('fill-opacity', function(d) {
              return opacityMap ? opacityMap[d.hashId] : 0.5;
            })
            .on('click', function (d) {
              if (d.hashId != END_DEST) {
                explorationData.getStateData(d.hashId);
                scope.$parent.$parent.stateId = d.hashId;
                if (!stateStats) {
                  $('#editorViewTab a[href="#stateEditor"]').tab('show');     
                } else {
                  var legendList = highlightStates['legend'].split(',');
                  var improvementType = "";
                  for (index in legendList) {
                    if (legendList[index].indexOf(highlightStates[d.hashId]) == 0) {
                      improvementType = legendList[index].split(':')[1];
                      break;
                    }
                  }
                  addPopup(vis, explorationData.data.exploration_id, d.hashId, d.name, stateStats[d.hashId], improvementType);
                }
              };
            })
            .append('svg:title')
            .text(function(d) {
              var warning = '';
              if (d.reachable === false) {
                warning = 'Warning: this state is unreachable.';
              } else if (d.reachableFromEnd === false) {
                warning = 'Warning: there is no path from this state to the END state.';
              }

              var label = d.name;
              if (warning) {
                label += ' (' + warning + ')';
              }
              return label;
            });

        nodeEnter.append('svg:text')
            .attr('text-anchor', 'middle')
            .attr('x', function(d) { return d.x0 + (getTextWidth(d.name) / 2); })
            .attr('y', function(d) { return d.y0 + 25; })
            .text(function(d) { return scope.truncate(d.name); });

        if (!forbidNodeDeletion) {
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
                if (d.hashId != initStateId && d.hashId != END_DEST) {
                  scope.$parent.openDeleteStateModal(d.hashId);
                }
              });

          nodeEnter.append('svg:text')
              .attr('text-anchor', 'right')
              .attr('dx', function(d) { return d.x0 + getTextWidth(d.name) -10; })
              .attr('dy', function(d) { return d.y0 + 10; })
              .text(function(d) {
                return (d.hashId != initStateId && d.hashId != END_DEST) ? 'x' : '';
              });
        }
      }
    }
  };
});
