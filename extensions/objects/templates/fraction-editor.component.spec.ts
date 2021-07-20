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
 * @fileoverview Unit tests for fraction editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FractionEditorComponent } from './fraction-editor.component';

describe('FractionEditorComponent', () => {
  let component: FractionEditorComponent;
  let fixture: ComponentFixture<FractionEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FractionEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FractionEditorComponent);
    component = fixture.componentInstance;

    component.value = {
      isNegative: false,
      wholeNumber: 0,
      numerator: 1,
      denominator: 2
    };
  });

  it('should initialise component when users edits a fraction', () => {
    component.ngOnInit();

    expect(component.fractionString).toBe('1/2');
  });

  it('should validate fraction when called', () => {
    spyOn(component.eventBus, 'emit');

    component.validateFraction('1/2');

    expect(component.currentFractionValueIsValid).toBeTrue();
    expect(component.errorMessage).toBe('');
    expect(component.eventBus.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: {
          value: false,
          modalId: undefined
        },
        type: 'ObjectFormValidityChangeEvent'
      }));
  });

  it('should display error message when user enters an invalid fraction',
    () => {
      spyOn(component.eventBus, 'emit');

      component.validateFraction('1?2');

      expect(component.currentFractionValueIsValid).toBeFalse();
      expect(component.errorMessage).toBe(
        'Please only use numerical digits, spaces or forward slashes (/)'
      );
      expect(component.eventBus.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: {
            value: true,
            modalId: undefined
          },
          type: 'ObjectFormValidityChangeEvent'
        }));
    });

  it('should display error message when user enter an empty fraction', () => {
    component.validateFraction('');

    expect(component.currentFractionValueIsValid).toBeFalse();
    expect(component.errorMessage).toBe(
      'Please enter a non-empty fraction value.'
    );
  });
});
