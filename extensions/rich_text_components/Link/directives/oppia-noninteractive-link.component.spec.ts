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
 * @fileoverview Unit tests for the Link rich-text component.
 */

import {SimpleChanges} from '@angular/core';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ContextService} from 'services/context.service';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {NoninteractiveLink} from './oppia-noninteractive-link.component';

describe('NoninteractiveLink', () => {
  let component: NoninteractiveLink;
  let fixture: ComponentFixture<NoninteractiveLink>;
  let contextService: ContextService;
  let htmlEscaperService: HtmlEscaperService;

  let mockHtmlEscaperService = {
    escapedJsonToObj: (answer: string) => {
      return answer;
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NoninteractiveLink],
      providers: [
        HtmlEscaperService,
        {
          provide: HtmlEscaperService,
          useValue: mockHtmlEscaperService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    htmlEscaperService = TestBed.inject(HtmlEscaperService);
    contextService = TestBed.inject(ContextService);
    fixture = TestBed.createComponent(NoninteractiveLink);
    component = fixture.componentInstance;
    component.urlWithValue = 'https://www.oppia.org/';
    component.textWithValue = 'text';
  });

  it('should initilise when user inserts link to the rich text editor', () => {
    spyOn(contextService, 'isInExplorationEditorMode').and.returnValue(true);
    component.ngOnInit();

    expect(component.url).toBe('https://www.oppia.org/');
    expect(component.text).toBe('text');
    expect(component.showUrlInTooltip).toBe(true);
    expect(component.tabIndexVal).toBe(-1);
  });

  it("should add 'https://' when user does not add it", () => {
    component.urlWithValue = 'www.oppia.org/';

    component.ngOnInit();

    expect(component.url).toBe('https://www.oppia.org/');
  });

  it('should display url instead of text in old explorations', () => {
    spyOn(htmlEscaperService, 'escapedJsonToObj').and.returnValues(
      'https://www.oppia.org/',
      ''
    );

    component.ngOnInit();

    expect(component.url).toBe('https://www.oppia.org/');
    expect(component.text).toBe('https://www.oppia.org/');
  });

  it('should not update url when url or text is not input', () => {
    component.urlWithValue = '';
    component.textWithValue = '';

    component.ngOnInit();

    expect(component.url).toBeUndefined();
    expect(component.text).toBe('');
  });

  it('should update the url and text when the user changes them', () => {
    let changes: SimpleChanges = {
      urlWithValue: {
        currentValue: 'www.new_url.com',
        previousValue: 'https://www.oppia.org/',
        firstChange: false,
        isFirstChange: () => false,
      },
      textWithValue: {
        currentValue: 'new text',
        previousValue: 'text',
        firstChange: false,
        isFirstChange: () => false,
      },
    };
    component.urlWithValue = 'www.new_url.com';
    component.textWithValue = 'new text';

    component.ngOnChanges(changes);

    expect(component.url).toBe('https://www.new_url.com');
    expect(component.text).toBe('new text');
  });
});
