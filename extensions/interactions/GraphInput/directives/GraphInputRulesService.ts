// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Rules service for the interaction.
 */

oppia.factory('GraphInputRulesService', [
  'GraphUtilsService', function(GraphUtilsService) {
    /**
     * @param {object} graph - A graph object.
     * @return {boolean} Whether the graph is strongly connected.
     */
    var isStronglyConnected = function(graph) {
      // Uses depth first search on each vertex to try and visit every other
      // vertex in both the normal and inverted adjacency lists.
      if (graph.vertices.length === 0) {
        return true;
      }

      var adjacencyLists = GraphUtilsService.constructAdjacencyLists(
        graph, GraphUtilsService.GRAPH_ADJACENCY_MODE.DIRECTED);
      var invertedAdjacencyLists = GraphUtilsService.constructAdjacencyLists(
        graph, GraphUtilsService.GRAPH_ADJACENCY_MODE.INVERTED);

      var isVisited = graph.vertices.map(function() {
        return false;
      });
      GraphUtilsService.markAccessible(0, adjacencyLists, isVisited);
      var isAnyVertexUnreachable = isVisited.some(function(visited) {
        return visited === false;
      });

      var isVisitedInReverse = graph.vertices.map(function() {
        return false;
      });
      GraphUtilsService.markAccessible(
        0, invertedAdjacencyLists, isVisitedInReverse);
      var isAnyVertexUnreachableInReverse =
        isVisitedInReverse.some(function(visited) {
          return visited === false;
        });

      return !isAnyVertexUnreachable && !isAnyVertexUnreachableInReverse;
    };

    /**
     * @param {object} graph - A graph object.
     * @return {boolean} Whether the graph is weakly connected.
     */
    var isWeaklyConnected = function(graph) {
      // Generates adjacency lists assuming graph is undirected, then uses depth
      // first search on node 0 to try to reach every other vertex
      if (graph.vertices.length === 0) {
        return true;
      }

      var adjacencyLists = GraphUtilsService.constructAdjacencyLists(
        graph, GraphUtilsService.GRAPH_ADJACENCY_MODE.UNDIRECTED);
      var isVisited = graph.vertices.map(function() {
        return false;
      });
      GraphUtilsService.markAccessible(0, adjacencyLists, isVisited);
      return isVisited.every(function(visited) {
        return visited === true;
      });
    };

    /**
     * @param {object} graph - A graph object.
     * @return {boolean} Whether the graph is acyclic.
     */
    var isAcyclic = function(graph) {
      // Uses depth first search to ensure that we never have an edge to an
      // ancestor in the search tree.

      var isVisited = graph.vertices.map(function() {
        return GraphUtilsService.DFS_STATUS.UNVISITED;
      });
      var adjacencyLists = GraphUtilsService.constructAdjacencyLists(
        graph, GraphUtilsService.GRAPH_ADJACENCY_MODE.DIRECTED);
      for (var startVertex = 0;
        startVertex < graph.vertices.length;
        startVertex++) {
        if (isVisited[startVertex] === GraphUtilsService.DFS_STATUS.UNVISITED) {
          if (GraphUtilsService.findCycle(
            startVertex, -1, adjacencyLists, isVisited, graph.isDirected)) {
            return false;
          }
        }
      }
      return true;
    };

    /**
     * @param {object} graph - A graph object.
     * @return {boolean} Whether the graph is acyclic.
     */
    var isRegular = function(graph) {
      // Checks that every vertex has outdegree and indegree equal to the first
      if (graph.vertices.length === 0) {
        return true;
      }

      var adjacencyLists = GraphUtilsService.constructAdjacencyLists(
        graph, GraphUtilsService.GRAPH_ADJACENCY_MODE.DIRECTED);
      var outdegreeCounts = adjacencyLists.map(function(list) {
        return list.length;
      });
      var indegreeCounts = adjacencyLists.map(function() {
        return 0;
      });
      adjacencyLists.forEach(function(list) {
        list.forEach(function(destination) {
          indegreeCounts[destination]++;
        });
      });

      var areIndegreeCountsEqual = indegreeCounts.every(function(indegree) {
        return indegree === indegreeCounts[0];
      });
      var areOutdegreeCountsEqual = outdegreeCounts.every(function(outdegree) {
        return outdegree === outdegreeCounts[0];
      });
      return areIndegreeCountsEqual && areOutdegreeCountsEqual;
    };

    var isIsomorphic = function(graph1, graph2) {
      if (graph1.vertices.length !== graph2.vertices.length) {
        return false;
      }

      var adj1 = GraphUtilsService.constructAdjacencyMatrix(graph1);
      var adj2 = GraphUtilsService.constructAdjacencyMatrix(graph2);

      // Check that for every vertex from the first graph there is a vertex in
      // the second graph with the same sum of weights of outgoing edges
      var degrees1 = adj1.map(function(value) {
        return value.reduce(function(prev, cur) {
          return prev + cur;
        });
      }).sort();

      var degrees2 = adj2.map(function(value) {
        return value.reduce(function(prev, cur) {
          return prev + cur;
        });
      }).sort();

      if (!angular.equals(degrees1, degrees2)) {
        return false;
      }

      // Check against every permutation of vectices.
      var numVertices = graph2.vertices.length;
      var permutation = [];
      for (var i = 0; i < numVertices; i++) {
        permutation.push(i);
      }
      while (permutation !== null) {
        var doLabelsMatch = (!graph1.isLabeled && !graph2.isLabeled) ||
          graph2.vertices.every(function(vertex, index) {
            return vertex.label === graph1.vertices[permutation[index]].label;
          });
        if (doLabelsMatch &&
            GraphUtilsService.areAdjacencyMatricesEqualWithPermutation(
              adj1, adj2, permutation)) {
          return true;
        }
        permutation = GraphUtilsService.nextPermutation(permutation);
      }
      return false;
    };

    return {
      HasGraphProperty: function(answer, inputs) {
        if (inputs.p === 'strongly_connected') {
          return isStronglyConnected(answer);
        } else if (inputs.p === 'weakly_connected') {
          return isWeaklyConnected(answer);
        } else if (inputs.p === 'acyclic') {
          return isAcyclic(answer);
        } else if (inputs.p === 'regular') {
          return isRegular(answer);
        } else {
          return false;
        }
      },
      IsIsomorphicTo: function(answer, inputs) {
        return isIsomorphic(answer, inputs.g);
      }
    };
  }
]);
