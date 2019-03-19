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
 */

describe('Graph Input service', function() {
  beforeEach(module('oppia'));

  var girs = null;
  beforeEach(inject(function($injector) {
    girs = $injector.get('GraphInputRulesService');
  }));

  describe('graph utilities', function() {
    var utils = null;
    beforeEach(inject(function($injector) {
      utils = $injector.get('GraphUtilsService');
    }));

    it('should construct an adjacency matrix from a graph', function() {
      expect(utils.constructAdjacencyMatrix({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 3.0,
          y: 3.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }, {
          src: 1,
          dst: 2,
          weight: 2
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      })).toEqual([
        [null, 1, null],
        [1, null, 2],
        [null, 2, null]
      ]);
      expect(utils.constructAdjacencyMatrix({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 3.0,
          y: 3.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }, {
          src: 1,
          dst: 2,
          weight: 2
        }],
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

  var undirectedEmptyGraph = function() {
    return {
      vertices: [],
      edges: [],
      isDirected: false,
      isWeighted: false,
      isLabeled: false
    };
  };

  var undirectedNullGraph = function(numVertices) {
    var graph = undirectedEmptyGraph();
    for (var i = 0; i < numVertices; i++) {
      graph.vertices.push({
        label: '',
        x: 0.0,
        y: 0.0
      });
    }
    return graph;
  };

  var undirectedCycleGraph = function(numVertices) {
    var graph = undirectedNullGraph(numVertices);
    if (numVertices === 1) {
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

  var undirectedCompleteGraph = function(numVertices) {
    var graph = undirectedNullGraph(numVertices);
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

  var undirectedStarGraph = function(numVertices) {
    var graph = undirectedNullGraph(numVertices);
    for (var i = 1; i < numVertices; i++) {
      graph.edges.push({
        src: 0,
        dst: i,
        weight: 1
      });
    }
    return graph;
  };

  var directedEmptyGraph = function() {
    return {
      vertices: [],
      edges: [],
      isDirected: true,
      isWeighted: false,
      isLabeled: false
    };
  };

  var directedNullGraph = function(numVertices) {
    var graph = directedEmptyGraph();
    for (var i = 0; i < numVertices; i++) {
      graph.vertices.push({
        label: '',
        x: 0.0,
        y: 0.0
      });
    }
    return graph;
  };

  var directedCycleGraph = function(numVertices) {
    var graph = directedNullGraph(numVertices);
    if (numVertices === 1) {
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

  describe('\'is isomorphic to\' rule', function() {
    it('should match graphs which are the same', function() {
      expect(girs.IsIsomorphicTo(undirectedEmptyGraph(), {
        g: undirectedEmptyGraph()
      })).toBe(true);

      expect(girs.IsIsomorphicTo(undirectedCycleGraph(5), {
        g: undirectedCycleGraph(5)
      })).toBe(true);

      expect(girs.IsIsomorphicTo(directedCycleGraph(6), {
        g: directedCycleGraph(6)
      })).toBe(true);
    });

    it('should match isomorphic graphs', function() {
      expect(girs.IsIsomorphicTo(undirectedCycleGraph(5), {
        g: {
          vertices: [{
            label: '',
            x: 1.0,
            y: 1.0
          }, {
            label: '',
            x: 1.0,
            y: 1.0
          }, {
            label: '',
            x: 1.0,
            y: 1.0
          }, {
            label: '',
            x: 1.0,
            y: 1.0
          }, {
            label: '',
            x: 1.0,
            y: 1.0
          }],
          edges: [{
            src: 0,
            dst: 2,
            weight: 1
          }, {
            src: 2,
            dst: 4,
            weight: 1
          }, {
            src: 4,
            dst: 1,
            weight: 1
          }, {
            src: 1,
            dst: 3,
            weight: 1
          }, {
            src: 3,
            dst: 0,
            weight: 1
          }],
          isDirected: false,
          isWeighted: false,
          isLabeled: false
        }
      })).toBe(true);
    });

    it('should match isomorphic graphs with labels', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 3.0,
          y: 3.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }],
        isDirected: false,
        isWeighted: false,
        isLabeled: true
      }, {
        g: {
          vertices: [{
            label: 'c',
            x: 1.0,
            y: 1.0
          }, {
            label: 'a',
            x: 2.0,
            y: 2.0
          }, {
            label: 'b',
            x: 3.0,
            y: 3.0
          }],
          edges: [{
            src: 2,
            dst: 1,
            weight: 1
          }],
          isDirected: false,
          isWeighted: false,
          isLabeled: true
        }
      })).toBe(true);
    });

    it('should match isomorphic graphs with labels and weights', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 3.0,
          y: 3.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 2
        }, {
          src: 1,
          dst: 2,
          weight: 1
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {
        g: {
          vertices: [{
            label: 'b',
            x: 1.0,
            y: 1.0
          }, {
            label: 'a',
            x: 2.0,
            y: 2.0
          }, {
            label: 'c',
            x: 3.0,
            y: 3.0
          }],
          edges: [{
            src: 2,
            dst: 0,
            weight: 1
          }, {
            src: 1,
            dst: 0,
            weight: 2
          }],
          isDirected: false,
          isWeighted: true,
          isLabeled: true
        }
      })).toBe(true);
    });

    it('should match directed and undirected graphs', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [{
          label: '',
          x: 1.0,
          y: 1.0
        }, {
          label: '',
          x: 2.0,
          y: 2.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, {
        g: {
          vertices: [{
            label: '',
            x: 1.0,
            y: 1.0
          }, {
            label: '',
            x: 2.0,
            y: 2.0
          }],
          edges: [{
            src: 0,
            dst: 1,
            weight: 1
          }, {
            src: 1,
            dst: 0,
            weight: 1
          }],
          isDirected: true,
          isWeighted: false,
          isLabeled: false
        }
      })).toBe(true);
    });

    it('should not match simple graphs with different edges', function() {
      expect(girs.IsIsomorphicTo(undirectedCycleGraph(3), {
        g: undirectedNullGraph(3)
      })).toBe(false);

      expect(girs.IsIsomorphicTo(undirectedNullGraph(3), {
        g: undirectedCycleGraph(3)
      })).toBe(false);

      expect(girs.IsIsomorphicTo(undirectedCompleteGraph(4), {
        g: undirectedCycleGraph(4)
      })).toBe(false);

      expect(girs.IsIsomorphicTo(undirectedCycleGraph(4), {
        g: undirectedCompleteGraph(4)
      })).toBe(false);

      expect(girs.IsIsomorphicTo(directedCycleGraph(4), {
        g: undirectedCompleteGraph(4)
      })).toBe(false);
    });

    it('should not match graphs with different numbers of nodes', function() {
      expect(girs.IsIsomorphicTo(undirectedNullGraph(3), {
        g: undirectedNullGraph(6)
      })).toBe(false);
    });

    it('should not match graphs with different edges', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 3.0,
          y: 3.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 2
        }, {
          src: 1,
          dst: 2,
          weight: 2
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {
        g: {
          vertices: [{
            label: 'b',
            x: 1.0,
            y: 1.0
          }, {
            label: 'a',
            x: 2.0,
            y: 2.0
          }, {
            label: 'c',
            x: 3.0,
            y: 3.0
          }],
          edges: [{
            src: 0,
            dst: 1,
            weight: 1
          }, {
            src: 0,
            dst: 2,
            weight: 2
          }],
          isDirected: false,
          isWeighted: true,
          isLabeled: true
        }
      })).toBe(false);
    });

    it('should not match graphs with different edge weights', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [{
          label: '',
          x: 1.0,
          y: 1.0
        }, {
          label: '',
          x: 2.0,
          y: 2.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: false
      }, {
        g: {
          vertices: [{
            label: '',
            x: 1.0,
            y: 1.0
          }, {
            label: '',
            x: 2.0,
            y: 2.0
          }],
          edges: [{
            src: 0,
            dst: 1,
            weight: 2
          }],
          isDirected: false,
          isWeighted: true,
          isLabeled: false
        }
      })).toBe(false);
    });

    it('should not match graphs with different labels', function() {
      expect(girs.IsIsomorphicTo({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 2
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {
        g: {
          vertices: [{
            label: 'a',
            x: 1.0,
            y: 1.0
          }, {
            label: 'c',
            x: 2.0,
            y: 2.0
          }],
          edges: [{
            src: 0,
            dst: 1,
            weight: 2
          }],
          isDirected: false,
          isWeighted: true,
          isLabeled: true
        }
      })).toBe(false);
    });
  });

  describe('\'is weakly connected\' rule', function() {
    it('should return true on undirected connected graphs', function() {
      expect(girs.HasGraphProperty(undirectedEmptyGraph(), {
        p: 'weakly_connected'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedCycleGraph(5), {
        p: 'weakly_connected'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedStarGraph(4), {
        p: 'weakly_connected'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedCompleteGraph(6), {
        p: 'weakly_connected'
      })).toBe(true);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 2
        }, {
          src: 2,
          dst: 1,
          weight: 1
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {
        p: 'weakly_connected'
      })).toBe(true);
    });

    it('should return true on directed weakly connected graphs', function() {
      expect(girs.HasGraphProperty(directedCycleGraph(4), {
        p: 'weakly_connected'
      })).toBe(true);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 2
        }, {
          src: 2,
          dst: 1,
          weight: 1
        }],
        isDirected: true,
        isWeighted: true,
        isLabeled: true
      }, {
        p: 'weakly_connected'
      })).toBe(true);
    });

    it('should return false for disconnected graphs', function() {
      expect(girs.HasGraphProperty(undirectedNullGraph(2), {
        p: 'weakly_connected'
      })).toBe(false);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 2
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {
        p: 'weakly_connected'
      })).toBe(false);
    });
  });

  describe('\'is strongly connected\' rule', function() {
    it('should return true for undirected connected graphs', function() {
      expect(girs.HasGraphProperty(undirectedEmptyGraph(), {
        p: 'strongly_connected'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedCycleGraph(5), {
        p: 'strongly_connected'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedCompleteGraph(6), {
        p: 'strongly_connected'
      })).toBe(true);
    });

    it('should return true for directed strongly connected graphs', function() {
      expect(girs.HasGraphProperty(directedCycleGraph(6), {
        p: 'strongly_connected'
      })).toBe(true);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 3.0,
          y: 3.0
        }, {
          label: 'd',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }, {
          src: 1,
          dst: 2,
          weight: 2
        }, {
          src: 2,
          dst: 0,
          weight: 3
        }, {
          src: 0,
          dst: 3,
          weight: 3
        }, {
          src: 3,
          dst: 2,
          weight: 3
        }],
        isDirected: true,
        isWeighted: true,
        isLabeled: true
      }, {
        p: 'strongly_connected'
      })).toBe(true);
    });

    it('should return false for disconnected graphs', function() {
      expect(girs.HasGraphProperty(undirectedNullGraph(2), {
        p: 'strongly_connected'
      })).toBe(false);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: 'a',
          x: 1.0,
          y: 1.0
        }, {
          label: 'b',
          x: 2.0,
          y: 2.0
        }, {
          label: 'c',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }],
        isDirected: true,
        isWeighted: true,
        isLabeled: true
      }, {
        p: 'strongly_connected'
      })).toBe(false);
    });

    it('should return false for graphs that are only weakly connected',
      function() {
        expect(girs.HasGraphProperty({
          vertices: [{
            label: 'a',
            x: 1.0,
            y: 1.0
          }, {
            label: 'b',
            x: 2.0,
            y: 2.0
          }, {
            label: 'c',
            x: 0.0,
            y: 0.0
          }],
          edges: [{
            src: 0,
            dst: 1,
            weight: 2
          }, {
            src: 2,
            dst: 1,
            weight: 1
          }],
          isDirected: true,
          isWeighted: true,
          isLabeled: true
        }, {
          p: 'strongly_connected'
        })).toBe(false);
      }
    );
  });

  describe('\'is acyclic\' rule', function() {
    it('should return true on acyclic graphs', function() {
      expect(girs.HasGraphProperty(undirectedEmptyGraph(), {
        p: 'acyclic'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedCompleteGraph(2), {
        p: 'acyclic'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedStarGraph(4), {
        p: 'acyclic'
      })).toBe(true);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: 'a',
          x: 0.0,
          y: 0.0
        }, {
          label: 'b',
          x: 0.0,
          y: 0.0
        }, {
          label: 'c',
          x: 0.0,
          y: 0.0
        }, {
          label: 'd',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 2,
          weight: 2
        }, {
          src: 2,
          dst: 3,
          weight: 4
        }, {
          src: 1,
          dst: 3,
          weight: 123
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {
        p: 'acyclic'
      })).toBe(true);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: 'a',
          x: 0.0,
          y: 0.0
        }, {
          label: 'b',
          x: 0.0,
          y: 0.0
        }, {
          label: 'c',
          x: 0.0,
          y: 0.0
        }, {
          label: 'd',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 2
        }, {
          src: 2,
          dst: 1,
          weight: 4
        }, {
          src: 3,
          dst: 1,
          weight: 123
        }],
        isDirected: false,
        isWeighted: true,
        isLabeled: true
      }, {
        p: 'acyclic'
      })).toBe(true);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }, {
          src: 0,
          dst: 2,
          weight: 1
        }, {
          src: 1,
          dst: 2,
          weight: 1
        }],
        isDirected: true,
        isWeighted: false,
        isLabeled: false
      }, {
        p: 'acyclic'
      })).toBe(true);
    });

    it('should return false on graphs with cycles', function() {
      expect(girs.HasGraphProperty(undirectedCycleGraph(5), {
        p: 'acyclic'
      })).toBe(false);

      expect(girs.HasGraphProperty(directedCycleGraph(6), {
        p: 'acyclic'
      })).toBe(false);

      expect(girs.HasGraphProperty(undirectedCompleteGraph(4), {
        p: 'acyclic'
      })).toBe(false);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }, {
          src: 2,
          dst: 0,
          weight: 1
        }, {
          src: 1,
          dst: 2,
          weight: 1
        }],
        isDirected: true,
        isWeighted: false,
        isLabeled: false
      }, {
        p: 'acyclic'
      })).toBe(false);
    });
  });

  describe('\'is regular\' rule', function() {
    it('should detect undirected regular graphs', function() {
      expect(girs.HasGraphProperty(undirectedEmptyGraph(), {
        p: 'regular'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedNullGraph(9), {
        p: 'regular'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedCompleteGraph(8), {
        p: 'regular'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedCycleGraph(3), {
        p: 'regular'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedCycleGraph(4), {
        p: 'regular'
      })).toBe(true);

      expect(girs.HasGraphProperty(undirectedStarGraph(4), {
        p: 'regular'
      })).toBe(false);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, {
        p: 'regular'
      })).toBe(false);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }, {
          src: 2,
          dst: 1,
          weight: 1
        }, {
          src: 3,
          dst: 1,
          weight: 1
        }],
        isDirected: false,
        isWeighted: false,
        isLabeled: false
      }, {
        p: 'regular'
      })).toBe(false);
    });

    it('should detect directed regular graphs', function() {
      expect(girs.HasGraphProperty(directedCycleGraph(4), {
        p: 'regular'
      })).toBe(true);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }, {
          src: 2,
          dst: 0,
          weight: 1
        }, {
          src: 1,
          dst: 2,
          weight: 1
        }],
        isDirected: true,
        isWeighted: false,
        isLabeled: false
      }, {
        p: 'regular'
      })).toBe(true);

      expect(girs.HasGraphProperty({
        vertices: [{
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }, {
          label: '',
          x: 0.0,
          y: 0.0
        }],
        edges: [{
          src: 0,
          dst: 1,
          weight: 1
        }, {
          src: 0,
          dst: 2,
          weight: 1
        }, {
          src: 1,
          dst: 2,
          weight: 1
        }],
        isDirected: true,
        isWeighted: false,
        isLabeled: false
      }, {
        p: 'regular'
      })).toBe(false);
    });
  });
});
