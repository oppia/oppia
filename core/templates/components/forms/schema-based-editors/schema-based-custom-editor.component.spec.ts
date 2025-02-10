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
 * @fileoverview Unit tests for schema-based editor component for custom values
 */

import {
  Component,
  EventEmitter,
  NO_ERRORS_SCHEMA,
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {SchemaBasedCustomEditorComponent} from './schema-based-custom-editor.component';
import {SchemaDefaultValue} from 'services/schema-default-value.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';

// Trying to use the actual Object editor component in the tests would require
// a lot of mocking to be done (given the size of the component and how many
// other component it shows inside of itself). So, we use a mock component
// instead.
@Component({
  selector: 'object-editor',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockObjectEditorComponent),
      multi: true,
    },
  ],
})
export class MockObjectEditorComponent implements ControlValueAccessor {
  writeValue(value: string | number | null): void {}
  registerOnChange(fn: () => void): void {}
  registerOnTouched(fn: (() => void) | undefined): void {}
  setDisabledState?(isDisabled: boolean): void {}
}

describe('Schema Based Custom Editor Component', () => {
  let component: SchemaBasedCustomEditorComponent;
  let fixture: ComponentFixture<SchemaBasedCustomEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      declarations: [
        SchemaBasedCustomEditorComponent,
        MockObjectEditorComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [TranslateService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedCustomEditorComponent);
    component = fixture.componentInstance;
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let mockFunction = function (value: SchemaDefaultValue) {
      return value;
    };

    component.registerOnChange(mockFunction);
    component.registerOnTouched(() => {});
    component.onValidatorChange();
    component.onTouch();

    expect(component).toBeDefined();
    expect(component.onChange).toBeDefined();
  }));

  it('should write value', () => {
    component.localValue = null;
    component.writeValue(null);

    expect(component.localValue).toEqual(null);

    component.writeValue('true');
    expect(component.localValue).toEqual('true');
  });

  it('should not overwrite when local value not change', () => {
    component.localValue = 'true';

    component.writeValue('true');

    expect(component.localValue).toBe('true');
  });

  it('should update value when local value change', () => {
    component.localValue = 'true';

    expect(component.localValue).toBe('true');

    component.updateValue('false');

    expect(component.localValue).toBe('false');
  });

  it('should not update value when local value not change', () => {
    component.localValue = 'true';

    expect(component.localValue).toBe('true');

    component.updateValue('true');

    expect(component.localValue).toBe('true');
  });

  it('should register validator and call it when the form validation changes', fakeAsync(() => {
    component.schema = {obj_type: 'UnicodeString', type: 'custom'};
    fixture.detectChanges();
    const onValidatorChangeSpy = jasmine.createSpy('validator onchange spy');

    // The statusChanges property in the form used in the component is an
    // observable which is triggered by changes to the form state in the
    // template. Since we are not doing template-based testing, we need to
    // mock the statusChanges property of the form.
    let mockFormStatusChangeEmitter = new EventEmitter();
    spyOnProperty(component.hybridForm, 'statusChanges').and.returnValue(
      mockFormStatusChangeEmitter
    );
    component.registerOnValidatorChange(onValidatorChangeSpy);
    component.ngAfterViewInit();

    expect(onValidatorChangeSpy).not.toHaveBeenCalled();

    component.validate(new FormControl());
    mockFormStatusChangeEmitter.emit();
    // The subscription to statusChanges is asynchronous, so we need to
    // tick() to trigger the callback.
    tick();

    expect(onValidatorChangeSpy).toHaveBeenCalled();
  }));
});
