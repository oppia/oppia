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
 * @fileoverview Component for the ItemSelectionInput short response.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ShortResponseItemSelectionInputComponent} from './oppia-short-response-item-selection-input.component';

describe('ShortResponseItemSelectionInput', () => {
  let component: ShortResponseItemSelectionInputComponent;
  let fixture: ComponentFixture<ShortResponseItemSelectionInputComponent>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShortResponseItemSelectionInputComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortResponseItemSelectionInputComponent);
    component = fixture.componentInstance;
    component.answer = '["ca_choices_1"]';
    component.choices =
      '[{' +
      '"_html": "choice 1",' +
      '"_contentId": "ca_choices_1"' +
      '}, {' +
      '"_html": "choice 2",' +
      '"_contentId": "ca_choices_2"' +
      '}, {' +
      '"_html": "choice 3",' +
      '"_contentId": "ca_choices_3"' +
      '}]';
  });

  it('should initialise component when user submits answer', () => {
    component.ngOnInit();

    expect(component.responses).toEqual(['choice 1']);
  });
});
