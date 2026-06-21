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
 * @fileoverview Unit tests for the DragAndDropSortInput response.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ShortResponseDragAndDropSortInputComponent} from './oppia-short-response-drag-and-drop-sort-input.component';

describe('Drag and drop sort input short response component', () => {
  let component: ShortResponseDragAndDropSortInputComponent;
  let fixture: ComponentFixture<ShortResponseDragAndDropSortInputComponent>;

  class MockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShortResponseDragAndDropSortInputComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: MockHtmlEscaperService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ShortResponseDragAndDropSortInputComponent
    );
    component = fixture.componentInstance;
    component.answer =
      '[' +
      '[' +
      '"ca_choices_1"' +
      '],' +
      '[' +
      '"ca_choices_2"' +
      '],' +
      '[' +
      '"ca_choices_3"' +
      ']' +
      ']';
    component.choices =
      '[{' +
      '"_html": "Choice 1",' +
      '"_contentId": "ca_choices_1"' +
      '}, {' +
      '"_html": "Choice 2",' +
      '"_contentId": "ca_choices_2"' +
      '}, {' +
      '"_html": "Choice 3",' +
      '"_contentId": "ca_choices_3"' +
      '}]';
  });

  it('should initialise component when user submits answer', () => {
    component.ngOnInit();

    expect(component.responseList).toEqual([
      ['Choice 1'],
      ['Choice 2'],
      ['Choice 3'],
    ]);
    expect(component.isAnswerLengthGreaterThanZero).toBe(true);
  });

  it(
    'should display item below another item when user drags item to' +
      ' new position',
    () => {
      expect(component.chooseItemType(0)).toBe('drag-and-drop-response-item');
    }
  );

  it(
    'should display item right below another item when user puts' +
      ' 2 or more items in the same position',
    () => {
      expect(component.chooseItemType(1)).toBe(
        'drag-and-drop-response-subitem'
      );
    }
  );
});
