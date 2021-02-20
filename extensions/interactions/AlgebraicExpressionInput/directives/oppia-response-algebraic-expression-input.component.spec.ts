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
 * @fileoverview Unit tests for the AlgebraicExpressionInput response component.
 */

import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { ResponseAlgebraicExpressionInputComponent } from './oppia-response-algebraic-expression-input.component';

describe('AlgebraicExpressionInputResponse', function() {
  let component: ResponseAlgebraicExpressionInputComponent;
  let fixture: ComponentFixture<ResponseAlgebraicExpressionInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        declarations: [ResponseAlgebraicExpressionInputComponent]
      }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ResponseAlgebraicExpressionInputComponent);
    component = fixture.componentInstance;
    component.answer = '&quot;answer&quot;';
    fixture.detectChanges();
  });
  it('should correctly escape characters in the answer', function() {
    component.ngOnInit();
    expect(component.escapedAnswer).toBe('answer');
  });
});
