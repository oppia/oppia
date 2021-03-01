// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import { TestBed } from '@angular/core/testing';
import { GraphUtilsService } from 'interactions/GraphInput/directives/graph-utils.service';


describe('GraphUtilsService', () => {
  let utilsService: GraphUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GraphUtilsService],
    });
    utilsService = TestBed.inject(GraphUtilsService);
  });

  it('should create adjacency lists from a graph', () => {
    expect(utilsService.constructAdjacencyLists({
      vertices: [{
        x: 1.0,
        y: 1.0,
        label: 'a'
      }, {
        x: 2.0,
        y: 2.0,
        label: 'b'
      }, {
        x: 3.0,
        y: 3.0,
        label: 'c'
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
    }, 'undirected'
    )).toEqual([
      [1],
      [0, 2],
      [1]]);
    expect(utilsService.constructAdjacencyLists({
      vertices: [{
        x: 1.0,
        y: 1.0,
        label: 'a'
      }, {
        x: 2.0,
        y: 2.0,
        label: 'b'
      }, {
        x: 3.0,
        y: 3.0,
        label: 'c'
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
      isDirected: true,
      isWeighted: true,
      isLabeled: true
    }, 'directed'
    )).toEqual([
      [1],
      [2],
      []]);
  });

  it('should mark vertices accessible', () => {
    let startVertex: number = 0;
    let adjacencyLists: number[][] = [
      [1],
      [0, 2],
      [1]];
    let isvisited: boolean[] = [false, false, false];
    utilsService.markAccessible(startVertex, adjacencyLists, isvisited);
    expect(isvisited).toEqual([true, true, true]);
    isvisited = [false, false, false];
    adjacencyLists = [[1], [2], []];
    utilsService.markAccessible(startVertex, adjacencyLists, isvisited);
    expect(isvisited).toEqual([true, true, true]);
  });
});

