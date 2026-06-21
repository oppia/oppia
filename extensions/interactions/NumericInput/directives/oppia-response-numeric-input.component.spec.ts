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
 * @fileoverview Unit tests for the NumericInput response.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ResponseNumericInput} from './oppia-response-numeric-input.component';

describe('ResponseNumericInput', () => {
  let component: ResponseNumericInput;
  let fixture: ComponentFixture<ResponseNumericInput>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): Object {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseNumericInput],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseNumericInput);
    component = fixture.componentInstance;
  });

  it('should initialise component when users view previous responses', () => {
    component.answer = '20';

    component.ngOnInit();

    expect(component.displayAnswer).toBe(20);
  });

  it('should not round of decimal answers', () => {
    component.answer = '24.5';

    component.ngOnInit();

    expect(component.displayAnswer).toBe(24.5);
  });
});
