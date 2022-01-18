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
 * @fileoverview Component for the pencil code editor short response.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TruncateAtFirstLinePipe } from 'filters/string-utility-filters/truncate-at-first-line.pipe';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ShortResponePencilCodeEditor } from './oppia-short-response-pencil-code-editor.component';

describe('oppiaShortResponsePencilCodeEditor', () => {
  let component: ShortResponePencilCodeEditor;
  let fixture: ComponentFixture<ShortResponePencilCodeEditor>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return answer;
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ShortResponePencilCodeEditor,
        TruncateAtFirstLinePipe
      ],
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
    fixture = TestBed.createComponent(ShortResponePencilCodeEditor);
    component = fixture.componentInstance;
    component.answer = {
      code: '# Add the initial code snippet here.'
    };
  });

  it('should initialise the component when submits answer', () => {
    component.ngOnInit();
    expect(component.answerCode).toEqual(
      '# Add the initial code snippet here.');
  });
});
