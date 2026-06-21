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
 * @fileoverview Directive for the Collapsible rich-text component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {SimpleChanges} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {NoninteractiveCollapsible} from './oppia-noninteractive-collapsible.component';
import {NgbAccordionModule} from '@ng-bootstrap/ng-bootstrap';

describe('NoninteractiveCollapsible', () => {
  let component: NoninteractiveCollapsible;
  let fixture: ComponentFixture<NoninteractiveCollapsible>;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function (answer: string) {
      return answer;
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NgbAccordionModule],
      declarations: [NoninteractiveCollapsible],
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
    fixture = TestBed.createComponent(NoninteractiveCollapsible);
    component = fixture.componentInstance;

    component.headingWithValue = 'heading';
    component.contentWithValue = 'content';
  });

  it(
    'should initialise when user add collapsible section to the ' +
      'rich text editor',
    () => {
      component.ngOnInit();

      expect(component.heading).toBe('heading');
      expect(component.content).toBe('content');
    }
  );

  it('should update values when user makes changes', () => {
    let changes: SimpleChanges = {
      headingWithValue: {
        currentValue: 'new heading',
        previousValue: 'heading',
        firstChange: false,
        isFirstChange: () => false,
      },
    };
    component.headingWithValue = 'new heading';

    component.ngOnChanges(changes);

    expect(component.heading).toBe('new heading');
  });

  it("should not update values if heading or content don't have a value", () => {
    component.headingWithValue = '';

    component.ngOnInit();

    expect(component.heading).toBe('');
    expect(component.content).toBe('');
  });
});
