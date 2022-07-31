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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { GraphDetailService } from './graph-detail.service';
import { ResponseGraphInput } from './oppia-response-graph-input.component';

describe('ResponseGraphInput', () => {
  let component: ResponseGraphInput;
  let fixture: ComponentFixture<ResponseGraphInput>;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function(answer: string) {
      return JSON.parse(answer);
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseGraphInput],
      providers: [GraphDetailService,
        {
          provide: HtmlEscaperService,
          useValue: mockHtmlEscaperService
        }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseGraphInput);
    component = fixture.componentInstance;

    component.answer = '{' +
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
      '          "x": 150,' +
      '          "y": 50,' +
      '          "label": ""' +
      '      },' +
      '      {' +
      '          "x": 200,' +
      '          "y": 50,' +
      '          "label": ""' +
      '      },' +
      '      {' +
      '          "x": 150,' +
      '          "y": 100,' +
      '          "label": ""' +
      '      }' +
      '  ],' +
      '  "isLabeled": false' +
      '}';

    component.ngOnInit();
  });

  it('should create', () => {
    component.ngOnInit();

    expect(component.graph).toEqual({
      isWeighted: false,
      edges: [
        {
          src: 0,
          dst: 1,
          weight: 1
        },
        {
          src: 1,
          dst: 2,
          weight: 1
        }
      ],
      isDirected: false,
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
        }
      ],
      isLabeled: false
    });
    expect(component.VERTEX_RADIUS).toBe(6);
    expect(component.EDGE_WIDTH).toBe(3);
  });

  it('should return directed edge arrow points when called', () => {
    expect(component.getDirectedEdgeArrowPoints(0))
      .toBe('196,50 186,45 186,55');
  });

  it('should return edge center when called', () => {
    expect(component.getEdgeCenter(0)).toEqual({ x: 175, y: 50 });
  });
});
