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

  // Reformat the model into a response that is processable by d3.js.
  $scope.reformatResponse = function(states, initState) {
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
  var w = 200,
      h = 600;

  return {
    restrict: 'E',
    scope: {
      val: '=',
      grouped: '='
    },
    link: function (scope, element, attrs) {

      // Simple template for a force-directed graph, from http://bl.ocks.org/d/1153292/
      // set up initial svg object
      var svg = d3.select(element[0])
          .append('svg:svg')
          .attr('width', w)
          .attr('height', h);

      scope.$watch('val', function (newVal, oldVal) {
        // clear the elements inside of the directive
        svg.selectAll('*').remove();

        // if 'val' is undefined, exit
        if (!newVal) {
          return;
        }

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

      });
    }
  }
});

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorGraph.$inject = ['$scope', '$http', 'explorationDataFactory'];
