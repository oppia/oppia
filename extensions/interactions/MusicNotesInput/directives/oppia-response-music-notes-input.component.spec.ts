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
 * @fileoverview Unit tests for the music notes input response component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ResponseMusicNotesInput } from './oppia-response-music-notes-input.component';

describe('Response music notes input component ', () => {
  let component: ResponseMusicNotesInput;
  let fixture: ComponentFixture<ResponseMusicNotesInput>;

  class MockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return answer;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ResponseMusicNotesInput,
      ],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: MockHtmlEscaperService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  describe('when user provides an answer', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ResponseMusicNotesInput);
      component = fixture.componentInstance;
      component.answer = [{
        readableNoteName: 'B4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }];
    });

    it('should initialise the component when submits answer', () => {
      component.ngOnInit();
      expect(component.displayedAnswer).toEqual('B4');
    });
  });

  describe('when user does not provides an answer', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ResponseMusicNotesInput);
      component = fixture.componentInstance;
      component.answer = [];
    });

    it('should initialise the component when submits answer', () => {
      component.ngOnInit();
      expect(component.displayedAnswer).toEqual('No answer given.');
    });
  });
});
