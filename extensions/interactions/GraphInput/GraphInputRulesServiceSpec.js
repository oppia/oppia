// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Graph Input rules.
 *
 * @author wxyxinyu@gmail.com (Xinyu Wu)
 */

describe('Graph Input service', function() {
  beforeEach(module('oppia'));

  var girs = null;
  beforeEach(inject(function($injector) {
    girs = $injector.get('graphInputRulesService');
  }));

  describe('graph utilities', function() {
    var utils = null;
    beforeEach(inject(function($injector) {
      utils = $injector.get('graphUtilsService');
    }));

    it('should construct an adjacency matrix from a graph', function() {
      expect(utils.constructAdjacencyMatrix({
        vertices: [
          {label: 'a', x: 1.0, y: 1.0},
          {label: 'b', x: 2.0, y: 2.0},
          {label: 'c', x: 3.0, y: 3.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 1},
          {src: 1, dst: 2, weight: 2}
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      })).toEqual([
        [null, 1, null],
        [1, null, 2],
        [null, 2, null]
      ]);
      expect(utils.constructAdjacencyMatrix({
        vertices: [
          {label: 'a', x: 1.0, y: 1.0},
          {label: 'b', x: 2.0, y: 2.0},
          {label: 'c', x: 3.0, y: 3.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 1},
          {src: 1, dst: 2, weight: 2}
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: true
      })).toEqual([
        [null, 1, null],
        [1, null, 1],
        [null, 1, null]
      ]);
    });

    it('should find the next lexicographical permutation', function() {
      var permutation = [0, 1, 2, 3];
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([0, 1, 3, 2]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([0, 2, 1, 3]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([0, 2, 3, 1]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([0, 3, 1, 2]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([0, 3, 2, 1]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([1, 0, 2, 3]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([1, 0, 3, 2]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([1, 2, 0, 3]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([1, 2, 3, 0]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([1, 3, 0, 2]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([1, 3, 2, 0]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([2, 0, 1, 3]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([2, 0, 3, 1]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([2, 1, 0, 3]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([2, 1, 3, 0]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([2, 3, 0, 1]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([2, 3, 1, 0]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([3, 0, 1, 2]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([3, 0, 2, 1]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([3, 1, 0, 2]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([3, 1, 2, 0]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([3, 2, 0, 1]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toEqual([3, 2, 1, 0]);
      permutation = utils.nextPermutation(permutation);
      expect(permutation).toBe(null);
    });

    it('should compare adjacency matrices with a permutation', function() {
      expect(utils.areAdjacencyMatricesEqualWithPermutation([
        [null, 1, 1],
        [2, null, 1],
        [1, 1, null]
      ], [
        [null, 1, 1],
        [2, null, 1],
        [1, 1, null]
      ], [0, 1, 2])).toBe(true);
      expect(utils.areAdjacencyMatricesEqualWithPermutation([
        [null, 1, 1],
        [2, null, 1],
        [1, 1, null]
      ], [
        [null, 1, null],
        [2, null, 1],
        [1, 1, null]
      ], [0, 1, 2])).toBe(false);
      expect(utils.areAdjacencyMatricesEqualWithPermutation([
        [null, 1, 2],
        [2, null, 1],
        [1, 1, null]
      ], [
        [null, 1, 1],
        [2, null, 1],
        [1, 2, null]
      ], [2, 0, 1])).toBe(true);
    });
  });

  describe('\'is isomorphic to\' rule', function() {
    var emptyGraph = function() {
      return {
        vertices: [],
        edges: [],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      };
    };

    var nullGraph = function(numVertices) {
      var graph = emptyGraph();
      for (var i = 0; i < numVertices; i++) {
        graph.vertices.push({
          label: '',
          x: 0.0,
          y: 0.0
        });
      }
      return graph;
    };

    var cycleGraph = function(numVertices) {
      var graph = nullGraph(numVertices);
      if (numVertices == 1) {
        return graph;
      }
      for (var i = 0; i < numVertices; i++) {
        graph.edges.push({
          src: i,
          dst: (i + 1) % numVertices,
          weight: 1
        });
      }
      return graph;
    };

    var completeGraph = function(numVertices) {
      var graph = nullGraph(numVertices);
      for (var i = 0; i < numVertices; i++) {
        for (var j = i + 1; j < numVertices; j++) {
          graph.edges.push({
              src: i,
              dst: j,
              weight: 1
          });
        }
      }
      return graph;
    };

    it('should match graphs which are the same', function() {
      expect(girs.IsIsomorphicTo(emptyGraph(), {g: emptyGraph()})).toBe(true);
      expect(girs.IsIsomorphicTo(cycleGraph(5), {g: cycleGraph(5)})).toBe(true);
    });

    it('should match isomorphic graphs', function() {
      expect(girs.IsIsomorphicTo(cycleGraph(5), {g: {
        vertices: [
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 1.0, y: 1.0}
        ],
        edges: [
          {src: 0, dst: 2, weight: 1},
          {src: 2, dst: 4, weight: 1},
          {src: 4, dst: 1, weight: 1},
          {src: 1, dst: 3, weight: 1},
          {src: 3, dst: 0, weight: 1}
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }})).toBe(true);
    });

    it('should match isomorphic graphs with labels', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [
          {label: 'a', x: 1.0, y: 1.0},
          {label: 'b', x: 2.0, y: 2.0},
          {label: 'c', x: 3.0, y: 3.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 1},
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: true
      }, {g: {
        vertices: [
            {label: 'c', x: 1.0, y: 1.0},
            {label: 'a', x: 2.0, y: 2.0},
            {label: 'b', x: 3.0, y: 3.0}
        ],
        edges: [
            {src: 2, dst: 1, weight: 1},
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: true
      }})).toBe(true);
    });

    it('should match isomorphic graphs with labels and weights', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [
          {label: 'a', x: 1.0, y: 1.0},
          {label: 'b', x: 2.0, y: 2.0},
          {label: 'c', x: 3.0, y: 3.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 2},
          {src: 1, dst: 2, weight: 1}
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {g: {
        vertices: [
            {label: 'b', x: 1.0, y: 1.0},
            {label: 'a', x: 2.0, y: 2.0},
            {label: 'c', x: 3.0, y: 3.0}
        ],
        edges: [
            {src: 2, dst: 0, weight: 1},
            {src: 1, dst: 0, weight: 2}
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }})).toBe(true);
    });

    it('should match directed and undirected graphs', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 2.0, y: 2.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 1}
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, {g: {
        vertices: [
            {label: '', x: 1.0, y: 1.0},
            {label: '', x: 2.0, y: 2.0}
        ],
        edges: [
            {src: 0, dst: 1, weight: 1},
            {src: 1, dst: 0, weight: 1}
        ],
        isDirected: true,
        isWeighted: false,
        isLabeled: false
      }})).toBe(true);
    });


    it('should not match simple graphs with different edges', function() {
      expect(girs.IsIsomorphicTo(cycleGraph(3), {g: nullGraph(3)})).toBe(false);
      expect(girs.IsIsomorphicTo(nullGraph(3), {g: cycleGraph(3)})).toBe(false);
      expect(girs.IsIsomorphicTo(
        completeGraph(4), {g: cycleGraph(4)})).toBe(false);
      expect(girs.IsIsomorphicTo(
        cycleGraph(4), {g: completeGraph(4)})).toBe(false);
    });

    it('should not match graphs with different numbers of nodes', function() {
      expect(girs.IsIsomorphicTo(nullGraph(3), {g: nullGraph(6)})).toBe(false);
    });

    it('should not match graphs with different edges', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [
          {label: 'a', x: 1.0, y: 1.0},
          {label: 'b', x: 2.0, y: 2.0},
          {label: 'c', x: 3.0, y: 3.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 2},
          {src: 1, dst: 2, weight: 2}
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {g: {
        vertices: [
          {label: 'b', x: 1.0, y: 1.0},
          {label: 'a', x: 2.0, y: 2.0},
          {label: 'c', x: 3.0, y: 3.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 1},
          {src: 0, dst: 2, weight: 2}
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }})).toBe(false);
    });

    it('should not match graphs with different edge weights', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 2.0, y: 2.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 1}
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: false
      }, {g: {
        vertices: [
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 2.0, y: 2.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 2}
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: false
      }})).toBe(false);
    });

    it('should not match graphs with different labels', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [
          {label: 'a', x: 1.0, y: 1.0},
          {label: 'b', x: 2.0, y: 2.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 2}
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {g: {
        vertices: [
          {label: 'a', x: 1.0, y: 1.0},
          {label: 'c', x: 2.0, y: 2.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 2},
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }})).toBe(false);
    });
  });

  describe('fuzzy rule', function() {
    var RULE_INPUT = {
      training_data: [{
        vertices: [
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 2.0, y: 2.0},
          {label: '', x: 3.0, y: 3.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 1},
          {src: 1, dst: 2, weight: 1},
          {src: 2, dst: 0, weight: 1},
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, {
        vertices: [
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 2.0, y: 2.0},
          {label: '', x: 3.0, y: 3.0},
          {label: '', x: 4.0, y: 4.0}
        ],
        edges: [
          {src: 0, dst: 1, weight: 1},
          {src: 1, dst: 2, weight: 1},
          {src: 2, dst: 3, weight: 1},
          {src: 3, dst: 0, weight: 1},
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }]
    };

    it('should match isomorphic graphs', function() {
      expect(girs.FuzzyMatches({
        vertices: [
          {label: '', x: 4.0, y: 4.0},
          {label: '', x: 5.0, y: 5.0},
          {label: '', x: 6.0, y: 6.0}
        ],
        edges: [
          {src: 2, dst: 0, weight: 1},
          {src: 0, dst: 1, weight: 1},
          {src: 2, dst: 1, weight: 1},
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, RULE_INPUT)).toBe(true);

      expect(girs.FuzzyMatches({
        vertices: [
          {label: '', x: 4.0, y: 4.0},
          {label: '', x: 5.0, y: 5.0},
          {label: '', x: 6.0, y: 6.0}
        ],
        edges: [
          {src: 2, dst: 0, weight: 1},
          {src: 0, dst: 1, weight: 1},
          {src: 2, dst: 1, weight: 1},
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, RULE_INPUT)).toBe(true);
    });

    it('should match graphs isomorphic to another graph in the training data',
        function() {
      expect(girs.FuzzyMatches({
        vertices: [
          {label: '', x: 4.0, y: 4.0},
          {label: '', x: 5.0, y: 5.0},
          {label: '', x: 6.0, y: 6.0},
          {label: '', x: 7.0, y: 7.0}
        ],
        edges: [
          {src: 3, dst: 0, weight: 1},
          {src: 0, dst: 1, weight: 1},
          {src: 2, dst: 1, weight: 1},
          {src: 3, dst: 2, weight: 1}
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, RULE_INPUT)).toBe(true);
    });

    it('should fail on non-isomorphic graphs', function() {
      expect(girs.FuzzyMatches({
        vertices: [
          {label: '', x: 4.0, y: 4.0},
          {label: '', x: 5.0, y: 5.0},
        ],
        edges: [
          {src: 1, dst: 0, weight: 1},
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, RULE_INPUT)).toBe(false);
    });
  });
});
