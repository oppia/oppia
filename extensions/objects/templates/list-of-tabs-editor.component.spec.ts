// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for list of tabs editor.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ListOfTabsEditorComponent} from './list-of-tabs-editor.component';

describe('ListOfTabsEditorComponent', () => {
  let component: ListOfTabsEditorComponent;
  let fixture: ComponentFixture<ListOfTabsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ListOfTabsEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListOfTabsEditorComponent);
    component = fixture.componentInstance;
  });

  // This is being used in the Rich Text Editor.
  it('should initialise when user inserts a tabs', () => {
    spyOn(component.valueChanged, 'emit');

    component.ngOnInit();

    expect(component.value).toEqual([]);
    expect(component.valueChanged.emit).toHaveBeenCalledWith([]);
  });

  it('should return SCHEMA when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'list',
      items: {
        type: 'dict',
        properties: [
          {
            name: 'title',
            description: 'Tab title',
            schema: {
              type: 'unicode',
              validators: [
                {
                  id: 'is_nonempty',
                },
              ],
            },
          },
          {
            name: 'content',
            description: 'Tab content',
            schema: {
              type: 'html',
              ui_config: {
                hide_complex_extensions: true,
              },
            },
          },
        ],
      },
      ui_config: {
        add_element_text: 'Add new tab',
      },
    });
  });
  it('should only update the value when user edits the tabs', () => {
    spyOn(component.valueChanged, 'emit');

    component.value = [];
    let listOfTabs = [
      {
        title: 'Hint introduction',
        content: 'This set of tabs shows some hints.',
      },
      {
        title: 'Hint 1',
        content: 'This is a first hint.',
      },
    ];

    component.updateValue(listOfTabs);

    expect(component.value).toEqual(listOfTabs);
    expect(component.valueChanged.emit).toHaveBeenCalledOnceWith(listOfTabs);
    expect(component.valueChanged.emit).toHaveBeenCalledTimes(1);

    component.updateValue(listOfTabs);

    expect(component.value).toEqual(listOfTabs);
    expect(component.valueChanged.emit).toHaveBeenCalledTimes(1);
  });
});
