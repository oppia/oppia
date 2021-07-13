// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for boolean editor.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BooleanEditorComponent } from './boolean-editor.component';

describe('BooleanEditorComponent', () => {
  let component: BooleanEditorComponent;
  let fixture: ComponentFixture<BooleanEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BooleanEditorComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set value as true when the user checks the checkbox', () => {
    component.value = false;

    component.setValue(true);

    expect(component.value).toBeTrue();
  });

  it('should set value as false when the user unchecks the checkbox', () => {
    component.value = true;

    component.setValue(false);

    expect(component.value).toBeFalse();
  });
});
