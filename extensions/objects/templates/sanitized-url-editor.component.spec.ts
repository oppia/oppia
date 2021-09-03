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
 * @fileoverview Unit tests for sanitized URL editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SanitizedUrlEditorComponent } from './sanitized-url-editor.component';

describe('SanitizedUrlEditorComponent', () => {
  let component: SanitizedUrlEditorComponent;
  let fixture: ComponentFixture<SanitizedUrlEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SanitizedUrlEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SanitizedUrlEditorComponent);
    component = fixture.componentInstance;
  });

  it('should return SCHEMA when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'unicode',
      validators: [
        {
          id: 'is_nonempty'
        },
        {
          id: 'is_regex_matched',
          regexPattern: '(^https:\\/\\/.*)|(^(?!.*:\\/\\/)(.*))'
        }
      ],
      ui_config: {
        placeholder: 'https://www.example.com'
      }
    });
  });

  it('should update value when the user types a url in the text field', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.value = '';

    component.updateValue('http://oppia.org/');

    expect(component.value).toBe('http://oppia.org/');
    expect(component.valueChanged.emit).toHaveBeenCalledWith('http://oppia.org/');
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not update value when the value does not change', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.value = 'http://oppia.org/';

    component.updateValue('http://oppia.org/');

    expect(component.value).toBe('http://oppia.org/');
    expect(component.valueChanged.emit).not.toHaveBeenCalledWith('http://oppia.org/');
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });
});
