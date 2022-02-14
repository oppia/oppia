// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Schema Based Editor Component
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { SchemaBasedExpressionEditorComponent } from './schema-based-expression-editor.component';

describe('Schema Based Expression Editor Component', () => {
  let component: SchemaBasedExpressionEditorComponent;
  let fixture: ComponentFixture<SchemaBasedExpressionEditorComponent>;
  let focusManagerService: FocusManagerService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        SchemaBasedExpressionEditorComponent
      ],
      providers: [
        FocusManagerService,
        SchemaFormSubmittedService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedExpressionEditorComponent);
    component = fixture.componentInstance;
    focusManagerService = TestBed.inject(FocusManagerService);

    component.registerOnTouched();
    component.registerOnChange(null);
    component.onChange = (val: boolean) => {
      return;
    };
  });

  it('should get empty object on validating', () => {
    expect(component.validate(null)).toEqual({});
  });

  it('should overwrite local value', () => {
    expect(component.localValue).toBe(undefined);

    component.writeValue(true);

    expect(component.localValue).toBeTrue();
  });

  it('should initialize the schema', fakeAsync(() => {
    spyOn(focusManagerService, 'setFocusWithoutScroll');

    component.ngOnInit();
    tick();

    expect(focusManagerService.setFocusWithoutScroll).toHaveBeenCalled();
  }));

  it('should update local value', () => {
    component.localValue = false;

    component.localValueChange(false);

    expect(component.localValue).toBeFalse();

    component.localValueChange(true);

    expect(component.localValue).toBeTrue();
  });
});
