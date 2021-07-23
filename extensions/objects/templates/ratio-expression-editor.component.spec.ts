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
 * @fileoverview Unit tests for the ratio expression component.
 */
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RatioExpressionEditorComponent } from './ratio-expression-editor.component';

describe('RatioExpression', () => {
  let component: RatioExpressionEditorComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RatioExpressionEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    component = TestBed.createComponent(
      RatioExpressionEditorComponent).componentInstance;
  }));

  it('should initialize ctrl.value with an default value', () => {
    component.value = null;
    component.ngOnInit();
    expect(component.value).not.toBeNull();
  });

  it('should initialize ctrl.warningText with non-integer ratio', () => {
    component.isValidRatio('1:1:2.3');
    expect(component.warningText)
      .toBe(
        'For this question, each element in your ratio should be a ' +
        'whole number (not a fraction or a decimal).');
  });

  it('should initialize ctrl.warningText with invalid ratio', () => {
    component.isValidRatio('1:2:3:');
    expect(component.warningText)
      .toBe('Please enter a valid ratio (e.g. 1:2 or 1:2:3).');
  });

  it('should initialize ctrl.warningText with invalid character', () => {
    component.isValidRatio('abc');
    expect(component.warningText)
      .toBe(
        'Please write a ratio that consists of digits separated by colons' +
        '(e.g. 1:2 or 1:2:3).');
  });

  it('should initialize ctrl.warningText with empty ratio', () => {
    component.isValidRatio('');
    expect(component.warningText)
      .toBe('Please enter a valid ratio (e.g. 1:2 or 1:2:3).');
  });

  it('should initialize ctrl.warningText with invalid colons', () => {
    component.isValidRatio('1:2::3');
    expect(component.warningText)
      .toBe('Your answer has multiple colons (:) next to each other.');
  });

  it('should initialize ctrl.warningText with invalid zero ratio', () => {
    component.isValidRatio('1:0');
    expect(component.warningText)
      .toBe('Ratios cannot have 0 as a element.');
  });

  it('should return true with a valid value of ratio', () => {
    expect(component.isValidRatio('1:2:3')).toBe(true);
  });
});
