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
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {RatioExpressionEditorComponent} from './ratio-expression-editor.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('RatioExpression', () => {
  let component: RatioExpressionEditorComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MockTranslatePipe, RatioExpressionEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    component = TestBed.createComponent(
      RatioExpressionEditorComponent
    ).componentInstance;
  }));

  it('should initialize @Input() value with a default value', () => {
    // This throws "Type 'null' is not assignable to type
    // 'number[]'". We need to suppress this error
    // because we are testing validations here. This error
    // is thrown because the type of value is number[] and
    // we are assigning null to it.
    // @ts-ignore
    component.value = null;

    component.ngOnInit();
    expect(component.value).toEqual([1, 1]);
    expect(component.localValue).toEqual({label: '1:1'});
  });

  it('should initialize warningText with non-integer ratio', () => {
    component.isValidRatio('1:1:2.3');
    // For this and other warning texts, the correct translated text is fetched
    // in HTML and so, the key itself is passed around in the ts files.
    expect(component.warningTextI18nKey).toBe(
      'I18N_INTERACTIONS_RATIO_NON_INTEGER_ELEMENTS'
    );
  });

  it('should initialize warningText with invalid ratio', () => {
    component.isValidRatio('1:2:3:');
    expect(component.warningTextI18nKey).toBe(
      'I18N_INTERACTIONS_RATIO_INVALID_FORMAT'
    );
  });

  it('should initialize warningText with invalid character', () => {
    component.isValidRatio('abc');
    expect(component.warningTextI18nKey).toBe(
      'I18N_INTERACTIONS_RATIO_INVALID_CHARS'
    );
  });

  it('should initialize warningText with empty ratio', () => {
    component.isValidRatio('');
    expect(component.warningTextI18nKey).toBe(
      'I18N_INTERACTIONS_RATIO_EMPTY_STRING'
    );
  });

  it('should initialize warningText with invalid colons', () => {
    component.isValidRatio('1:2::3');
    expect(component.warningTextI18nKey).toBe(
      'I18N_INTERACTIONS_RATIO_INVALID_COLONS'
    );
  });

  it('should initialize warningText with invalid zero ratio', () => {
    component.isValidRatio('1:0');
    expect(component.warningTextI18nKey).toBe(
      'I18N_INTERACTIONS_RATIO_INCLUDES_ZERO'
    );
  });

  it('should return true with a valid value of ratio', () => {
    expect(component.isValidRatio('1:2:3')).toBe(true);
  });
});
