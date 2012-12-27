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
    $scope.data = $scope.reformatResponse(
        explorationData.states, explorationData.initState);
  });

  $scope.dfs = function(currStateId, seen, states) {
    var thisState = {'name': states[currStateId].desc, 'children': []};
    for (var i = 0; i < states[currStateId].dests.length; ++i) {
      var destStateId = states[currStateId].dests[i].dest;
      var category = states[currStateId].dests[i].category;
      if (destStateId == '-1') {
        thisState['children'].push(
            {'name': category + ': END'});
      } else if (seen[destStateId]) {
        thisState['children'].push(
            {'name': category + ': ' + states[destStateId].desc, 'size': 100});
      } else {
        seen[destStateId] = true;
        thisState['children'].push(
            {'name': category + ': ' + states[destStateId].desc,
             'children': $scope.dfs(destStateId, seen, states)});
      }
    }
    return thisState;
  };

  // Reformat the model into a response that is processable by d3.js.
  $scope.reformatResponse = function(states, initState) {
    var seen = {};
    seen[initState] = true;

    var NODES = $scope.dfs(initState, seen, states);
    $scope.NODES = $.extend(true, {}, NODES);
    return NODES;


    var nodes = {'END': {name: 'END'}};
    for (var state in states) {
      nodes[states[state].desc] = {name: states[state].desc};
    }
    var links = [];
    for (var state in states) {
      for (var i = 0; i < states[state].dests.length; ++i) {
        var link = states[state].dests[i];
        links.push({
            source: nodes[states[state].desc],
            target: nodes[link.dest === '-1' ? 'END' : states[link.dest].desc],
            type: link.category});
      }
    }
    return {nodes: nodes, links: links};
  };
};


oppia.directive('stateGraphViz', function () {
  // constants
  var w = 960,
      h = 800,
      barHeight = 20,
      barWidth = w * .8,
      i = 0,
      duration = 400;

  return {
    restrict: 'E',
    scope: {
      val: '=',
      grouped: '='
    },
    link: function (scope, element, attrs) {

      // Simple template for a force-directed graph, from http://bl.ocks.org/d/1153292/
      // set up initial svg object
 /*     var svg = d3.select(element[0])
          .append('svg:svg')
          .attr('width', w)
          .attr('height', h);
*/
      var tree = d3.layout.tree().size([h, 100]);
      var diagonal = d3.svg.diagonal()
          .projection(function(d) { return [d.y, d.x]; });

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
        var root = source;
  // Compute the flattened node list. TODO use d3.layout.hierarchy.
  var nodes = tree.nodes(root);

  console.log(nodes);

  // Compute the "layout".
  nodes.forEach(function(n, i) {
    n.x = i * barHeight;
  });

  // Update the nodes…
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .style("opacity", 1e-6);

  // Enter any new nodes at the parent's previous position.
  nodeEnter.append("svg:rect")
      .attr("y", -barHeight / 2)
      .attr("height", barHeight)
      .attr("width", barWidth)
      .style("fill", function(d) {
        return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
      })
      .on("click", function (d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}
);

  nodeEnter.append("svg:text")
      .attr("dy", 3.5)
      .attr("dx", 5.5)
      .text(function(d) { return d.name; });

  // Transition nodes to their new position.
  nodeEnter.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1);

  node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1)
    .select("rect")
      .style("fill", function(d) {
        return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
      });

  // Transition exiting nodes to the parent's new position.
  node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .style("opacity", 1e-6)
      .remove();

  // Update the links…
  var link = vis.selectAll("path.link")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  console.log(link);
  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });

        /*

        var nodes = newVal.nodes;
        var links = newVal.links;
        console.log(newVal);

        var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([w, h])
            .linkDistance(50)
            .charge(-100)
            .on('tick', tick)
            .start();

        // Per-type markers, as they don't inherit styles.
        svg.append('svg:defs').selectAll('marker')
            .data(['arrow'])
          .enter().append('svg:marker')
            .attr('id', String)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 15)
            .attr('refY', -1.5)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        var path = svg.append('svg:g').selectAll('path')
            .data(force.links())
          .enter().append('svg:path')
        // TODO(sll): only add these if the start and end state are different.
            .attr('class', function(d) { return 'link arrow'; })
            .attr('marker-end', function(d) { return 'url(#arrow)'; });

        var circle = svg.append('svg:g').selectAll('circle')
            .data(force.nodes())
          .enter().append('svg:circle')
            .attr('r', 6)
            .call(force.drag);

        var text = svg.append('svg:g').selectAll('g')
            .data(force.nodes())
          .enter().append('svg:g');

        // A copy of the text with a thick white stroke for legibility.
        text.append('svg:text')
            .attr('x', 8)
            .attr('y', '.31em')
            .attr('class', 'shadow')
            .text(function(d) { return d.name; });

        text.append('svg:text')
            .attr('x', 8)
            .attr('y', '.31em')
            .text(function(d) { return d.name; });

        // Use elliptical arc path segments to doubly-encode directionality.
        function tick() {
          path.attr('d', function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
          });

          circle.attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
          });

          text.attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
          });
        }

        */

      });
    }
  }
});

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorGraph.$inject = ['$scope', '$http', 'explorationDataFactory'];
