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
 * @fileoverview Directive for the ImageClickInput response.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ShortResponseImageClickInput } from './oppia-short-response-image-click-input.component';

describe('ShortResponseImageClickInput', () => {
  let component: ShortResponseImageClickInput;
  let fixture: ComponentFixture<ShortResponseImageClickInput>;
  let mockHtmlEscaperService = {
    escapedJsonToObj: function(answer) {
      return JSON.parse(answer);
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShortResponseImageClickInput],
      providers: [
        {
          provide: HtmlEscaperService,
          useValue: mockHtmlEscaperService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortResponseImageClickInput);
    component = fixture.componentInstance;

    component.answer = '{' +
      '"clickPosition": [' +
      '  0.40913347791798105, ' +
      '  0.39177101967799643 ' +
      '],' +
      '"clickedRegions": ["Region1"]' +
      '}';
  });

  it('should initialise component when user submits answer', () => {
    component.ngOnInit();

    expect(component.clickRegionLabel).toBe('(Clicks on \'Region1\')');
  });
});
