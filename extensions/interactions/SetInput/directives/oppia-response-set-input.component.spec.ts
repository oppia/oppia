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
 * @fileoverview Component for the Set Input response.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ResponseSetInputComponent } from './oppia-response-set-input.component';
import { TranslateModule } from '@ngx-translate/core';

describe('ResponseSetInputComponent', () => {
  let component: ResponseSetInputComponent;
  let fixture: ComponentFixture<ResponseSetInputComponent>;

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
      declarations: [ResponseSetInputComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseSetInputComponent);
    component = fixture.componentInstance;

    component.answer = '["answer1"]';
  });

  it('should initialise component when user submits answer', () => {
    component.ngOnInit();

    expect(component.escapedAnswer).toEqual(['answer1']);
  });
});
