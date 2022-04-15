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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AdjacencyMatrix, GraphUtilsService } from
  'interactions/GraphInput/directives/graph-utils.service';
import { UtilsService } from 'services/utils.service';
import { GraphAnswer } from 'interactions/answer-defs';
import {
  GraphIsomorphicRuleInputs,
  GraphPropertyRuleInputs
} from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class GraphInputRulesService {
  constructor(
    private gus: GraphUtilsService, private utilsService: UtilsService) {}

  /**
   * @param {object} graph - A graph object.
   * @return {boolean} Whether the graph is strongly connected.
   */
  private isStronglyConnected(graph: GraphAnswer): boolean {
    // Uses depth first search on each vertex to try and visit every other
    // vertex in both the normal and inverted adjacency lists.
    if (graph.vertices.length === 0) {
      return true;
    }

    var adjacencyLists = this.gus.constructAdjacencyLists(
      graph, this.gus.GRAPH_ADJACENCY_MODE.DIRECTED);
    var invertedAdjacencyLists = this.gus.constructAdjacencyLists(
      graph, this.gus.GRAPH_ADJACENCY_MODE.INVERTED);

    var isVisited = graph.vertices.map(function() {
      return false;
    });
    this.gus.markAccessible(0, adjacencyLists, isVisited);
    var isAnyVertexUnreachable = isVisited.some(function(visited) {
      return visited === false;
    });

    var isVisitedInReverse = graph.vertices.map(function() {
      return false;
    });
    this.gus.markAccessible(
      0, invertedAdjacencyLists, isVisitedInReverse);
    var isAnyVertexUnreachableInReverse =
      isVisitedInReverse.some(function(visited) {
        return visited === false;
      });

    return !isAnyVertexUnreachable && !isAnyVertexUnreachableInReverse;
  }

  /**
   * @param {object} graph - A graph object.
   * @return {boolean} Whether the graph is weakly connected.
   */
  private isWeaklyConnected(graph: GraphAnswer): boolean {
    // Generates adjacency lists assuming graph is undirected, then uses depth
    // first search on node 0 to try to reach every other vertex.
    if (graph.vertices.length === 0) {
      return true;
    }

    var adjacencyLists = this.gus.constructAdjacencyLists(
      graph, this.gus.GRAPH_ADJACENCY_MODE.UNDIRECTED);
    var isVisited = graph.vertices.map(function() {
      return false;
    });
    this.gus.markAccessible(0, adjacencyLists, isVisited);
    return isVisited.every(function(visited) {
      return visited === true;
    });
  }

  /**
   * @param {object} graph - A graph object.
   * @return {boolean} Whether the graph is acyclic.
   */
  private isAcyclic(graph: GraphAnswer): boolean {
    // Uses depth first search to ensure that we never have an edge to an
    // ancestor in the search tree.
    var nodeStatus = graph.vertices.map(() => {
      return this.gus.DFS_STATUS.UNVISITED;
    });
    var adjacencyLists = this.gus.constructAdjacencyLists(
      graph, this.gus.GRAPH_ADJACENCY_MODE.DIRECTED);
    for (var startVertex = 0;
      startVertex < graph.vertices.length;
      startVertex++) {
      if (nodeStatus[startVertex] === this.gus.DFS_STATUS.UNVISITED) {
        if (this.gus.findCycle(
          startVertex, -1, adjacencyLists, nodeStatus, graph.isDirected)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * @param {object} graph - A graph object.
   * @return {boolean} Whether the graph is acyclic.
   */
  private isRegular(graph: GraphAnswer): boolean {
    // Checks that every vertex has outdegree and indegree equal to the first.
    if (graph.vertices.length === 0) {
      return true;
    }

    var adjacencyLists = this.gus.constructAdjacencyLists(
      graph, this.gus.GRAPH_ADJACENCY_MODE.DIRECTED);
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
  }

  private _getDegreesOfMatrix(adj: AdjacencyMatrix): number[] {
    return adj.map((value) => {
      return value.reduce((prev, cur) => {
        prev = (prev === null) ? 0 : prev;
        cur = (cur === null) ? 0 : cur;
        return prev + cur;
      });
    }).sort() as number[];
  }

  private isIsomorphic(graph1: GraphAnswer, graph2: GraphAnswer): boolean {
    if (graph1.vertices.length !== graph2.vertices.length) {
      return false;
    }

    var adj1 = this.gus.constructAdjacencyMatrix(graph1);
    var adj2 = this.gus.constructAdjacencyMatrix(graph2);

    // Check that for every vertex from the first graph there is a vertex in
    // the second graph with the same sum of weights of outgoing edges.
    var degrees1 = this._getDegreesOfMatrix(adj1);
    var degrees2 = this._getDegreesOfMatrix(adj2);

    if (!this.utilsService.isEquivalent(degrees1, degrees2)) {
      return false;
    }

    // Check against every permutation of vectices.
    var numVertices = graph2.vertices.length;
    // The permutation will be 'null' when there are no more
    // lexicographical permutation of vertices.
    var permutation: number[] | null = [];
    for (var i = 0; i < numVertices; i++) {
      permutation.push(i);
    }
    while (permutation !== null) {
      var doLabelsMatch = (!graph1.isLabeled && !graph2.isLabeled) ||
        graph2.vertices.every((vertex, index) => {
          const _permutation = permutation as number[];
          return vertex.label === graph1.vertices[_permutation[index]].label;
        });
      if (doLabelsMatch &&
          this.gus.areAdjacencyMatricesEqualWithPermutation(
            adj1, adj2, permutation)) {
        return true;
      }
      permutation = this.gus.nextPermutation(permutation);
    }
    return false;
  }

  HasGraphProperty(
      answer: GraphAnswer,
      inputs: GraphPropertyRuleInputs): boolean {
    if (inputs.p === 'strongly_connected') {
      return this.isStronglyConnected(answer);
    } else if (inputs.p === 'weakly_connected') {
      return this.isWeaklyConnected(answer);
    } else if (inputs.p === 'acyclic') {
      return this.isAcyclic(answer);
    } else if (inputs.p === 'regular') {
      return this.isRegular(answer);
    } else {
      return false;
    }
  }

  IsIsomorphicTo(
      answer: GraphAnswer,
      inputs: GraphIsomorphicRuleInputs): boolean {
    return this.isIsomorphic(answer, inputs.g);
  }
}

angular.module('oppia').factory(
  'GraphInputRulesService', downgradeInjectable(GraphInputRulesService));
