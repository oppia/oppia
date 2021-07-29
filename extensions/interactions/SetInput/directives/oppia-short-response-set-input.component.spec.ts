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
 * @fileoverview Component for the Set Input short response.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ShortResponseSetInputComponent } from './oppia-short-response-set-input.component';
import { TranslateModule } from '@ngx-translate/core';

describe('ShortResponseSetInputComponent', () => {
  let component: ShortResponseSetInputComponent;
  let fixture: ComponentFixture<ShortResponseSetInputComponent>;

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
      declarations: [ShortResponseSetInputComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortResponseSetInputComponent);
    component = fixture.componentInstance;
  });

  it('should display warning when user submits with no answer', () => {
    component.answer = '[]';

    component.ngOnInit();

    expect(component.displayedAnswer)
      .toBe('I18N_INTERACTIONS_SET_INPUT_NO_ANSWER');
  });

  it('should initialise component when user submits answer', () => {
    component.answer = '["answer1", "answer2"]';

    component.ngOnInit();

    expect(component.displayedAnswer)
      .toBe('answer1, answer2');
  });
});
