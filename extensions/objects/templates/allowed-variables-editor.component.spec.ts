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
 * @fileoverview Unit tests for the custom OSK letters component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { AllowedVariablesEditorComponent } from './allowed-variables-editor.component';

describe('OnScreenKeyboard', function() {
  let component: AllowedVariablesEditorComponent;
  let fixture: ComponentFixture<AllowedVariablesEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        imports: [HttpClientTestingModule],
        declarations: [AllowedVariablesEditorComponent],
      }
    ).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      AllowedVariablesEditorComponent);
    component = fixture.componentInstance;
    component.value = [];
    component.ngOnInit();
  });

  it('should update letters list', function() {
    expect(component.value).toEqual([]);
    expect(component.getRemainingLettersCount()).toBe(10);
    component.updateLettersList('z');
    expect(component.value).toEqual(['z']);
    expect(component.getRemainingLettersCount()).toBe(9);
    component.updateLettersList('alpha');
    expect(component.value).toEqual(['z', 'alpha']);
    expect(component.getRemainingLettersCount()).toBe(8);
    component.updateLettersList('z');
    expect(component.value).toEqual(['alpha']);
    expect(component.getRemainingLettersCount()).toBe(9);
    component.updateLettersList('alpha');
    expect(component.value).toEqual([]);
    expect(component.getRemainingLettersCount()).toBe(10);
  });

  it('should correctly identify keyboard events', function() {
    component.lettersAreLowercase = true;
    component.keyDownCallBack({key: 'Shift'} as KeyboardEvent);
    expect(component.lettersAreLowercase).toBeFalse();
    component.keyUpCallBack({key: 'Shift'} as KeyboardEvent);
    expect(component.lettersAreLowercase).toBeTrue();

    component.value = ['x'];
    component.keyDownCallBack({key: 'Backspace'} as KeyboardEvent);
    expect(component.value.length).toBe(0);
    component.keyDownCallBack({key: 'x'} as KeyboardEvent);
    let event: Event = new KeyboardEvent('keydown', {
      code: 'a'
    });
    window.dispatchEvent(event);
    fixture.detectChanges();
    event = new KeyboardEvent('keyup', {
      code: 'a'
    });
    window.dispatchEvent(event);
    fixture.detectChanges();
  });
});
