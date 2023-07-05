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
 * @fileoverview Unit tests for Subtitled Unicode editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SubtitledUnicode } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { SubtitledUnicodeEditorComponent } from './subtitled-unicode-editor.component';

describe('SubtitledUnicodeEditorComponent', () => {
  let component: SubtitledUnicodeEditorComponent;
  let fixture: ComponentFixture<SubtitledUnicodeEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubtitledUnicodeEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubtitledUnicodeEditorComponent);
    component = fixture.componentInstance;
  });

  it('should return schema when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'unicode',
    });
  });

  it('should update value when user enters a new value', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    spyOn(component.valueChanged, 'emit');
    component.value = new SubtitledUnicode('value', null);

    component.updateValue('new value');

    expect(component.value.unicode).toBe('new value');
    expect(component.valueChanged.emit).toHaveBeenCalledWith(
      component.value);
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not update value when user does not enter a new value', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    spyOn(component.valueChanged, 'emit');
    component.value = new SubtitledUnicode('value', null);

    component.updateValue('value');

    expect(component.value.unicode).toBe('value');
    expect(component.valueChanged.emit).not.toHaveBeenCalledWith({
      _unicode: 'value'
    });
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });
});
