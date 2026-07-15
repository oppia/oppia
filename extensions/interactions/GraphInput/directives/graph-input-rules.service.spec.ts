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

import {GraphInputRulesService} from 'interactions/GraphInput/directives/graph-input-rules.service';
import {TestBed} from '@angular/core/testing';
import {GraphAnswer} from 'interactions/answer-defs';

describe('Graph Input service', () => {
  let girs: GraphInputRulesService;
  beforeEach(() => {
    girs = TestBed.get(GraphInputRulesService);
  });

  let undirectedEmptyGraph = (): GraphAnswer => {
    return {
      vertices: [],
      edges: [],
      isDirected: false,
      isWeighted: false,
      isLabeled: false,
    };
  };

  let undirectedNullGraph = (numVertices: number): GraphAnswer => {
    var graph = undirectedEmptyGraph();
    for (var i = 0; i < numVertices; i++) {
      graph.vertices.push({
        label: '',
        x: 0.0,
        y: 0.0,
      });
    }
    return graph;
  };

  let undirectedCycleGraph = (numVertices: number): GraphAnswer => {
    var graph = undirectedNullGraph(numVertices);
    if (numVertices === 1) {
      return graph;
    }
    for (var i = 0; i < numVertices; i++) {
      graph.edges.push({
        src: i,
        dst: (i + 1) % numVertices,
        weight: 1,
      });
    }
    return graph;
  };

  let undirectedCompleteGraph = (numVertices: number): GraphAnswer => {
    var graph = undirectedNullGraph(numVertices);
    for (var i = 0; i < numVertices; i++) {
      for (var j = i + 1; j < numVertices; j++) {
        graph.edges.push({
          src: i,
          dst: j,
          weight: 1,
        });
      }
    }
    return graph;
  };

  let undirectedStarGraph = (numVertices: number): GraphAnswer => {
    var graph = undirectedNullGraph(numVertices);
    for (var i = 1; i < numVertices; i++) {
      graph.edges.push({
        src: 0,
        dst: i,
        weight: 1,
      });
    }
    return graph;
  };

  let directedEmptyGraph = (): GraphAnswer => {
    return {
      vertices: [],
      edges: [],
      isDirected: true,
      isWeighted: false,
      isLabeled: false,
    };
  };

  let directedNullGraph = (numVertices: number): GraphAnswer => {
    var graph = directedEmptyGraph();
    for (var i = 0; i < numVertices; i++) {
      graph.vertices.push({
        label: '',
        x: 0.0,
        y: 0.0,
      });
    }
    return graph;
  };

  let directedCycleGraph = (numVertices: number): GraphAnswer => {
    var graph = directedNullGraph(numVertices);
    if (numVertices === 1) {
      return graph;
    }
    for (var i = 0; i < numVertices; i++) {
      graph.edges.push({
        src: i,
        dst: (i + 1) % numVertices,
        weight: 1,
      });
    }
    return graph;
  };

  describe("'is isomorphic to' rule", () => {
    it('should match graphs which are the same', () => {
      expect(
        girs.IsIsomorphicTo(undirectedEmptyGraph(), {
          g: undirectedEmptyGraph(),
        })
      ).toBe(true);

      expect(
        girs.IsIsomorphicTo(undirectedCycleGraph(5), {
          g: undirectedCycleGraph(5),
        })
      ).toBe(true);

      expect(
        girs.IsIsomorphicTo(directedCycleGraph(6), {
          g: directedCycleGraph(6),
        })
      ).toBe(true);
    });

    it('should match isomorphic graphs', () => {
      expect(
        girs.IsIsomorphicTo(undirectedCycleGraph(5), {
          g: {
            vertices: [
              {
                label: '',
                x: 1.0,
                y: 1.0,
              },
              {
                label: '',
                x: 1.0,
                y: 1.0,
              },
              {
                label: '',
                x: 1.0,
                y: 1.0,
              },
              {
                label: '',
                x: 1.0,
                y: 1.0,
              },
              {
                label: '',
                x: 1.0,
                y: 1.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 2,
                weight: 1,
              },
              {
                src: 2,
                dst: 4,
                weight: 1,
              },
              {
                src: 4,
                dst: 1,
                weight: 1,
              },
              {
                src: 1,
                dst: 3,
                weight: 1,
              },
              {
                src: 3,
                dst: 0,
                weight: 1,
              },
            ],
            isDirected: false,
            isWeighted: false,
            isLabeled: false,
          },
        })
      ).toBe(true);
    });

    it('should match isomorphic graphs with labels', () => {
      expect(
        girs.IsIsomorphicTo(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 3.0,
                y: 3.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: false,
            isWeighted: false,
            isLabeled: true,
          },
          {
            g: {
              vertices: [
                {
                  label: 'c',
                  x: 1.0,
                  y: 1.0,
                },
                {
                  label: 'a',
                  x: 2.0,
                  y: 2.0,
                },
                {
                  label: 'b',
                  x: 3.0,
                  y: 3.0,
                },
              ],
              edges: [
                {
                  src: 2,
                  dst: 1,
                  weight: 1,
                },
              ],
              isDirected: false,
              isWeighted: false,
              isLabeled: true,
            },
          }
        )
      ).toBe(true);
    });

    it('should match isomorphic graphs with labels and weights', () => {
      expect(
        girs.IsIsomorphicTo(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 3.0,
                y: 3.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 2,
              },
              {
                src: 1,
                dst: 2,
                weight: 1,
              },
            ],
            isDirected: false,
            isWeighted: true,
            isLabeled: true,
          },
          {
            g: {
              vertices: [
                {
                  label: 'b',
                  x: 1.0,
                  y: 1.0,
                },
                {
                  label: 'a',
                  x: 2.0,
                  y: 2.0,
                },
                {
                  label: 'c',
                  x: 3.0,
                  y: 3.0,
                },
              ],
              edges: [
                {
                  src: 2,
                  dst: 0,
                  weight: 1,
                },
                {
                  src: 1,
                  dst: 0,
                  weight: 2,
                },
              ],
              isDirected: false,
              isWeighted: true,
              isLabeled: true,
            },
          }
        )
      ).toBe(true);
    });

    it('should match directed and undirected graphs', () => {
      expect(
        girs.IsIsomorphicTo(
          {
            vertices: [
              {
                label: '',
                x: 1.0,
                y: 1.0,
              },
              {
                label: '',
                x: 2.0,
                y: 2.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: false,
            isWeighted: false,
            isLabeled: false,
          },
          {
            g: {
              vertices: [
                {
                  label: '',
                  x: 1.0,
                  y: 1.0,
                },
                {
                  label: '',
                  x: 2.0,
                  y: 2.0,
                },
              ],
              edges: [
                {
                  src: 0,
                  dst: 1,
                  weight: 1,
                },
                {
                  src: 1,
                  dst: 0,
                  weight: 1,
                },
              ],
              isDirected: true,
              isWeighted: false,
              isLabeled: false,
            },
          }
        )
      ).toBe(true);
    });

    it('should not match simple graphs with different edges', () => {
      expect(
        girs.IsIsomorphicTo(undirectedCycleGraph(3), {
          g: undirectedNullGraph(3),
        })
      ).toBe(false);

      expect(
        girs.IsIsomorphicTo(undirectedNullGraph(3), {
          g: undirectedCycleGraph(3),
        })
      ).toBe(false);

      expect(
        girs.IsIsomorphicTo(undirectedCompleteGraph(4), {
          g: undirectedCycleGraph(4),
        })
      ).toBe(false);

      expect(
        girs.IsIsomorphicTo(undirectedCycleGraph(4), {
          g: undirectedCompleteGraph(4),
        })
      ).toBe(false);

      expect(
        girs.IsIsomorphicTo(directedCycleGraph(4), {
          g: undirectedCompleteGraph(4),
        })
      ).toBe(false);
    });

    it('should not match graphs with different numbers of nodes', () => {
      expect(
        girs.IsIsomorphicTo(undirectedNullGraph(3), {
          g: undirectedNullGraph(6),
        })
      ).toBe(false);
    });

    it('should not match graphs with different edges', () => {
      expect(
        girs.IsIsomorphicTo(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 3.0,
                y: 3.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 2,
              },
              {
                src: 1,
                dst: 2,
                weight: 2,
              },
            ],
            isDirected: false,
            isWeighted: true,
            isLabeled: true,
          },
          {
            g: {
              vertices: [
                {
                  label: 'b',
                  x: 1.0,
                  y: 1.0,
                },
                {
                  label: 'a',
                  x: 2.0,
                  y: 2.0,
                },
                {
                  label: 'c',
                  x: 3.0,
                  y: 3.0,
                },
              ],
              edges: [
                {
                  src: 0,
                  dst: 1,
                  weight: 1,
                },
                {
                  src: 0,
                  dst: 2,
                  weight: 2,
                },
              ],
              isDirected: false,
              isWeighted: true,
              isLabeled: true,
            },
          }
        )
      ).toBe(false);
    });

    it('should not match graphs with different edge weights', () => {
      expect(
        girs.IsIsomorphicTo(
          {
            vertices: [
              {
                label: '',
                x: 1.0,
                y: 1.0,
              },
              {
                label: '',
                x: 2.0,
                y: 2.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: false,
            isWeighted: true,
            isLabeled: false,
          },
          {
            g: {
              vertices: [
                {
                  label: '',
                  x: 1.0,
                  y: 1.0,
                },
                {
                  label: '',
                  x: 2.0,
                  y: 2.0,
                },
              ],
              edges: [
                {
                  src: 0,
                  dst: 1,
                  weight: 2,
                },
              ],
              isDirected: false,
              isWeighted: true,
              isLabeled: false,
            },
          }
        )
      ).toBe(false);
    });

    it('should not match graphs with different labels', () => {
      expect(
        girs.IsIsomorphicTo(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 2,
              },
            ],
            isDirected: false,
            isWeighted: true,
            isLabeled: true,
          },
          {
            g: {
              vertices: [
                {
                  label: 'a',
                  x: 1.0,
                  y: 1.0,
                },
                {
                  label: 'c',
                  x: 2.0,
                  y: 2.0,
                },
              ],
              edges: [
                {
                  src: 0,
                  dst: 1,
                  weight: 2,
                },
              ],
              isDirected: false,
              isWeighted: true,
              isLabeled: true,
            },
          }
        )
      ).toBe(false);
    });
  });

  describe("'is weakly connected' rule", () => {
    it('should return true on undirected connected graphs', () => {
      expect(
        girs.HasGraphProperty(undirectedEmptyGraph(), {
          p: 'weakly_connected',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedCycleGraph(5), {
          p: 'weakly_connected',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedStarGraph(4), {
          p: 'weakly_connected',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedCompleteGraph(6), {
          p: 'weakly_connected',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 2,
              },
              {
                src: 2,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: false,
            isWeighted: true,
            isLabeled: true,
          },
          {
            p: 'weakly_connected',
          }
        )
      ).toBe(true);
    });

    it('should return true on directed weakly connected graphs', () => {
      expect(
        girs.HasGraphProperty(directedCycleGraph(4), {
          p: 'weakly_connected',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 2,
              },
              {
                src: 2,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: true,
            isWeighted: true,
            isLabeled: true,
          },
          {
            p: 'weakly_connected',
          }
        )
      ).toBe(true);
    });

    it('should return false for disconnected graphs', () => {
      expect(
        girs.HasGraphProperty(undirectedNullGraph(2), {
          p: 'weakly_connected',
        })
      ).toBe(false);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 2,
              },
            ],
            isDirected: false,
            isWeighted: true,
            isLabeled: true,
          },
          {
            p: 'weakly_connected',
          }
        )
      ).toBe(false);
    });
  });

  describe("'is strongly connected' rule", () => {
    it('should return true for undirected connected graphs', () => {
      expect(
        girs.HasGraphProperty(undirectedEmptyGraph(), {
          p: 'strongly_connected',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedCycleGraph(5), {
          p: 'strongly_connected',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedCompleteGraph(6), {
          p: 'strongly_connected',
        })
      ).toBe(true);
    });

    it('should return true for directed strongly connected graphs', () => {
      expect(
        girs.HasGraphProperty(directedCycleGraph(6), {
          p: 'strongly_connected',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 3.0,
                y: 3.0,
              },
              {
                label: 'd',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
              {
                src: 1,
                dst: 2,
                weight: 2,
              },
              {
                src: 2,
                dst: 0,
                weight: 3,
              },
              {
                src: 0,
                dst: 3,
                weight: 3,
              },
              {
                src: 3,
                dst: 2,
                weight: 3,
              },
            ],
            isDirected: true,
            isWeighted: true,
            isLabeled: true,
          },
          {
            p: 'strongly_connected',
          }
        )
      ).toBe(true);
    });

    it('should return false for disconnected graphs', () => {
      expect(
        girs.HasGraphProperty(undirectedNullGraph(2), {
          p: 'strongly_connected',
        })
      ).toBe(false);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: true,
            isWeighted: true,
            isLabeled: true,
          },
          {
            p: 'strongly_connected',
          }
        )
      ).toBe(false);
    });

    it('should return false for graphs that are only weakly connected', () => {
      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: 'a',
                x: 1.0,
                y: 1.0,
              },
              {
                label: 'b',
                x: 2.0,
                y: 2.0,
              },
              {
                label: 'c',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 2,
              },
              {
                src: 2,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: true,
            isWeighted: true,
            isLabeled: true,
          },
          {
            p: 'strongly_connected',
          }
        )
      ).toBe(false);
    });
  });

  describe("'is acyclic' rule", () => {
    it('should return true on acyclic graphs', () => {
      expect(
        girs.HasGraphProperty(undirectedEmptyGraph(), {
          p: 'acyclic',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedCompleteGraph(2), {
          p: 'acyclic',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedStarGraph(4), {
          p: 'acyclic',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: 'a',
                x: 0.0,
                y: 0.0,
              },
              {
                label: 'b',
                x: 0.0,
                y: 0.0,
              },
              {
                label: 'c',
                x: 0.0,
                y: 0.0,
              },
              {
                label: 'd',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 2,
                weight: 2,
              },
              {
                src: 2,
                dst: 3,
                weight: 4,
              },
              {
                src: 1,
                dst: 3,
                weight: 123,
              },
            ],
            isDirected: false,
            isWeighted: true,
            isLabeled: true,
          },
          {
            p: 'acyclic',
          }
        )
      ).toBe(true);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: 'a',
                x: 0.0,
                y: 0.0,
              },
              {
                label: 'b',
                x: 0.0,
                y: 0.0,
              },
              {
                label: 'c',
                x: 0.0,
                y: 0.0,
              },
              {
                label: 'd',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 2,
              },
              {
                src: 2,
                dst: 1,
                weight: 4,
              },
              {
                src: 3,
                dst: 1,
                weight: 123,
              },
            ],
            isDirected: false,
            isWeighted: true,
            isLabeled: true,
          },
          {
            p: 'acyclic',
          }
        )
      ).toBe(true);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
              {
                src: 0,
                dst: 2,
                weight: 1,
              },
              {
                src: 1,
                dst: 2,
                weight: 1,
              },
            ],
            isDirected: true,
            isWeighted: false,
            isLabeled: false,
          },
          {
            p: 'acyclic',
          }
        )
      ).toBe(true);
    });

    it('should return false on graphs with cycles', () => {
      expect(
        girs.HasGraphProperty(undirectedCycleGraph(5), {
          p: 'acyclic',
        })
      ).toBe(false);

      expect(
        girs.HasGraphProperty(directedCycleGraph(6), {
          p: 'acyclic',
        })
      ).toBe(false);

      expect(
        girs.HasGraphProperty(undirectedCompleteGraph(4), {
          p: 'acyclic',
        })
      ).toBe(false);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
              {
                src: 2,
                dst: 0,
                weight: 1,
              },
              {
                src: 1,
                dst: 2,
                weight: 1,
              },
            ],
            isDirected: true,
            isWeighted: false,
            isLabeled: false,
          },
          {
            p: 'acyclic',
          }
        )
      ).toBe(false);
    });
  });

  describe("'is regular' rule", () => {
    it('should detect undirected regular graphs', () => {
      expect(
        girs.HasGraphProperty(undirectedEmptyGraph(), {
          p: 'regular',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedNullGraph(9), {
          p: 'regular',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedCompleteGraph(8), {
          p: 'regular',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedCycleGraph(3), {
          p: 'regular',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedCycleGraph(4), {
          p: 'regular',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(undirectedStarGraph(4), {
          p: 'regular',
        })
      ).toBe(false);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: false,
            isWeighted: false,
            isLabeled: false,
          },
          {
            p: 'regular',
          }
        )
      ).toBe(false);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
              {
                src: 2,
                dst: 1,
                weight: 1,
              },
              {
                src: 3,
                dst: 1,
                weight: 1,
              },
            ],
            isDirected: false,
            isWeighted: false,
            isLabeled: false,
          },
          {
            p: 'regular',
          }
        )
      ).toBe(false);
    });

    it('should detect directed regular graphs', () => {
      expect(
        girs.HasGraphProperty(directedCycleGraph(4), {
          p: 'regular',
        })
      ).toBe(true);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
              {
                src: 2,
                dst: 0,
                weight: 1,
              },
              {
                src: 1,
                dst: 2,
                weight: 1,
              },
            ],
            isDirected: true,
            isWeighted: false,
            isLabeled: false,
          },
          {
            p: 'regular',
          }
        )
      ).toBe(true);

      expect(
        girs.HasGraphProperty(
          {
            vertices: [
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
              {
                label: '',
                x: 0.0,
                y: 0.0,
              },
            ],
            edges: [
              {
                src: 0,
                dst: 1,
                weight: 1,
              },
              {
                src: 0,
                dst: 2,
                weight: 1,
              },
              {
                src: 1,
                dst: 2,
                weight: 1,
              },
            ],
            isDirected: true,
            isWeighted: false,
            isLabeled: false,
          },
          {
            p: 'regular',
          }
        )
      ).toBe(false);
    });
  });

  describe(
    "'is not strongly_connected, weakly_connected, acyclic" +
      " and regular' rule",
    () => {
      it('should return false for no rule', () => {
        expect(
          girs.HasGraphProperty(undirectedEmptyGraph(), {
            p: 'no_rule',
          })
        ).toBe(false);

        expect(
          girs.HasGraphProperty(undirectedNullGraph(9), {
            p: 'no_rule',
          })
        ).toBe(false);

        expect(
          girs.HasGraphProperty(undirectedCompleteGraph(8), {
            p: 'no_rule',
          })
        ).toBe(false);

        expect(
          girs.HasGraphProperty(undirectedCycleGraph(3), {
            p: 'no_rule',
          })
        ).toBe(false);

        expect(
          girs.HasGraphProperty(undirectedCycleGraph(4), {
            p: 'no_rule',
          })
        ).toBe(false);

        expect(
          girs.HasGraphProperty(undirectedStarGraph(4), {
            p: 'no_rule',
          })
        ).toBe(false);

        expect(
          girs.HasGraphProperty(
            {
              vertices: [
                {
                  label: '',
                  x: 0.0,
                  y: 0.0,
                },
                {
                  label: '',
                  x: 0.0,
                  y: 0.0,
                },
                {
                  label: '',
                  x: 0.0,
                  y: 0.0,
                },
              ],
              edges: [
                {
                  src: 0,
                  dst: 1,
                  weight: 1,
                },
              ],
              isDirected: false,
              isWeighted: false,
              isLabeled: false,
            },
            {
              p: 'no_rule',
            }
          )
        ).toBe(false);

        expect(
          girs.HasGraphProperty(
            {
              vertices: [
                {
                  label: '',
                  x: 0.0,
                  y: 0.0,
                },
                {
                  label: '',
                  x: 0.0,
                  y: 0.0,
                },
                {
                  label: '',
                  x: 0.0,
                  y: 0.0,
                },
                {
                  label: '',
                  x: 0.0,
                  y: 0.0,
                },
              ],
              edges: [
                {
                  src: 0,
                  dst: 1,
                  weight: 1,
                },
                {
                  src: 2,
                  dst: 1,
                  weight: 1,
                },
                {
                  src: 3,
                  dst: 1,
                  weight: 1,
                },
              ],
              isDirected: false,
              isWeighted: false,
              isLabeled: false,
            },
            {
              p: 'no_rule',
            }
          )
        ).toBe(false);
      });
    }
  );
});
