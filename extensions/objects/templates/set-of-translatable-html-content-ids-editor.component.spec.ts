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

import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
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

  it('should handle ngOnChanges when value changes externally', () => {
    component.value = ['ca_choices_1'];
    component.ngOnInit();
    component.value = ['ca_choices_2'];

    const changes = {
      value: new SimpleChange(['ca_choices_1'], ['ca_choices_2'], false),
    };

    component.ngOnChanges(changes);
    expect(component.selections).toEqual([false, true, false]);
  });

  it('should not update selections on first change in ngOnChanges', () => {
    component.selections = [true, false, false];

    const changes = {
      value: new SimpleChange(undefined, ['ca_choices_1'], true),
    };

    component.ngOnChanges(changes);
    expect(component.selections).toEqual([true, false, false]);
  });

  it('should not update selections when changes do not include value', () => {
    component.value = ['ca_choices_1'];
    component.ngOnInit();

    const changes = {
      someOtherProperty: new SimpleChange('old', 'new', false),
    };

    component.ngOnChanges(changes);
    expect(component.selections).toEqual([true, false, false]);
  });

  it('should emit valueChanged event when selection is toggled', () => {
    spyOn(component.valueChanged, 'emit');

    component.toggleSelection(0);

    expect(component.valueChanged.emit).toHaveBeenCalledWith(['ca_choices_1']);
  });

  it('should update selections array immediately in toggleSelection', () => {
    expect(component.selections).toEqual([false, false, false]);

    component.toggleSelection(1);
    expect(component.selections[1]).toBe(true);
    expect(component.value).toEqual(['ca_choices_2']);
  });

  it('should toggle off a previously selected item', () => {
    component.toggleSelection(0);
    expect(component.selections[0]).toBe(true);
    expect(component.value).toEqual(['ca_choices_1']);

    component.toggleSelection(0);
    expect(component.selections[0]).toBe(false);
    expect(component.value).toEqual([]);
  });

  it('should handle multiple selections correctly', () => {
    component.toggleSelection(0);
    expect(component.value).toEqual(['ca_choices_1']);
    expect(component.selections).toEqual([true, false, false]);

    component.toggleSelection(2);
    expect(component.value).toEqual(['ca_choices_1', 'ca_choices_3']);
    expect(component.selections).toEqual([true, false, true]);

    component.toggleSelection(0);
    expect(component.value).toEqual(['ca_choices_3']);
    expect(component.selections).toEqual([false, false, true]);
  });

  it('should test updateSelections private method indirectly through ngOnInit', () => {
    component.value = ['ca_choices_1', 'ca_choices_3'];
    component.ngOnInit();
    expect(component.selections).toEqual([true, false, true]);
  });

  it('should maintain consistency between value and selections arrays', () => {
    const initialValue = ['ca_choices_2'];
    component.value = initialValue;
    const changes = {
      value: new SimpleChange([], initialValue, false),
    };
    component.ngOnChanges(changes);
    expect(component.selections).toEqual([false, true, false]);

    for (let i = 0; i < component.choices.length; i++) {
      const choiceVal = component.choices[i].val;
      const isInValue = component.value.indexOf(choiceVal) !== -1;
      expect(component.selections[i]).toBe(isInValue);
    }
  });
});
