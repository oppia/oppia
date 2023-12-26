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
 * @fileoverview Unit tests for the AlgebraicExpressionInput interactive
 * component.
 */

import { DeviceInfoService } from 'services/contextual/device-info.service';
import { AlgebraicExpressionInputInteractionComponent } from './oppia-interactive-algebraic-expression-input.component';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { GuppyInitializationService, GuppyObject } from 'services/guppy-initialization.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { TranslateService } from '@ngx-translate/core';
import { AlgebraicExpressionAnswer, InteractionAnswer } from 'interactions/answer-defs';

class MockTranslateService {
  instant(key: string): string {
    return key;
  }
}

describe('AlgebraicExpressionInputInteractive', () => {
  const asciiDummyValue: string = 'Dummy value';
  let component: AlgebraicExpressionInputInteractionComponent;
  let currentInteractionService: CurrentInteractionService;
  let fixture: ComponentFixture<AlgebraicExpressionInputInteractionComponent>;
  let windowRef: WindowRef;
  let guppyInitializationService: GuppyInitializationService;
  let deviceInfoService: DeviceInfoService;
  let mockGuppyObject = {
    divId: '1',
    guppyInstance: {
      asciimath: function() {
        return asciiDummyValue;
      }
    }
  };
  class MockGuppy {
    static focused = true;
    constructor(id: string, config: Object) {}

    asciimath() {
      return asciiDummyValue;
    }

    configure(name: string, val: Object): void {}
    static event(name: string, handler: Function): void {
      handler({focused: MockGuppy.focused});
    }

    static configure(name: string, val: Object): void {}
    static 'remove_global_symbol'(symbol: string): void {}
    static 'add_global_symbol'(name: string, symbol: Object): void {}
  }

  let mockCurrentInteractionService = {
    onSubmit: (
        answer: AlgebraicExpressionAnswer,
        rulesService: CurrentInteractionService
    ) => {},
    updateCurrentAnswer: (answer: InteractionAnswer) => {},
    registerCurrentInteraction: (
        submitAnswerFn: Function, validateExpressionFn: Function) => {
      submitAnswerFn();
      validateExpressionFn();
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        declarations: [AlgebraicExpressionInputInteractionComponent],
        providers: [
          {
            provide: CurrentInteractionService,
            useValue: mockCurrentInteractionService
          },
          {
            provide: TranslateService,
            useClass: MockTranslateService
          }
        ]
      }).compileComponents();
  }));

  beforeEach(() => {
    windowRef = TestBed.inject(WindowRef);
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    windowRef.nativeWindow.Guppy = MockGuppy as unknown as Guppy;
    guppyInitializationService = TestBed.inject(GuppyInitializationService);
    deviceInfoService = TestBed.inject(DeviceInfoService);
    fixture = TestBed.createComponent(
      AlgebraicExpressionInputInteractionComponent);
    component = fixture.componentInstance;
    component.allowedVariablesWithValue = '[&quot;a&quot;, &quot;b&quot;]';
    fixture.detectChanges();
  });

  it('should add the change handler to guppy', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    component.ngOnInit();
    expect(guppyInitializationService.findActiveGuppyObject).toHaveBeenCalled();
  });

  it('should determine when the component is destroyed', () => {
    component.ngOnInit();
    expect(component.viewIsDestroyed).toBe(false);

    component.ngOnDestroy();
    expect(component.viewIsDestroyed).toBe(true);
  });

  it('should not submit the answer if invalid', () => {
    component.hasBeenTouched = false;
    // Invalid answer.
    component.value = 'x/';

    spyOn(currentInteractionService, 'onSubmit');
    component.submitAnswer();
    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(component.warningText).toBe(
      'Your answer seems to be missing a variable/number after the "/".');
    expect(component.hasBeenTouched).toBeTrue();
  });

  it('should correctly validate current answer', () => {
    // This should be validated as true if the editor hasn't been touched.
    component.value = '';
    component.hasBeenTouched = false;
    expect(component.isCurrentAnswerValid()).toBeTrue();
    expect(component.warningText).toBe('');

    component.hasBeenTouched = true;
    // This should be validated as false if the editor has been touched.
    component.value = '';
    expect(component.isCurrentAnswerValid()).toBeFalse();
    expect(
      component.warningText).toBe('Please enter an answer before submitting.');
  });

  it('should set the value of showOSK to true', () => {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);

    expect(guppyInitializationService.getShowOSK()).toBeFalse();
    component.showOsk();
    expect(guppyInitializationService.getShowOSK()).toBeTrue();
  });

  it('should initialize component.value with an empty string', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    MockGuppy.focused = false;
    component.ngOnInit();
    expect(component.value).not.toBeNull();
  });

  it('should update current answer on change', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    component.ngOnInit();
    spyOn(currentInteractionService, 'updateCurrentAnswer');
    spyOn(component, 'isCurrentAnswerValid');

    component.onAnswerChange({focused: false});

    expect(component.value).toEqual(asciiDummyValue);
    expect(component.hasBeenTouched).toBeTrue();
    expect(
      currentInteractionService.updateCurrentAnswer
    ).toHaveBeenCalledOnceWith(asciiDummyValue);
    expect(component.isCurrentAnswerValid).toHaveBeenCalledTimes(1);
  });
});
