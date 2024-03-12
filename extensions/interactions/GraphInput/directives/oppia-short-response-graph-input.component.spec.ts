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
 * @fileoverview Unit tests for the GraphInput short response.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ShortResponseGraphInput} from './oppia-short-response-graph-input.component';

describe('ShortResponseGraphInput', () => {
  let component: ShortResponseGraphInput;
  let fixture: ComponentFixture<ShortResponseGraphInput>;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function (answer: string) {
      return JSON.parse(answer);
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en',
        }),
      ],
      declarations: [ShortResponseGraphInput],
      providers: [
        {
          provide: HtmlEscaperService,
          useValue: mockHtmlEscaperService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortResponseGraphInput);
    component = fixture.componentInstance;

    component.answer =
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
  });

  it('should create', () => {
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
          x: 150,
          y: 50,
          label: '',
        },
        {
          x: 200,
          y: 50,
          label: '',
        },
        {
          x: 150,
          y: 100,
          label: '',
        },
      ],
      isLabeled: false,
    });
  });
});
