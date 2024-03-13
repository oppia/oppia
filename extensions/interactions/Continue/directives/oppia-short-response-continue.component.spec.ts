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
 * @fileoverview Unit tests for the Continue button response.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {OppiaShortResponseContinueComponent} from './oppia-short-response-continue.component';
import {HtmlEscaperService} from 'services/html-escaper.service';

describe('OppiaShortResponseContinueComponent', () => {
  let component: OppiaShortResponseContinueComponent;
  let fixture: ComponentFixture<OppiaShortResponseContinueComponent>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return answer;
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [OppiaShortResponseContinueComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OppiaShortResponseContinueComponent);
    component = fixture.componentInstance;
  });

  // Note: The users response is the same as the Continue button placeholder
  // text.
  it("should display user's response", () => {
    component.answer = 'Continue button text';

    expect(component.escapedAnswer).toBe('');

    component.ngOnInit();

    expect(component.escapedAnswer).toBe('Continue button text');
  });
});
