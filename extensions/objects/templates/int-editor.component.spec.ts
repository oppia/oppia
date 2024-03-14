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
 * @fileoverview Unit tests for int editor.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {IntEditorComponent} from './int-editor.component';

describe('IntEditorComponent', () => {
  let component: IntEditorComponent;
  let fixture: ComponentFixture<IntEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [IntEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialise when user types a number', () => {
    spyOn(component.valueChanged, 'emit');

    component.ngOnInit();

    expect(component.value).toBe(0);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(0);
  });

  it('should return SCHEMA when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'int',
      validators: [
        {
          id: 'is_integer',
        },
      ],
    });
  });

  it('should update the value when user edits a number', () => {
    spyOn(component.valueChanged, 'emit');

    component.value = 0;

    component.updateValue(2);

    expect(component.value).toBe(2);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(2);
  });
});
