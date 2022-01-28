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
 * @fileoverview Unit tests for the NumericInput short response.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ShortResponseNumericInput } from './oppia-short-response-numeric-input.component';
import { NumberConversionService } from 'services/number-conversion.service';

describe('ShortResponseNumericInput', () => {
  let component: ShortResponseNumericInput;
  let fixture: ComponentFixture<ShortResponseNumericInput>;
  let numberConversionService: NumberConversionService;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): Object {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShortResponseNumericInput],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortResponseNumericInput);
    component = fixture.componentInstance;
    numberConversionService = TestBed.inject(NumberConversionService);
  });

  it('should initialise component when users view previous responses', () => {
    component.answer = '20';

    spyOn(numberConversionService, 'currentDecimalSeparator')
      .and.returnValue('.');

    component.ngOnInit();

    expect(component.displayAnswer).toBe('20');
  });

  it('should not round of decimal answers', () => {
    component.answer = '24.5';

    spyOn(numberConversionService, 'currentDecimalSeparator')
      .and.returnValue('.');

    component.ngOnInit();

    expect(component.displayAnswer).toBe('24.5');
  });
});
