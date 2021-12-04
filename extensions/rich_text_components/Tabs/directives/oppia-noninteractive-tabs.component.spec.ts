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
 * @fileoverview Unit test for the Tabs rich-text component.
 */

import { SimpleChanges } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { NoninteractiveTabs } from './oppia-noninteractive-tabs.component';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

describe('NoninteractiveTabs', () => {
  let component: NoninteractiveTabs;
  let fixture: ComponentFixture<NoninteractiveTabs>;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function(answer: string) {
      return JSON.parse(answer);
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbNavModule
      ],
      declarations: [NoninteractiveTabs],
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
    fixture = TestBed.createComponent(NoninteractiveTabs);
    component = fixture.componentInstance;

    component.tabContentsWithValue = '[' +
      '{' +
          '"title": "Hint introduction",' +
          '"content": "This set of tabs shows some hints."' +
      '},' +
      '{' +
          '"title": "Hint 1",' +
          '"content": "This is a first hint."' +
      '}' +
  ']';
  });

  it('should should initialise component when user creates tabs in the' +
  ' rich text editor', () => {
    component.ngOnInit();

    expect(component.tabContents).toEqual([
      {
        title: 'Hint introduction',
        content: 'This set of tabs shows some hints.'
      },
      {
        title: 'Hint 1',
        content: 'This is a first hint.'
      }
    ]);
  });

  it('should not update value when \'tabContentsWithValue\' is not defined',
    () => {
      component.tabContentsWithValue = '';

      component.ngOnInit();

      expect(component.tabContents).toEqual([]);
    });

  it('should update values when user changes values', () => {
    let changes: SimpleChanges = {
      tabContentsWithValue: {
        currentValue: {
          title: 'New Hint introduction',
          content: 'This set of tabs shows some hints.'
        },
        previousValue: {
          title: 'Hint introduction',
          content: 'This set of tabs shows some hints.'
        },
        firstChange: false,
        isFirstChange: () => false
      }
    };

    component.tabContentsWithValue = '[{' +
      '"title": "New Hint introduction",' +
      '"content": "This set of tabs shows some hints."' +
    '}]';

    component.ngOnChanges(changes);

    expect(component.tabContents).toEqual([{
      title: 'New Hint introduction',
      content: 'This set of tabs shows some hints.'
    }]);
  });
});
