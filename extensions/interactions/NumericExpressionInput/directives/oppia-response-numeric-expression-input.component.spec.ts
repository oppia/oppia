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
 * @fileoverview Unit tests for the NumericExpressionInput response component.
 */

import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { ResponseNumericExpressionInput } from './oppia-response-numeric-expression-input.component';

describe('ResponseNumericExpressionInput', function() {
  let component: ResponseNumericExpressionInput;
  let fixture: ComponentFixture<ResponseNumericExpressionInput>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        declarations: [ResponseNumericExpressionInput]
      }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ResponseNumericExpressionInput);
    component = fixture.componentInstance;
    component.answer = '&quot;answer&quot;';
    fixture.detectChanges();
  });
  it('should correctly escape characters in the answer', function() {
    component.ngOnInit();
    expect(component.displayAnswer).toBe('answer');
  });
});
