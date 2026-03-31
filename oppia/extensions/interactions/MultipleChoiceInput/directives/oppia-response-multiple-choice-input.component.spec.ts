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
 * @fileoverview Unit tests for the MultipleChoiceInput response.
 */
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ResponseMultipleChoiceInputComponent} from './oppia-response-multiple-choice-input.component';

describe('ResponseMultipleChoiceInputComponent', () => {
  let component: ResponseMultipleChoiceInputComponent;
  let fixture: ComponentFixture<ResponseMultipleChoiceInputComponent>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseMultipleChoiceInputComponent],
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
    fixture = TestBed.createComponent(ResponseMultipleChoiceInputComponent);
    component = fixture.componentInstance;
    component.answer = '1';
    component.choices =
      '[{' +
      '"_html": "opt1",' +
      '"contentId": "ca_choices_9"' +
      '}, {' +
      '"_html": "opt2",' +
      '"contentId": "ca_choices_10"' +
      '}, {' +
      '"_html": "opt3",' +
      '"contentId": "ca_choices_11"' +
      '}, {' +
      '"_html": "opt4",' +
      '"contentId": "ca_choices_12"' +
      '}]';
  });

  it('should initialise component when user submits answer', () => {
    component.ngOnInit();

    expect(component.response).toBe('opt2');
  });
});
