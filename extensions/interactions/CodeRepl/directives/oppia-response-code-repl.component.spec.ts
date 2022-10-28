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
 * @fileoverview Unit tests for the CodeRepl response.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ResponseCodeReplComponent } from './oppia-response-code-repl.component';

describe('ResponseCodeReplComponent', () => {
  let focusManagerService: FocusManagerService;
  let component: ResponseCodeReplComponent;
  let fixture: ComponentFixture<ResponseCodeReplComponent>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): Object {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseCodeReplComponent],
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
    focusManagerService = TestBed.inject(FocusManagerService);
    fixture = TestBed.createComponent(ResponseCodeReplComponent);
    component = fixture.componentInstance;
  });

  it('should display a popup with response when user clicks response', () => {
    component.answer = '{' +
      '  "code": "# Type your code here.\\nprint(\'hello\')",' +
      '  "error": "",' +
      '  "evaluation": "",' +
      '  "output": "hello\\n"' +
      '}';

    component.ngOnInit();

    expect(component.escapedAnswer).toEqual({
      code: "# Type your code here.\nprint('hello')",
      error: '',
      evaluation: '',
      output: 'hello\n'
    });
  });

  it('should display a popup with error when user clicks response' +
  ' after compilation fails', () => {
    component.answer = '{' +
      '  "code": "# Type your code here.\\nprint(\'hello\')",' +
      '  "error": "SyntaxError: bad token on line 2",' +
      '  "evaluation": "",' +
      '  "output": ""' +
      '}';
    spyOn(focusManagerService, 'generateFocusLabel')
      .and.returnValue('focusLabel');
    spyOn(focusManagerService, 'setFocus');

    component.ngOnInit();

    expect(component.errorFocusLabel).toBe('focusLabel');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith('focusLabel');
  });
});
