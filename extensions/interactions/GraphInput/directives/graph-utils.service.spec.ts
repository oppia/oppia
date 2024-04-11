// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for graph utils service.
 */

import {TestBed} from '@angular/core/testing';
import {GraphUtilsService} from 'interactions/GraphInput/directives/graph-utils.service';

describe('graphUtilsService', () => {
  let utilsService: GraphUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GraphUtilsService],
    });
    utilsService = TestBed.inject(GraphUtilsService);
  });

  it('should create adjacency lists from a graph', () => {
    expect(
      utilsService.constructAdjacencyLists(
        {
          vertices: [
            {
              x: 1.0,
              y: 1.0,
              label: 'a',
            },
            {
              x: 2.0,
              y: 2.0,
              label: 'b',
            },
            {
              x: 3.0,
              y: 3.0,
              label: 'c',
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
          ],
          isDirected: false,
          isWeighted: true,
          isLabeled: true,
        },
        'undirected'
      )
    ).toEqual([[1], [0, 2], [1]]);
    expect(
      utilsService.constructAdjacencyLists(
        {
          vertices: [
            {
              x: 1.0,
              y: 1.0,
              label: 'a',
            },
            {
              x: 2.0,
              y: 2.0,
              label: 'b',
            },
            {
              x: 3.0,
              y: 3.0,
              label: 'c',
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
          ],
          isDirected: true,
          isWeighted: true,
          isLabeled: true,
        },
        'directed'
      )
    ).toEqual([[1], [2], []]);
  });

  it('should mark vertices accessible', () => {
    let startVertex: number = 0;
    let adjacencyLists: number[][] = [[1], [0, 2], [1]];
    let isvisited: boolean[] = [false, false, false];
    utilsService.markAccessible(startVertex, adjacencyLists, isvisited);
    expect(isvisited).toEqual([true, true, true]);
    isvisited = [false, false, false];
    adjacencyLists = [[1], [2], []];
    utilsService.markAccessible(startVertex, adjacencyLists, isvisited);
    expect(isvisited).toEqual([true, true, true]);
  });

  it('should check for cycle in the graph', () => {
    let currentVertex: number = 0;
    let previousVertex: number = 0;
    let adjacencyLists: number[][] = [[1], [0, 2], [1]];
    let nodeStatus: string[] = ['unvisited', 'unvisited', 'unvisited'];
    let isDirected: boolean = false;
    let ans = utilsService.findCycle(
      currentVertex,
      previousVertex,
      adjacencyLists,
      nodeStatus,
      isDirected
    );
    expect(ans).toEqual(false);
    adjacencyLists = [[1], [2], []];
    isDirected = true;
    currentVertex = 0;
    previousVertex = 0;
    nodeStatus = ['unvisited', 'unvisited', 'unvisited'];
    ans = utilsService.findCycle(
      currentVertex,
      previousVertex,
      adjacencyLists,
      nodeStatus,
      isDirected
    );
    expect(ans).toEqual(false);
    adjacencyLists = [
      [1, 2],
      [0, 2],
      [1, 0],
    ];
    isDirected = false;
    currentVertex = 0;
    previousVertex = 0;
    nodeStatus = ['unvisited', 'unvisited', 'unvisited'];
    ans = utilsService.findCycle(
      currentVertex,
      previousVertex,
      adjacencyLists,
      nodeStatus,
      isDirected
    );
    expect(ans).toEqual(true);
  });

  it('should construct an adjacency matrix from a graph', () => {
    expect(
      utilsService.constructAdjacencyMatrix({
        vertices: [
          {
            x: 1.0,
            y: 1.0,
            label: 'a',
          },
          {
            x: 2.0,
            y: 2.0,
            label: 'b',
          },
          {
            x: 3.0,
            y: 3.0,
            label: 'c',
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
        ],
        isDirected: false,
        isWeighted: true,
        isLabeled: true,
      })
    ).toEqual([
      [null, 1, null],
      [1, null, 2],
      [null, 2, null],
    ]);
    expect(
      utilsService.constructAdjacencyMatrix({
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
          {
            src: 1,
            dst: 2,
            weight: 2,
          },
        ],
        isDirected: false,
        isWeighted: false,
        isLabeled: true,
      })
    ).toEqual([
      [null, 1, null],
      [1, null, 1],
      [null, 1, null],
    ]);
  });

  it('should find the next lexicographical permutation', () => {
    let permutation: number[] | null = [0, 1, 2, 3];

    [
      [0, 1, 3, 2],
      [0, 2, 1, 3],
      [0, 2, 3, 1],
      [0, 3, 1, 2],
      [0, 3, 2, 1],
      [1, 0, 2, 3],
      [1, 0, 3, 2],
      [1, 2, 0, 3],
      [1, 2, 3, 0],
      [1, 3, 0, 2],
      [1, 3, 2, 0],
      [2, 0, 1, 3],
      [2, 0, 3, 1],
      [2, 1, 0, 3],
      [2, 1, 3, 0],
      [2, 3, 0, 1],
      [2, 3, 1, 0],
      [3, 0, 1, 2],
      [3, 0, 2, 1],
      [3, 1, 0, 2],
      [3, 1, 2, 0],
      [3, 2, 0, 1],
      [3, 2, 1, 0],
    ].forEach(expectedPermutation => {
      if (!permutation) {
        return;
      }

      permutation = utilsService.nextPermutation(permutation);
      expect(permutation).toEqual(expectedPermutation);
    });

    permutation = utilsService.nextPermutation(permutation);
    expect(permutation).toBe(null);
  });

  it('should compare adjacency matrices with a permutation', () => {
    expect(
      utilsService.areAdjacencyMatricesEqualWithPermutation(
        [
          [null, 1, 1],
          [2, null, 1],
          [1, 1, null],
        ],
        [
          [null, 1, 1],
          [2, null, 1],
          [1, 1, null],
        ],
        [0, 1, 2]
      )
    ).toBe(true);
    expect(
      utilsService.areAdjacencyMatricesEqualWithPermutation(
        [
          [null, 1, 1],
          [2, null, 1],
          [1, 1, null],
        ],
        [
          [null, 1, null],
          [2, null, 1],
          [1, 1, null],
        ],
        [0, 1, 2]
      )
    ).toBe(false);
    expect(
      utilsService.areAdjacencyMatricesEqualWithPermutation(
        [
          [null, 1, 2],
          [2, null, 1],
          [1, 1, null],
        ],
        [
          [null, 1, 1],
          [2, null, 1],
          [1, 2, null],
        ],
        [2, 0, 1]
      )
    ).toBe(true);
  });
});
