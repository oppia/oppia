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
 * @fileoverview Unit tests for the CodeRepl short response.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ShortResponseCodeRepl } from './oppia-short-response-code-repl.component';
import { TruncateAtFirstLinePipe } from 'filters/string-utility-filters/truncate-at-first-line.pipe';


describe('ShortResponseCodeRepl', () => {
  let component: ShortResponseCodeRepl;
  let fixture: ComponentFixture<ShortResponseCodeRepl>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): Object {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShortResponseCodeRepl, TruncateAtFirstLinePipe],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortResponseCodeRepl);
    component = fixture.componentInstance;
  });

  it('should response when user submits answer', () => {
    component.answerWithValue = '{' +
      '  "code": "# Type your code here.\\nprint(\'hello\')",' +
      '  "error": "",' +
      '  "evaluation": "",' +
      '  "output": "hello\\n"' +
      '}';

    component.ngOnInit();

    // This throws "Type object is not assignable to type
    // 'string'." We need to suppress this error
    // because of the need to test validations. This is because
    // the backend dict has a lot of optional fields, and we
    // need to test validations for each of these fields.
    // @ts-ignore
    expect(component.escapedAnswer).toEqual({
      code: "# Type your code here.\nprint('hello')",
      error: '',
      evaluation: '',
      output: 'hello\n'
    } as string);
  });
});
