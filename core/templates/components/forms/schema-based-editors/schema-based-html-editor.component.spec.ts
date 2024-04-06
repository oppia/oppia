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
 * @fileoverview Unit tests for Schema Based Html Editor Component
 */

import {FormControl, FormsModule} from '@angular/forms';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {SchemaBasedHtmlEditorComponent} from './schema-based-html-editor.component';

describe('Schema Based Html Editor Component', () => {
  let component: SchemaBasedHtmlEditorComponent;
  let fixture: ComponentFixture<SchemaBasedHtmlEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [SchemaBasedHtmlEditorComponent],
      providers: [FocusManagerService, SchemaFormSubmittedService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedHtmlEditorComponent);
    component = fixture.componentInstance;
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function (value: string) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched();

    expect(component).toBeDefined();
    expect(component.validate(new FormControl(1))).toEqual({});
    expect(component.onChange).toEqual(mockFunction);
  }));

  it("should test the case when the input isn't valid", () => {
    expect(component.validate(new FormControl(1))).toEqual({});
  });

  it('should write value', () => {
    component.localValue = 'false';

    component.writeValue('true');
    expect(component.localValue).toEqual('true');
  });

  it('should check the final value of the component', () => {
    spyOn(component, 'onChange');

    component.updateValue('<p> HTML </p>');

    expect(component.onChange).toHaveBeenCalledWith('<p> HTML </p>');
  });
});
