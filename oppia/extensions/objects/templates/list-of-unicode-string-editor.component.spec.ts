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
 * @fileoverview Unit tests for list of unicode string editor.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ListOfUnicodeStringEditorComponent} from './list-of-unicode-string-editor.component';

describe('ListOfUnicodeStringEditorComponent', () => {
  let component: ListOfUnicodeStringEditorComponent;
  let fixture: ComponentFixture<ListOfUnicodeStringEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ListOfUnicodeStringEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListOfUnicodeStringEditorComponent);
    component = fixture.componentInstance;
  });

  it('should initialise when user adds tabs', () => {
    spyOn(component.valueChanged, 'emit');

    component.ngOnInit();

    expect(component.value).toEqual([]);
    expect(component.valueChanged.emit).toHaveBeenCalledWith([]);
  });

  it('should return SCHEMA when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'list',
      items: {
        type: 'unicode',
      },
    });
  });

  it('should update the value when user edits the tabs', () => {
    spyOn(component.valueChanged, 'emit');
    let newValue = [
      {
        title: 'New Hint introduction',
        content: 'This set of tabs shows some hints.',
      },
      {
        title: 'New Hint 1',
        content: 'This is a first hint.',
      },
    ];
    component.value = [
      {
        title: 'Hint introduction',
        content: 'This set of tabs shows some hints.',
      },
      {
        title: 'Hint 1',
        content: 'This is a first hint.',
      },
    ];

    component.updateValue(newValue);

    expect(component.value).toEqual(newValue);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(newValue);
  });
});
