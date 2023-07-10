// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit Tests for the pencil code editor response component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ResponePencilCodeEditor } from './oppia-response-pencil-code-editor.component';

describe('Response pencil code editor component ', () => {
  let component: ResponePencilCodeEditor;
  let fixture: ComponentFixture<ResponePencilCodeEditor>;

  class MockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return answer;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ResponePencilCodeEditor],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: MockHtmlEscaperService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponePencilCodeEditor);
    component = fixture.componentInstance;
    component.answer = {
      code: '# Add the initial code snippet here.'
    } as unknown as string;
  });

  it('should initialize the component when submits answer', () => {
    component.ngOnInit();
    expect(component.answerCode).toEqual(
      '# Add the initial code snippet here.');
  });
});
