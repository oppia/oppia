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
 * @fileoverview Unit tests for the LogicProof response.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ResponseLogicProofComponent } from './oppia-response-logic-proof.component';

describe('ResponseLogicProofComponent', () => {
  let component: ResponseLogicProofComponent;
  let fixture: ComponentFixture<ResponseLogicProofComponent>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en'
        }),
      ],
      declarations: [ResponseLogicProofComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseLogicProofComponent);
    component = fixture.componentInstance;

    component.answerWithValue = '{' +
    '    "assumptions_string": "p and c",' +
    '    "target_string": "p",' +
    '    "proof_string": "default",' +
    '    "proof_num_lines": 1,' +
    '    "displayed_question": ' +
    '"I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_ASSUMPTIONS",' +
    '    "correct": false,' +
    '    "error_category": "parsing",' +
    '    "error_code": "unmatched_line",' +
    '    "error_message": "error message",' +
    '    "error_line_number": 0,' +
    '    "displayed_message": "line 1: error message",' +
    '    "displayed_proof": [' +
    '        "",' +
    '        "1  default",' +
    '        ""' +
    '    ]' +
    '}';
  });

  it('should create', () => {
    component.ngOnInit();

    expect(component.answer).toEqual(
      {
        assumptions_string: 'p and c',
        target_string: 'p',
        proof_string: 'default',
        proof_num_lines: 1,
        displayed_question:
          'I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_ASSUMPTIONS',
        correct: false,
        error_category: 'parsing',
        error_code: 'unmatched_line',
        error_message: 'error message',
        error_line_number: 0,
        displayed_message: 'line 1: error message',
        displayed_proof: [
          '',
          '1  default',
          ''
        ]
      } as unknown as string
    );
  });
});
