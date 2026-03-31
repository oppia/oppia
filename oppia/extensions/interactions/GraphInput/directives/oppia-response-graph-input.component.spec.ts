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
 * @fileoverview Unti tests for the GraphInput response.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {GraphDetailService} from './graph-detail.service';
import {ResponseGraphInput} from './oppia-response-graph-input.component';

describe('ResponseGraphInput', () => {
  let component: ResponseGraphInput;
  let fixture: ComponentFixture<ResponseGraphInput>;

  let answerUnlabeledNoNeedToResize =
    '{' +
    '  "isWeighted": false,' +
    '  "edges": [' +
    '      {' +
    '          "src": 0,' +
    '          "dst": 1,' +
    '          "weight": 1' +
    '      },' +
    '      {' +
    '          "src": 1,' +
    '          "dst": 2,' +
    '          "weight": 1' +
    '      }' +
    '  ],' +
    '  "isDirected": false,' +
    '  "vertices": [' +
    '      {' +
    '          "x": 10,' +
    '          "y": 10,' +
    '          "label": ""' +
    '      },' +
    '      {' +
    '          "x": 60,' +
    '          "y": 10,' +
    '          "label": ""' +
    '      },' +
    '      {' +
    '          "x": 10,' +
    '          "y": 60,' +
    '          "label": ""' +
    '      }' +
    '  ],' +
    '  "isLabeled": false' +
    '}';

  let answerLabeledNeedsResize =
    '{' +
    '  "isWeighted": false,' +
    '  "edges": [' +
    '      {' +
    '          "src": 0,' +
    '          "dst": 1,' +
    '          "weight": 1' +
    '      },' +
    '      {' +
    '          "src": 1,' +
    '          "dst": 2,' +
    '          "weight": 1' +
    '      }' +
    '  ],' +
    '  "isDirected": false,' +
    '  "vertices": [' +
    '      {' +
    '          "x": 10,' +
    '          "y": 10,' +
    '          "label": "foo"' +
    '      },' +
    '      {' +
    '          "x": 605,' +
    '          "y": 10,' +
    '          "label": "bar"' +
    '      },' +
    '      {' +
    '          "x": 10,' +
    '          "y": 480,' +
    '          "label": "qux"' +
    '      }' +
    '  ],' +
    '  "isLabeled": true' +
    '}';

  let mockHtmlEscaperService = {
    escapedJsonToObj: function (answer: string) {
      return JSON.parse(answer);
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseGraphInput],
      providers: [
        GraphDetailService,
        {
          provide: HtmlEscaperService,
          useValue: mockHtmlEscaperService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseGraphInput);
    component = fixture.componentInstance;
  });

  it('should create without resize', () => {
    component.answer = answerUnlabeledNoNeedToResize;
    component.ngOnInit();

    expect(component.graph).toEqual({
      isWeighted: false,
      edges: [
        {
          src: 0,
          dst: 1,
          weight: 1,
        },
        {
          src: 1,
          dst: 2,
          weight: 1,
        },
      ],
      isDirected: false,
      vertices: [
        {
          x: 10,
          y: 10,
          label: '',
        },
        {
          x: 60,
          y: 10,
          label: '',
        },
        {
          x: 10,
          y: 60,
          label: '',
        },
      ],
      isLabeled: false,
    });
    expect(component.VERTEX_RADIUS_PX).toBe(6);
    expect(component.EDGE_WIDTH_PX).toBe(3);
    expect(component.MIN_MARGIN_PX).toBe(10);
    expect(component.minX).toBe(10);
    expect(component.minY).toBe(10);
  });

  it('should return directed edge arrow points when called', () => {
    component.answer = answerUnlabeledNoNeedToResize;
    component.ngOnInit();
    expect(component.getDirectedEdgeArrowPoints(0)).toBe('56,10 46,5 46,15');
  });

  it('should return edge center when called', () => {
    component.answer = answerUnlabeledNoNeedToResize;
    component.ngOnInit();
    expect(component.getEdgeCenter(0)).toEqual({x: 35, y: 10});
  });

  it('should return max x when called', () => {
    component.answer = answerUnlabeledNoNeedToResize;
    component.ngOnInit();
    expect(component.getMaxX()).toBe(60);
  });

  it('should return max y when called', () => {
    component.answer = answerUnlabeledNoNeedToResize;
    component.ngOnInit();
    expect(component.getMaxY()).toBe(60);
  });

  it('should create with resize', () => {
    component.answer = answerLabeledNeedsResize;
    component.ngOnInit();

    expect(component.graph).toEqual({
      isWeighted: false,
      edges: [
        {
          src: 0,
          dst: 1,
          weight: 1,
        },
        {
          src: 1,
          dst: 2,
          weight: 1,
        },
      ],
      isDirected: false,
      vertices: [
        {
          x: 6,
          y: 6,
          label: 'foo',
        },
        {
          x: 244,
          y: 6,
          label: 'bar',
        },
        {
          x: 6,
          y: 194,
          label: 'qux',
        },
      ],
      isLabeled: true,
    });
    expect(component.VERTEX_RADIUS_PX).toBe(6);
    expect(component.EDGE_WIDTH_PX).toBe(3);
    expect(component.MIN_MARGIN_PX).toBe(15);
    expect(component.minX).toBe(10);
    expect(component.minY).toBe(10);
  });

  it('should return svg border', () => {
    const svgElement = fixture.nativeElement.querySelector('svg');
    expect(svgElement).toBeTruthy();

    const rectElement = svgElement.querySelector(
      'rect[x="0"]' +
        '[y="0"]' +
        '[width="100%"]' +
        '[height="100%"]' +
        '[fill="none"]' +
        '[stroke="black"]' +
        '[stroke-width="2"]'
    );
    expect(rectElement).toBeTruthy();
  });
});
