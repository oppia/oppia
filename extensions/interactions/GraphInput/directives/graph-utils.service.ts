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
 * @fileoverview Utils service for the interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { GraphAnswer } from 'interactions/answer-defs';

// 'null' indicates that the pairs of vertices are not adjacent in the graph.
export type AdjacencyMatrix = (number | null)[][];

@Injectable({
  providedIn: 'root'
})
export class GraphUtilsService {
  GRAPH_ADJACENCY_MODE = {
    DIRECTED: 'directed',
    INVERTED: 'inverted',
    UNDIRECTED: 'undirected'
  };

  DFS_STATUS = {
    VISITED: 'visited',
    UNVISITED: 'unvisited',
    STILL_VISITING: 'still visiting'
  };

  /**
   * @param {object} graph - A graph object.
   * @param {string} adjacencyListMode - A string indicating the mode.
   * @return {array} An adjacency list. Depending on the mode, the list has
   *   all edges (directed),
   *   all edges inverted (inverted),
   *   or all edges in both directions, as though the graph were undirected
   *   (undirected)
   */
  constructAdjacencyLists(
      graph: GraphAnswer, adjacencyListMode: string): number[][] {
    var adjacencyLists: number[][] = [];
    for (var i = 0; i < graph.vertices.length; i++) {
      adjacencyLists.push([]);
    }

    // If a graph is undirected, all modes work the same way anyway.
    if (!graph.isDirected) {
      adjacencyListMode = this.GRAPH_ADJACENCY_MODE.UNDIRECTED;
    }
    for (var i = 0; i < graph.edges.length; i++) {
      var edge = graph.edges[i];
      if (adjacencyListMode === this.GRAPH_ADJACENCY_MODE.DIRECTED ||
          adjacencyListMode === this.GRAPH_ADJACENCY_MODE.UNDIRECTED) {
        adjacencyLists[edge.src].push(edge.dst);
      }
      if (adjacencyListMode === (
        this.GRAPH_ADJACENCY_MODE.INVERTED) || adjacencyListMode === (
        this.GRAPH_ADJACENCY_MODE.UNDIRECTED)) {
        adjacencyLists[edge.dst].push(edge.src);
      }
    }
    return adjacencyLists;
  }

  /**
   * @param {integer} startVertex - The index of the starting vertex.
   * @param {array} adjacencyLists - An array of arrays.
   * @param {array} isVisited - An array with length equal to the number of
   *     vertices. All the values should be false initially.
   * This function modifies the isVisited array and changes the values at
   * the indices of the vertices reachable from the starting vertex to true.
   */
  markAccessible(
      startVertex: number, adjacencyLists: number[][],
      isVisited: boolean[]): void {
    isVisited[startVertex] = true;
    for (var i = 0; i < adjacencyLists[startVertex].length; i++) {
      var nextVertex = adjacencyLists[startVertex][i];
      if (!isVisited[nextVertex]) {
        this.markAccessible(nextVertex, adjacencyLists, isVisited);
      }
    }
  }

  findCycle(
      currentVertex: number, previousVertex: number,
      adjacencyLists: number[][], nodeStatus: string[],
      isDirected: boolean): boolean {
    nodeStatus[currentVertex] = this.DFS_STATUS.STILL_VISITING;
    for (var i = 0; i < adjacencyLists[currentVertex].length; i++) {
      var nextVertex = adjacencyLists[currentVertex][i];
      if (nextVertex === previousVertex && !isDirected) {
        continue;
      }
      if (nodeStatus[nextVertex] === (
        this.DFS_STATUS.STILL_VISITING)) {
        return true;
      }
      if (nodeStatus[nextVertex] === this.DFS_STATUS.UNVISITED &&
          this.findCycle(
            nextVertex, currentVertex, adjacencyLists, nodeStatus,
            isDirected)) {
        return true;
      }
    }
    nodeStatus[currentVertex] = this.DFS_STATUS.VISITED;
    return false;
  }

  constructAdjacencyMatrix(graph: GraphAnswer): AdjacencyMatrix {
    var adjMatrix: AdjacencyMatrix = [];
    for (var i = 0; i < graph.vertices.length; i++) {
      var adjMatrixRow = [];
      for (var j = 0; j < graph.vertices.length; j++) {
        adjMatrixRow.push(null);
      }
      adjMatrix.push(adjMatrixRow);
    }

    graph.edges.map(edge => {
      var weight = graph.isWeighted ? edge.weight : 1;
      adjMatrix[edge.src][edge.dst] = weight;
      if (!graph.isDirected) {
        adjMatrix[edge.dst][edge.src] = weight;
      }
    });
    return adjMatrix;
  }

  nextPermutation(permutation: number[]): number[] | null {
    // Generates (in place) the next lexicographical permutation.
    // permutation is a permutation of [0, 1, 2, ..., permutation.length - 1].

    // Find the pivot to longest decreasing suffix and successor.
    var pivot: number | null = null;
    var successor: number | null = null;
    permutation.reduce((
        previousValue: number, currentValue: number, currentIndex: number) => {
      if (previousValue < currentValue) {
        pivot = currentIndex - 1;
      }
      if (pivot !== null && currentValue > permutation[pivot]) {
        successor = currentIndex;
      }
      return currentValue;
    });

    if (pivot === null || successor === null) {
      return null;
    }

    // Swap the pivot and successor and reverse the suffix.
    var tmp = permutation[pivot];
    permutation[pivot] = permutation[successor];
    permutation[successor] = tmp;
    permutation = permutation.concat(permutation.splice(pivot + 1).reverse());
    return permutation;
  }

  areAdjacencyMatricesEqualWithPermutation(
      adj1: AdjacencyMatrix,
      adj2: AdjacencyMatrix,
      permutation: number[]): boolean {
    var numVertices = adj1.length;
    for (var i = 0; i < numVertices; i++) {
      for (var j = 0; j < numVertices; j++) {
        if (adj1[permutation[i]][permutation[j]] !== adj2[i][j]) {
          return false;
        }
      }
    }
    return true;
  }
}

angular.module('oppia').factory(
  'GraphUtilsService', downgradeInjectable(GraphUtilsService));
