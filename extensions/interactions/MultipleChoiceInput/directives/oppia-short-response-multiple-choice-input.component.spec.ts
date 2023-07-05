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
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ShortResponseMultipleChoiceInputComponent } from './oppia-short-response-multiple-choice-input.component';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import { TruncateAtFirstLinePipe } from 'filters/string-utility-filters/truncate-at-first-line.pipe';

describe('ShortResponseMultipleChoiceInputComponent', () => {
  let component: ShortResponseMultipleChoiceInputComponent;
  let fixture: ComponentFixture<ShortResponseMultipleChoiceInputComponent>;
  let convertToPlainTextPipe: ConvertToPlainTextPipe;
  let truncateAtFirstLinePipe: TruncateAtFirstLinePipe;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShortResponseMultipleChoiceInputComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        },
        ConvertToPlainTextPipe,
        TruncateAtFirstLinePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    convertToPlainTextPipe = TestBed.inject(ConvertToPlainTextPipe);
    truncateAtFirstLinePipe = TestBed.inject(TruncateAtFirstLinePipe);
    fixture = TestBed
      .createComponent(ShortResponseMultipleChoiceInputComponent);
    component = fixture.componentInstance;
    component.answer = '1';
    component.choices = '[{' +
      '"_html": "opt1",' +
      '"_contentId": "ca_choices_1"' +
    '}, {' +
      '"_html": "opt2",' +
      '"_contentId": "ca_choices_2"' +
    '}, {' +
      '"_html": "opt3",' +
      '"_contentId": "ca_choices_3"' +
    '}, {' +
      '"_html": "opt4",' +
      '"_contentId": "ca_choices_4"' +
    '}]';
  });

  it('should initialise component when user submits answer', () => {
    spyOn(convertToPlainTextPipe, 'transform').and.callFake((response) => {
      return response;
    });
    spyOn(truncateAtFirstLinePipe, 'transform').and.callFake((response) => {
      return response;
    });

    component.ngOnInit();

    expect(component.response).toBe('opt2');
  });
});
