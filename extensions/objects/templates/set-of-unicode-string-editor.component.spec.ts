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
 * @fileoverview Component for set of unicode string editor.
 */

import {ChangeDetectorRef} from '@angular/core';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {SetOfUnicodeStringEditorComponent} from './set-of-unicode-string-editor.component';

describe('SetOfUnicodeStringEditorComponent', () => {
  let component: SetOfUnicodeStringEditorComponent;
  let fixture: ComponentFixture<SetOfUnicodeStringEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SetOfUnicodeStringEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetOfUnicodeStringEditorComponent);
    component = fixture.componentInstance;
  });

  it('should initialise component when editor is initiliased', () => {
    spyOn(component.valueChanged, 'emit');
    component.ngOnInit();

    expect(component.value).toEqual([]);
    expect(component.valueChanged.emit).toHaveBeenCalled();
  });

  it('should return Schema when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'list',
      items: {
        type: 'unicode',
      },
      validators: [
        {
          id: 'is_uniquified',
        },
      ],
    });
  });

  it('should update value when user types', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    spyOn(component.valueChanged, 'emit');

    component.value = 'value';

    component.updateValue('new value');

    expect(component.value).toEqual('new value');
    expect(component.valueChanged.emit).toHaveBeenCalled();
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not update value if it has no changed', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    spyOn(component.valueChanged, 'emit');
    component.value = 'value';

    component.updateValue('value');

    expect(component.value).toEqual('value');
    expect(component.valueChanged.emit).not.toHaveBeenCalled();
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });
});
