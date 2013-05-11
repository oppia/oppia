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
 * @fileoverview Controllers for the editor's view of the exploration tree.
 *
 * @author sll@google.com (Sean Lip)
 */

function EditorTree($scope, $filter, explorationData) {
  // When the exploration data is loaded, construct the tree.
  explorationData.getData().then(function(data) {
    $scope.treeData = $scope.reformatResponse(
        data.states, data.init_state_id);
  });

  $scope.truncate = function(text) {
    if (text.length > 40) {
      return text.substring(0, 37) + '...';
    } else {
      return text;
    }
  };

  $scope.dfs = function(currStateId, seen, states, priorCategory) {
    var thisState = {'name': states[currStateId].name, 'children': [], 'hashId': currStateId};
    if (priorCategory) {
      thisState['name'] = '[' + $scope.truncate(priorCategory) + '] ' + states[currStateId].name;
    }
    for (var i = 0; i < states[currStateId].widget.rules.submit.length; ++i) {
      var destStateId = states[currStateId].widget.rules.submit[i].dest;
      var rule = states[currStateId].widget.rules.submit[i].rule;
      var inputs = states[currStateId].widget.rules.submit[i].inputs;
      var category = $filter('parameterizeRule')({rule: rule, inputs: inputs});
      if (destStateId == END_DEST) {
        thisState['children'].push(
            {'name': '[' + $scope.truncate(category) + '] END', 'size': 100});
      } else if (seen[destStateId]) {
        thisState['children'].push(
            {'name': '[' + $scope.truncate(category) + '] ' + states[destStateId].name,
             'size': 100, 'hashId': destStateId});
      } else {
        seen[destStateId] = true;
        thisState['children'].push($scope.dfs(destStateId, seen, states, category));
      }
    }
    return thisState;
  };

  // Reformat the model into a response that is processable by d3.js.
  $scope.reformatResponse = function(states, initStateId) {
    var seen = {};
    seen[initStateId] = true;
    return $scope.dfs(initStateId, seen, states);
  };
}


oppia.directive('stateTreeViz', function (explorationData) {
  // constants
  var w = 960,
      h = 4000,
      barHeight = 30,
      barWidth = w * 0.45,
      i = 0,
      root,
      duration = 400;

  return {
    restrict: 'E',
    scope: {
      val: '=',
      grouped: '='
    },
    link: function (scope, element, attrs) {
      var tree = d3.layout.tree().size([h, 100]);
      var diagonal = d3.svg.diagonal()
          .projection(function(d) { return [d.y, d.x]; });

      var vis = d3.select(element[0]).append("svg:svg")
          .attr("width", w)
          .attr("height", h)
          .attr("class", "oppia-tree-viz")
        .append("svg:g")
          .attr("transform", "translate(20,30)");

      scope.$watch('val', function (newVal, oldVal) {
        // clear the elements inside of the directive
        vis.selectAll('*').remove();

        // if 'val' is undefined, exit
        if (!newVal) {
          return;
        }

        newVal.x0 = 0;
        newVal.y0 = 0;

        scope.updateTree(root = newVal);
      });

      scope.updateTree = function(newVal) {
        var source = newVal;

        // Compute the flattened node list. TODO use d3.layout.hierarchy.
        var nodes = tree.nodes(root);

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
              scope.updateTree(d);
            })
            .append("svg:title")
            .text(function(d) { return d.name; });

        // Append a click handler that will open the state editor window.
        nodeEnter.append("svg:rect")
            .attr("y", -barHeight / 2)
            .attr("height", barHeight)
            .attr("width", 50)
            .attr("transform", function(d) { return "translate(" + (barWidth - 50) + "," + 0 + ")"; })
            .style("fill", function(d) {
              return 'hashId' in d ? 'grey': '';
            })
            .on("click", function (d) {
              if (!('hashId' in d) || d.hashId == END_DEST) {
                return;
              }
              explorationData.getStateData(d.hashId);
              scope.$parent.$parent.stateId = d.hashId;
              $('#editorViewTab a[href="#stateEditor"]').tab('show');
            });

        nodeEnter.append("svg:text")
            .attr("dy", 3.5)
            .attr("dx", barWidth - 45)
            .text(function(d) {
              return 'hashId' in d ? "Edit" : "";
            });

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

      };


    }
  };
});

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorTree.$inject = ['$scope', '$filter', 'explorationData'];
