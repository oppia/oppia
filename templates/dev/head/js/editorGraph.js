// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Angular controllers for the editor's state graph.
 *
 * @author sll@google.com (Sean Lip)
 */

function EditorGraph($scope, $http, explorationData) {
  // When the exploration data is loaded, construct the graph.
  $scope.$on('explorationData', function() {
    $scope.graphData = $scope.reformatResponse(
        explorationData.states, explorationData.initState);
  });

  // Reformat the model into a response that is processable by d3.js.
  $scope.reformatResponse = function(states, initStateId) {
    var nodes = {};
    for (var state in states) {
      nodes[state] = {name: states[state].desc};
    }
    nodes[initStateId].depth = 0;

    var maxLevel = 0;
    var seenNodes = [initStateId];
    var queue = [initStateId];
    var HORIZ_SPACING = 100;
    var VERT_SPACING = 200;
    var maxXDistPerLevel = {0: 50};
    nodes[initStateId].y0 = 0;
    nodes[initStateId].x0 = 50;

    while (queue.length > 0) {
      var currNode = queue[0];
      queue.shift();
      if (currNode in states) {
        for (var i = 0; i < states[currNode].dests.length; i++) {
          // Assign levels to nodes only when they are first encountered.
          if (seenNodes.indexOf(states[currNode].dests[i].dest) == -1) {
            seenNodes.push(states[currNode].dests[i].dest);
            nodes[states[currNode].dests[i].dest].depth = nodes[currNode].depth + 1;
            nodes[states[currNode].dests[i].dest].y0 = nodes[currNode].y0 + VERT_SPACING;
            if (nodes[currNode].depth + 1 in maxXDistPerLevel) {
              nodes[states[currNode].dests[i].dest].x0 = maxXDistPerLevel[nodes[currNode].depth + 1] + HORIZ_SPACING;
              maxXDistPerLevel[nodes[currNode].depth + 1] += HORIZ_SPACING;
            } else {
              nodes[states[currNode].dests[i].dest].x0 = 50;
              maxXDistPerLevel[nodes[currNode].depth + 1] = 50;
            }
            maxLevel = Math.max(maxLevel, nodes[currNode].depth + 1);
            queue.push(states[currNode].dests[i].dest);
          }
        }
      }
    }

    var idCount = 0;
    var nodeList = [];
    for (var node in nodes) {
      var nodeMap = nodes[node];
      nodeMap['hashId'] = node;
      nodeMap['id'] = idCount;
      nodes[node]['id'] = idCount;
      idCount++;
      nodeList.push(nodeMap);
    }

    console.log(nodes);

    var links = [];
    for (var state in states) {
      for (var i = 0; i < states[state].dests.length; i++) {
        links.push({source: nodeList[nodes[state].id], target: nodeList[nodes[states[state].dests[i].dest].id], name: states[state].dests[i].category});
      }
    }
    console.log(links);

    return {nodes: nodeList, links: links};
  };
};


oppia.directive('stateGraphViz', function (stateDataFactory) {
  // constants
  var w = 960,
      h = 400,
      i = 0,
      duration = 400;

  return {
    restrict: 'E',
    scope: {
      val: '=',
      grouped: '='
    },
    link: function (scope, element, attrs) {
      var vis = d3.select(element[0]).append("svg:svg")
          .attr("width", w)
          .attr("height", h)
        .append("svg:g")
          .attr("transform", "translate(20,30)");

      scope.$watch('val', function (newVal, oldVal) {
        // clear the elements inside of the directive
        vis.selectAll('*').remove();

        // if 'val' is undefined, exit
        if (!newVal) {
          return;
        }

        var source = newVal;
        var nodes = source.nodes;
        var links = source.links;


        // Update the links…
        var link = vis.selectAll("path.link")
            .data(links, function(d) { console.log(d); return d; });

        vis.append("svg:defs").selectAll('marker')
            .data(['arrowhead'])
          .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
          .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "red");

        var linkEnter = link.enter().append("svg:g")
            .attr("class", "link");

        linkEnter.insert("svg:path", "g")
            .style("stroke-width", 3)
            .style("stroke", "red")
            .attr("class", "link")
            .attr("d", function(d) {
              // Uncomment the following if self-edges should be displayed.
              /*
              if (d.source.x0 == d.target.x0 && d.source.y0 == d.target.y0) {
                return circle(d3.range(50));
              }
              */

              // Elliptical arcs.
              var dx = d.target.x0 - d.source.x0,
                  dy = d.target.y0 - d.source.y0,
                  dr = Math.sqrt(dx * dx + dy * dy);
              return "M" + d.source.x0 + "," + d.source.y0 + "A" + dr + "," + dr + " 0 0,1 " + d.target.x0 + "," + d.target.y0;
            })
            .attr("transform", function(d) {
              if (d.source.x0 == d.target.x0 && d.source.y0 == d.target.y0) {
                return "translate(" + (d.source.x0) + ", " + (d.source.y0 + radius) + ")";
              }
            })
            .attr("marker-end", function(d) {
              if (d.source.x0 == d.target.x0 && d.source.y0 == d.target.y0) {
                return '';
              } else {
                return "url(#arrowhead)";
              }
            });

        linkEnter.append("svg:text")
            .attr("dy", function(d) { return d.source.y0*0.5 + d.target.y0*0.5; })
            .attr("dx", function(d) { return d.source.x0*0.5 + d.target.x0*0.5; })
            .attr('color', 'black')
            .text(function(d) {
              if (d.source.x0 == d.target.x0 && d.source.y0 == d.target.y0) {
                return '';
              }
              return d.name;
            });




        // Update the nodes…
        var node = vis.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        var nodeEnter = node.enter().append("svg:g")
            .attr("class", "node");

        // Enter any new nodes at the parent's previous position.
        nodeEnter.append("svg:circle")
            .attr("cy", function(d) { return d.y0; })
            .attr("cx", function(d) { return d.x0; })
            .attr("r", 30)
            .style("fill", function(d) {
              return "beige";
            })
            .on("click", function (d) {
              $('#editorViewTab a[href="#stateEditor"]').tab('show');
              stateDataFactory.getData(d.hashId);
            });

        nodeEnter.append("svg:text")
            .attr("dy", function(d) { return d.y0; })
            .attr("dx", function(d) { return d.x0; })
            .text(function(d) { return d.name; });

        // Parameters for drawing a circle.
        var radius = 40;
        var angle = d3.scale.linear()
            .domain([0, 49])
            .range([0, 2 * Math.PI]);
        var circle = d3.svg.line.radial()
            .interpolate("basis")
            .tension(0)
            .radius(radius)
            .angle(function(d, i) { return angle(i); });

      });
    }
  }
});

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorGraph.$inject = ['$scope', '$http', 'explorationDataFactory'];
