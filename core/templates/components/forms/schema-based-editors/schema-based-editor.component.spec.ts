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

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormControl, FormsModule } from '@angular/forms';
import { SchemaDefaultValue } from 'services/schema-default-value.service';
import { SchemaBasedEditorComponent } from './schema-based-editor.component';

describe('Schema based editor component', function() {
  let component: SchemaBasedEditorComponent;
  let fixture: ComponentFixture<SchemaBasedEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        SchemaBasedEditorComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedEditorComponent);
    component = fixture.componentInstance;

    component.schema = {
      type: 'float',
      choices: [12, 23]
    };

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function(value: SchemaDefaultValue) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.registerOnTouched();

    expect(component).toBeDefined();
    expect(component.validate(new FormControl(1))).toEqual(null);
    expect(component.onChange).toEqual(mockFunction);
    expect(component.onChange(19)).toEqual(19);
  }));

  it('should write value', () => {
    component.localValue = null;
    component.writeValue(null);

    expect(component.localValue).toEqual(null);

    component.writeValue(10);
    expect(component.localValue).toEqual(10);
  });

  it('should set form validity', fakeAsync(() => {
    let mockEmitter = new EventEmitter();
    let form = jasmine.createSpyObj(
      'form', ['$setValidity']);

    spyOnProperty(component.form, 'statusChanges')
      .and.returnValue(mockEmitter);
    spyOn(angular, 'element').and.returnValue(
      // This throws "Type '{ top: number; }' is not assignable to type
      // 'JQLite | Coordinates'". We need to suppress this error because
      // angular element have more properties than offset and top.
      // @ts-expect-error
      {
        controller: (formString: string) => {
          return form;
        }
      }
    );

    component.ngAfterViewInit();
    tick();
    mockEmitter.emit('INVALID');
    tick();
    mockEmitter.emit();

    component.writeValue(10);
    expect(component.localValue).toEqual(10);
    expect(form.$setValidity).toHaveBeenCalledTimes(2);
  }));
});
