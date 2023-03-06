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
 * @fileoverview Unit tests for the algebraic expression editor.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { GuppyInitializationService, GuppyObject } from 'services/guppy-initialization.service';
import { AlgebraicExpressionEditorComponent } from './algebraic-expression-editor.component';
import { TranslateService } from '@ngx-translate/core';

class MockTranslateService {
  instant(key: string): string {
    return key;
  }
}

describe('AlgebraicExpressionEditor', () => {
  let component: AlgebraicExpressionEditorComponent;
  let fixture: ComponentFixture<AlgebraicExpressionEditorComponent>;
  let windowRef: WindowRef;
  let guppyInitializationService: GuppyInitializationService;
  let deviceInfoService: DeviceInfoService;
  const mockGuppyObject = {
    divId: '1',
    guppyInstance: {
      asciimath: () => {
        return 'Dummy value';
      }
    }
  };

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

  class MockWindowRef {
    _window = {
      Guppy: MockGuppy
    };

    get nativeWindow() {
      return this._window;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        imports: [HttpClientTestingModule],
        declarations: [AlgebraicExpressionEditorComponent],
        providers: [
          {
            provide: windowRef,
            useClass: MockWindowRef
          }, {
            provide: TranslateService,
            useClass: MockTranslateService
          }
        ]
      }
    ).compileComponents();
  }));
  beforeEach(() => {
    windowRef = TestBed.inject(WindowRef);
    deviceInfoService = TestBed.inject(DeviceInfoService);
    guppyInitializationService = TestBed.inject(GuppyInitializationService);
    fixture = TestBed.createComponent(
      AlgebraicExpressionEditorComponent);
    component = fixture.componentInstance;
    windowRef.nativeWindow.Guppy = MockGuppy as unknown as Guppy;
  });

  it('should add the change handler to guppy', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    component.ngOnInit();
    expect(guppyInitializationService.findActiveGuppyObject).toHaveBeenCalled();
  });

  it('should not show warnings if the editor is active', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    component.warningText = '';
    component.isCurrentAnswerValid();
    expect(component.warningText).toBe('');
  });

  it('should initialize component.value with an empty string', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
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

    component.currentValue = 'x/2';
    spyOn(guppyInitializationService, 'getAllowedVariables').and.returnValue(
      ['x']);
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
