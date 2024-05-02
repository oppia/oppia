// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for set of translatable html content id editor.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {SetOfTranslatableHtmlContentIdsEditorComponent} from './set-of-translatable-html-content-ids-editor.component';

describe('SetOfTranslatableHtmlContentIdsEditorComponent', () => {
  let component: SetOfTranslatableHtmlContentIdsEditorComponent;
  let fixture: ComponentFixture<SetOfTranslatableHtmlContentIdsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SetOfTranslatableHtmlContentIdsEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      SetOfTranslatableHtmlContentIdsEditorComponent
    );
    component = fixture.componentInstance;

    component.initArgs = {
      choices: [
        {
          val: 'ca_choices_1',
        },
        {
          val: 'ca_choices_2',
        },
        {
          val: 'ca_choices_3',
        },
      ],
    };

    component.ngOnInit();
  });

  it(
    "should initialise when usr adds response for 'Item Selection' " +
      'interaction',
    () => {
      expect(component.choices).toEqual([
        {
          val: 'ca_choices_1',
        },
        {
          val: 'ca_choices_2',
        },
        {
          val: 'ca_choices_3',
        },
      ]);
      expect(component.selections).toEqual([false, false, false]);
    }
  );

  it('should initialise component when user edits response', () => {
    component.value = ['ca_choices_2'];

    component.ngOnInit();

    // The value of variable does not change since it is an Input. But it
    // is initialised as [] when the it is not defined when component is
    // initialised. Therefore, we test if the value of the variable remains the
    // same after the component is initialised.
    expect(component.value).toEqual(['ca_choices_2']);
    expect(component.choices).toEqual([
      {
        val: 'ca_choices_1',
      },
      {
        val: 'ca_choices_2',
      },
      {
        val: 'ca_choices_3',
      },
    ]);
    expect(component.selections).toEqual([false, true, false]);
  });

  it('should toggle checkbox when user clicks the checkbox', () => {
    component.toggleSelection(1);

    expect(component.value).toEqual(['ca_choices_2']);

    component.toggleSelection(1);

    expect(component.value).toEqual([]);
  });
});
