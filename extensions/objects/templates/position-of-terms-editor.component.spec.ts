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
 * @fileoverview Unit tests for the position of terms component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PositionOfTerm, PositionOfTermsEditorComponent } from './position-of-terms-editor.component';

describe('PositionOfTerms', () => {
  let fixture: ComponentFixture<PositionOfTermsEditorComponent>;
  let component: PositionOfTermsEditorComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PositionOfTermsEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(()=> {
    fixture = TestBed.createComponent(PositionOfTermsEditorComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  }));

  it('should have the correct default value of position', () => {
    expect(component.localValue.name).toBe('both');
  });

  it('should change ctrl.value when ctrl.localValue changes', () => {
    // Initially, the default value of localValue is assigned.
    component.onChangePosition('both');
    expect(component.value).toBe('both');

    // Changing localValue should change ctrl.value.
    component.localValue = (
      component.positionOfTerms[0] as unknown as PositionOfTerm);
    component.onChangePosition('lhs');
    expect(component.value).toBe('lhs');
  });

  it('should initialize ctrl.localValue with ctrl.value', () => {
    component.value = 'rhs';
    component.ngOnInit();
    expect(component.localValue.name).toBe('rhs');

    component.value = 'irrelevant';
    component.ngOnInit();
    expect(component.localValue.name).toBe('irrelevant');
  });
});
