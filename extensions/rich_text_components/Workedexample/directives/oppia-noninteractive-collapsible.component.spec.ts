// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Workedexample rich-text component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {SimpleChanges} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {NoninteractiveWorkedexample} from './oppia-noninteractive-workedexample.component';
import {NgbAccordionModule} from '@ng-bootstrap/ng-bootstrap';

describe('NoninteractiveWorkedexample', () => {
  let component: NoninteractiveWorkedexample;
  let fixture: ComponentFixture<NoninteractiveWorkedexample>;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function (answer: string) {
      return answer;
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NgbAccordionModule],
      declarations: [NoninteractiveWorkedexample],
      providers: [
        {
          provide: HtmlEscaperService,
          useValue: mockHtmlEscaperService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoninteractiveWorkedexample);
    component = fixture.componentInstance;

    component.questionWithValue = 'question';
    component.answerWithValue = 'answer';
  });

  it(
    'should initialise when user add workedexample section to the ' +
      'rich text editor',
    () => {
      component.ngOnInit();

      expect(component.question).toBe('question');
      expect(component.answer).toBe('answer');
    }
  );

  it('should update values when user makes changes', () => {
    let changes: SimpleChanges = {
      questionWithValue: {
        currentValue: 'new question',
        previousValue: 'question',
        firstChange: false,
        isFirstChange: () => false,
      },
    };
    component.questionWithValue = 'new question';

    component.ngOnChanges(changes);

    expect(component.question).toBe('new question');
  });

  it("should not update values if question or answer don't have a value", () => {
    component.questionWithValue = '';

    component.ngOnInit();

    expect(component.question).toBe('');
    expect(component.answer).toBe('');
  });
});
