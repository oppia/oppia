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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { IdGenerationService } from 'services/id-generation.service';
import { SchemaBasedDictEditorComponent } from './schema-based-dict-editor.component';

describe('Schema Based Dict Editor Component', () => {
  let component: SchemaBasedDictEditorComponent;
  let fixture: ComponentFixture<SchemaBasedDictEditorComponent>;
  let idGenerationService: IdGenerationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        SchemaBasedDictEditorComponent
      ],
      providers: [
        FocusManagerService,
        IdGenerationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedDictEditorComponent);
    component = fixture.componentInstance;
    idGenerationService = TestBed.inject(IdGenerationService);

    component.registerOnTouched();
    component.registerOnChange(null);
    component.onChange = (val: boolean) => {
      return;
    };
  });

  it('should set directive properties on initialization', () => {
    component.propertySchemas = [
      {
        name: 'Name1'
      },
      {
        name: 'Name2'
      }
    ];
    spyOn(idGenerationService, 'generateNewId')
      .and.returnValues('id1', 'id2');

    expect(component.fieldIds).toEqual({});

    component.ngOnInit();

    expect(component.fieldIds).toEqual(
      {
        Name1: 'id1',
        Name2: 'id2'
      }
    );
  });

  it('should overwrite local value', () => {
    expect(component.localValue).toBe(undefined);

    component.writeValue(true);

    expect(component.localValue).toBeTrue();
  });

  it('should update local value', () => {
    component.localValue = {
      first: false
    };

    expect(component.localValue.first).toBeFalse();

    component.updateValue(true, 'first');

    expect(component.localValue.first).toBeTrue();
  });

  it('should get empty object on validating', () => {
    expect(component.validate(null)).toEqual({});
  });

  it('should get schema', () => {
    component.propertySchemas = [
      {
        name: 'id1',
        schema: 'schema'
      }
    ];

    expect(component.getSchema(0)).toBe('schema');
  });

  it('should get empty string', () => {
    expect(component.getEmptyString()).toBe('');
  });

  it('should get label for focus target', () => {
    component.labelForFocusTarget = 'Focus target';

    expect(component.getLabelForFocusTarget()).toBe('Focus target');
  });

  it('should get human readable property description', () => {
    expect(component.getHumanReadablePropertyDescription({
      description: 'This is the property description',
      name: 'Property Name'
    })).toBe('This is the property description');
  });
});
