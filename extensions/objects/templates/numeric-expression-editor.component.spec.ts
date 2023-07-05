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
 * @fileoverview Unit tests for the numeric expression editor.
 */

import { DeviceInfoService } from 'services/contextual/device-info.service';
import { GuppyInitializationService, GuppyObject } from 'services/guppy-initialization.service';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NumericExpressionEditorComponent } from './numeric-expression-editor.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('NumericExpressionEditor', () => {
  let fixture: ComponentFixture<NumericExpressionEditorComponent>;
  let component: NumericExpressionEditorComponent;
  const originalGuppy = window.Guppy;
  const mockGuppyObject = {
    divId: '2',
    guppyInstance: {
      asciimath: () => {
        return 'Dummy value';
      }
    }
  };
  let guppyInitializationService: GuppyInitializationService;
  let deviceInfoService: DeviceInfoService;

  class MockGuppy {
    static focused = true;
    constructor(id: string, config: Object) {}

    asciimath() {
      return 'Dummy value';
    }

    configure(name: string, val: Object): void {}
    static event(name: string, handler: Function): void {
      handler({focused: MockGuppy.focused});
    }

    static configure(name: string, val: Object): void {}
    static 'remove_global_symbol'(symbol: string): void {}
    static 'add_global_symbol'(name: string, symbol: Object): void {}
  }
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NumericExpressionEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents;
  }));
  beforeEach((waitForAsync(() => {
    fixture = TestBed.createComponent(NumericExpressionEditorComponent);
    component = fixture.componentInstance;
    guppyInitializationService = TestBed.inject(GuppyInitializationService);
    deviceInfoService = TestBed.inject(DeviceInfoService);
    window.Guppy = MockGuppy as unknown as Guppy;
  })));

  afterEach(() => {
    window.Guppy = originalGuppy;
  });

  it('should add the change handler to guppy', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    component.ngOnInit();
    expect(guppyInitializationService.findActiveGuppyObject).toHaveBeenCalled();
  });

  it('should not show warnings if the editor is active', () => {
    // This throws "Type 'undefined' is not assignable to type 'string'".
    // We need to suppress this error because we are testing validations here.
    // Validation here refers to the 'if' checks defined in ngOnInit() which
    // replaces 'value' with empty strings if null or undefined.
    // @ts-ignore
    component.currentValue = undefined;
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    component.warningText = '';
    component.isCurrentAnswerValid();
    expect(component.warningText).toBe('');
  });

  it('should initialize component.value with an empty string', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    // This throws "Type 'null' is not assignable to type 'string'".
    // We need to suppress this error because we are testing validations here.
    // Validation here refers to the 'if' checks defined in ngOnInit() which
    // replaces 'value' with empty strings if null or undefined.
    // @ts-ignore
    component.value = null;
    MockGuppy.focused = false;
    component.ngOnInit();
    expect(component.value).not.toBeNull();
  });

  it('should correctly validate current answer', () => {
    // This should not show warnings if the editor hasn't been touched.
    component.isCurrentAnswerValid();
    expect(component.warningText).toBe('');

    component.hasBeenTouched = true;
    // This should be validated as false if the editor has been touched.
    expect(component.isCurrentAnswerValid()).toBeFalse();
    expect(
      component.warningText).toBe('Please enter an answer before submitting.');

    component.currentValue = '45/2';
    expect(component.isCurrentAnswerValid()).toBeTrue();
    expect(component.warningText).toBe('');
  });

  it('should set the value of showOSK to true', () => {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);

    expect(guppyInitializationService.getShowOSK()).toBeFalse();
    component.showOSK();
    expect(guppyInitializationService.getShowOSK()).toBeTrue();
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    MockGuppy.focused = false;
    component.ngOnInit();
  });
});
