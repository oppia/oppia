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
 * @fileoverview Unit tests for the translatable html content id editor.
 */


import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslatableHtmlContentIdEditorComponent } from './translatable-html-content-id.component';

describe('TranslatableSetOfUnicodeStringEditor', () => {
  let component: TranslatableHtmlContentIdEditorComponent;
  let fixture: ComponentFixture<TranslatableHtmlContentIdEditorComponent>;
  let choices = [{val: 'random val'}];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TranslatableHtmlContentIdEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslatableHtmlContentIdEditorComponent);
    component = fixture.componentInstance;

    component.initArgs = {
      choices: choices
    };
  });

  it('should initialize component properties correctly', () => {
    component.ngOnInit();

    expect(component.name).not.toBeNull();
    expect(component.choices).toEqual(choices);
    expect(component.currentValue).toBe('random val');
  });

  it('should update the local value when user enter a new value', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.value = '';

    component.updateLocalValue('random val');

    expect(component.value).toBe('random val');
    expect(component.valueChanged.emit).toHaveBeenCalledWith('random val');
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not update the local value when value does not change', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.value = 'random val';

    component.updateLocalValue('random val');

    expect(component.value).toBe('random val');
    expect(component.valueChanged.emit).not.toHaveBeenCalledWith('a');
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });

  it('should update the local value if empty string on initialization', () => {
    component.currentValue = '';

    expect(component.currentValue).toBe('');

    component.ngOnInit();

    expect(component.currentValue).toBe('random val');
  });

  it('should not update the local value if same as new value', () => {
    component.value = '';

    expect(component.value).toBe('');

    component.updateLocalValue('random val');

    expect(component.value).toBe('random val');
  });
});
