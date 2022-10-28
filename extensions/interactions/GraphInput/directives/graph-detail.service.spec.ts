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
 * @fileoverview Unit test for Detail service for the interaction.
 */


import { async, TestBed } from '@angular/core/testing';
import { GraphAnswer } from 'interactions/answer-defs';
import { GraphDetailService } from './graph-detail.service';

describe('GraphDetailService', () => {
  let graphDetailService: GraphDetailService;
  let graph: GraphAnswer;
  let index = 0;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [GraphDetailService]
    });
  }));

  beforeEach(() => {
    graph = {
      vertices: [
        {
          x: 150,
          y: 50,
          label: ''
        },
        {
          x: 200,
          y: 50,
          label: ''
        },
        {
          x: 150,
          y: 100,
          label: ''
        },
        {
          x: 196.60939025878906,
          y: 95.05902099609375,
          label: ''
        }
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: false,
      edges: [
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]
    };

    graphDetailService = TestBed.inject(GraphDetailService);
  });

  it('should return arrow points when directed option is selected in' +
  'the graph interaction', () => {
    // Pre-checks cannot be used here since all the variables used within
    // the function are private. Here we attempt to test if the
    // function returns the expected output for a specified input.
    expect(graphDetailService.getDirectedEdgeArrowPoints(graph, index))
      .toBe('196,50 186,45 186,55');
  });

  it('should return empty string when edge arrow points are in the same ' +
  'location', () => {
    graph.vertices[0] = graph.vertices[1];
    // Pre-checks cannot be used here since all the variables used within
    // the function are private. Here we attempt to test if the
    // function returns the expected output for a specified input.
    expect(graphDetailService.getDirectedEdgeArrowPoints(graph, index))
      .toBe('');
  });

  it('should return edge center points when weighted option is selected in' +
  'the graph interaction', () => {
    // Pre-checks cannot be used here since all the variables used within
    // the function are private. Here we attempt to test if the
    // function returns the expected output for a specified input.
    expect(graphDetailService.getEdgeCentre(graph, index)).toEqual({
      x: 175,
      y: 50
    });
  });
});
