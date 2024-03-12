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
 * @fileoverview Unit tests for Schema Based Dict Editor Component
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {FormControl, FormsModule} from '@angular/forms';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {IdGenerationService} from 'services/id-generation.service';
import {SchemaBasedDictEditorComponent} from './schema-based-dict-editor.component';
import {
  Schema,
  SchemaDefaultValue,
} from 'services/schema-default-value.service';

describe('Schema Based Dict Editor Component', () => {
  let component: SchemaBasedDictEditorComponent;
  let fixture: ComponentFixture<SchemaBasedDictEditorComponent>;
  let idGenerationService: IdGenerationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [SchemaBasedDictEditorComponent],
      providers: [FocusManagerService, IdGenerationService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedDictEditorComponent);
    component = fixture.componentInstance;
    idGenerationService = TestBed.inject(IdGenerationService);
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function (value: Record<string, SchemaDefaultValue>) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched();

    expect(component).toBeDefined();
    expect(component.validate(new FormControl(1))).toEqual({});
    expect(component.onChange).toEqual(mockFunction);
    expect(component.onChange({first: 'true'})).toEqual({first: 'true'});
  }));

  it('should set directive properties on initialization', () => {
    component.propertySchemas = [
      {
        name: 'Name1',
        schema: {
          type: 'int',
        },
      },
      {
        name: 'Name2',
        schema: {
          type: 'int',
        },
      },
    ];
    spyOn(idGenerationService, 'generateNewId').and.returnValues('id1', 'id2');

    expect(component.fieldIds).toEqual({});

    component.ngOnInit();

    expect(component.fieldIds).toEqual({
      Name1: 'id1',
      Name2: 'id2',
    });
  });

  it('should write value', () => {
    component.localValue = {
      first: 'false',
    };

    component.writeValue({first: 'true'});
    expect(component.localValue).toEqual({first: 'true'});
  });

  it('should update value when local value change', () => {
    let localValue = {
      first: 'true',
    };

    component.localValue = localValue;

    expect(component.localValue).toEqual(localValue);

    component.updateValue('false', 'first');

    expect(component.localValue).toEqual(localValue);
  });

  it('should not update value when local value not change', () => {
    let localValue = {
      first: 'true',
    };

    component.localValue = localValue;

    expect(component.localValue).toEqual(localValue);

    component.updateValue('true', 'first');

    expect(component.localValue).toEqual(localValue);
  });

  it('should get empty object on validating', () => {
    expect(component.validate(new FormControl(1))).toEqual({});
  });

  it('should get schema', () => {
    const HTML_SCHEMA = {
      type: 'html',
    } as Schema;

    component.propertySchemas = [
      {
        name: 'id1',
        schema: HTML_SCHEMA,
      },
    ];

    expect(component.getSchema(0)).toBe(HTML_SCHEMA);
  });

  it('should get label for focus target', () => {
    component.labelForFocusTarget = 'Focus target';

    expect(component.getLabelForFocusTarget()).toBe('Focus target');
  });

  it('should get human readable property description', () => {
    expect(
      component.getHumanReadablePropertyDescription({
        description: 'This is the property description',
        name: 'Property Name',
      })
    ).toBe('This is the property description');
  });
});
