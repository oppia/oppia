// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the NumberWithUnits response.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ResponseNumberWithUnitsComponent} from './oppia-response-number-with-units.component';

describe('ShortResponseRatioExpressionInput', () => {
  let component: ResponseNumberWithUnitsComponent;
  let fixture: ComponentFixture<ResponseNumberWithUnitsComponent>;

  class MockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseNumberWithUnitsComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: MockHtmlEscaperService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseNumberWithUnitsComponent);
    component = fixture.componentInstance;
  });

  it('should initialise component when user submits answer', () => {
    component.answer =
      '{' +
      '"type": "real", ' +
      '"real": 24, ' +
      '"fraction": {' +
      '"isNegative": false, ' +
      '"wholeNumber": 0, ' +
      '"numerator": 0, ' +
      '"denominator": 1' +
      '}, ' +
      '"units": [' +
      '{' +
      '"unit": "km", ' +
      '"exponent": 1' +
      '}' +
      ']' +
      '}';

    component.ngOnInit();

    expect(component.responses).toEqual('24 km');
  });
});
