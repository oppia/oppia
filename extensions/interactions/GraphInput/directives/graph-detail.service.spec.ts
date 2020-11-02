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
 * @fileoverview Unit tests for graph detail service.
 */
import { TestBed } from '@angular/core/testing';

import { GraphDetailService } from
  'interactions/GraphInput/directives/graph-detail.service.ts';


describe('GraphDetailService', () => {
  let gds: GraphDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GraphDetailService]
    });

    gds = TestBed.get(GraphDetailService);
  });

  it('should be able to return directed adge arrow points', () => {
    var graph1 = {
      isWeighted: true,
      edges: [
        {src: 0, dst: 1, weight: 1, $$hashKey: 'object:319'},
        {src: 1, dst: 2, weight: 1, $$hashKey: 'object:320'}
      ],
      isDirected: true,
      vertices: [
        {x: 150, y: 50, label: '', $$hashKey: 'object:323'},
        {x: 200, y: 50, label: '', $$hashKey: 'object:324'},
        {x: 150, y: 100, label: '', $$hashKey: 'object:325'}
      ],
      isLabeled: false
    };

    var graph2 = {
      isWeighted: true,
      edges: [
        {src: 0, dst: 0, weight: 1, $$hashKey: 'object:319'},
      ],
      isDirected: true,
      vertices: [
        {x: 283.5625, y: 72.95833587646484, label: '', $$hashKey: 'object:352'},
        {x: 281.5625, y: 182.9583282470703, label: '', $$hashKey: 'object:368'}
      ],
      isLabeled: false
    };

    expect(gds.getDirectedEdgeArrowPoints(graph1, 0)).toBe(
      '196,50 186,45 186,55');
    expect(gds.getDirectedEdgeArrowPoints(graph2, 0)).toBe('');
  });

  it('should be able to return edgecentre', () => {
    var graph = {
      isWeighted: true,
      edges: [
        {src: 0, dst: 1, weight: 1, $$hashKey: 'object:319'},
      ],
      isDirected: true,
      vertices: [
        {x: 150, y: 50, label: '', $$hashKey: 'object:327'},
        {x: 200, y: 50, label: '', $$hashKey: 'object:328'}
      ],
      isLabeled: false
    };

    var index = 0;

    var result = {x: 175, y: 50};

    expect(gds.getEdgeCentre(graph, index)).toEqual(result);
  });
});
