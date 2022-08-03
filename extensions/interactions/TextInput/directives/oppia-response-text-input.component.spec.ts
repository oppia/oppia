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
 * @fileoverview Unit tests for the TextInput response.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TextInputAnswer } from 'interactions/answer-defs';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ResponseTextInputComponent } from './oppia-response-text-input.component';

describe('ResponseTextInputComponent', () => {
  let component: ResponseTextInputComponent;
  let fixture: ComponentFixture<ResponseTextInputComponent>;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function(answer: TextInputAnswer) {
      return answer;
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseTextInputComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useValue: mockHtmlEscaperService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseTextInputComponent);
    component = fixture.componentInstance;

    component.answer = 'answer';
  });

  it('should initialise when user submits answer', () => {
    component.ngOnInit();

    expect(component.answer).toBe('answer');
  });
});
