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
 * @fileoverview Unit tests for Schema Based Unicode Editor Component
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormControl, FormsModule} from '@angular/forms';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {DeviceInfoService} from 'services/contextual/device-info.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {SchemaBasedUnicodeEditor} from './schema-based-unicode-editor.component';

describe('Schema Based Unicode Editor', () => {
  let component: SchemaBasedUnicodeEditor;
  let fixture: ComponentFixture<SchemaBasedUnicodeEditor>;
  let deviceInfoService: DeviceInfoService;
  let schemaFormSubmittedService: SchemaFormSubmittedService;
  let stateCustomizationArgsService: StateCustomizationArgsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      declarations: [SchemaBasedUnicodeEditor],
      providers: [
        DeviceInfoService,
        FocusManagerService,
        SchemaFormSubmittedService,
        StateCustomizationArgsService,
        TranslateService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedUnicodeEditor);
    component = fixture.componentInstance;
    deviceInfoService = TestBed.inject(DeviceInfoService);
    schemaFormSubmittedService = TestBed.inject(SchemaFormSubmittedService);
    stateCustomizationArgsService = TestBed.inject(
      StateCustomizationArgsService
    );

    component.uiConfig = {
      rows: ['Row 1', 'Row 2'],
      placeholder: 'Placeholder text',
      coding_mode: 'python',
    };
    component.disabled = true;
    component.validators = [];

    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should instantiate codemirror on initialization', fakeAsync(() => {
    let cm = {
      getOption: () => 2,
      replaceSelection: () => {},
      getDoc: () => {
        return {
          getCursor: () => {},
          setCursor: () => {},
        };
      },
    } as unknown as CodeMirror.Editor;
    spyOn(cm, 'replaceSelection');
    component.ngOnInit();

    component.registerOnTouched(null);
    let mockFunction = function (value: string) {
      return value;
    };
    component.registerOnChange(mockFunction);
    component.onChange = (val: string) => {
      return;
    };
    component.updateLocalValue();
    expect(component.codemirrorStatus).toBeFalse();
    tick(200);

    component.codemirrorOptions.extraKeys.Tab(cm);

    expect(component.codemirrorOptions.indentWithTabs).toBeFalse();
    expect(component.codemirrorOptions.lineNumbers).toBeTrue();
    expect(cm.replaceSelection).toHaveBeenCalled();
    expect(component.codemirrorOptions.readOnly).toBe('nocursor');
    expect(component.codemirrorOptions.mode).toBe('python');
    expect(component.codemirrorStatus).toBeTrue();
  }));

  it('should flip the codemirror status flag when form view is opened', fakeAsync(() => {
    let onSchemaBasedFormsShownEmitter = new EventEmitter();
    spyOnProperty(
      stateCustomizationArgsService,
      'onSchemaBasedFormsShown'
    ).and.returnValue(onSchemaBasedFormsShownEmitter);

    component.ngOnInit();
    tick(200);

    expect(component.codemirrorStatus).toBeTrue();

    onSchemaBasedFormsShownEmitter.emit();
    tick(200);

    expect(component.codemirrorStatus).toBeFalse();
  }));

  it('should get empty object on validating', () => {
    expect(component.validate(new FormControl(1))).toEqual(null);
  });

  it('should write value', () => {
    component.localValue = 'test1';

    component.writeValue('test');
    expect(component.localValue).toEqual('test');
  });

  it('should get coding mode', () => {
    expect(component.getCodingMode()).toBe('python');

    component.uiConfig = undefined;

    expect(component.getCodingMode()).toBe(null);
  });

  it('should get the number of rows', () => {
    expect(component.getRows()).toEqual(['Row 1', 'Row 2']);

    component.uiConfig = undefined;

    expect(component.getRows()).toBe(null);
  });

  it('should get the placeholder value', () => {
    expect(component.getPlaceholder()).toBe('Placeholder text');

    component.uiConfig = {
      rows: ['Row 1', 'Row 2'],
      placeholder: '',
      coding_mode: 'python',
    };

    expect(component.getPlaceholder()).toBe(
      'I18N_PLAYER_DEFAULT_MOBILE_PLACEHOLDER'
    );

    component.uiConfig = undefined;

    expect(component.getPlaceholder()).toBe('');
  });

  it('should submit form on keypress', () => {
    spyOn(schemaFormSubmittedService.onSubmittedSchemaBasedForm, 'emit');
    let evt = new KeyboardEvent('', {
      keyCode: 13,
    });

    component.onKeypress(evt);

    expect(
      schemaFormSubmittedService.onSubmittedSchemaBasedForm.emit
    ).toHaveBeenCalled();
  });
});
