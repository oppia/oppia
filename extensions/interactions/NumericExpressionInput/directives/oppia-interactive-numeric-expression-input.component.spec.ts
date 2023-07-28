// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the NumericExpressionInput interactive
 * component.
 */

import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { GuppyInitializationService, GuppyObject } from 'services/guppy-initialization.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractiveNumericExpressionInput } from './oppia-interactive-numeric-expression-input.component';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { InteractionAnswer, NumericExpressionAnswer } from 'interactions/answer-defs';

describe('NumericExpressionInputInteractive', () => {
  const asciiDummyValue: string = 'Dummy value';
  let component: InteractiveNumericExpressionInput;
  let fixture: ComponentFixture<InteractiveNumericExpressionInput>;
  let windowRef: WindowRef;
  let guppyInitializationService: GuppyInitializationService;
  let deviceInfoService: DeviceInfoService;
  let mockCurrentInteractionService: CurrentInteractionService;
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

  class MockCurrentInteractionService {
    onSubmit(
        answer: NumericExpressionAnswer, rulesService: CurrentInteractionService
    ) {}

    updateCurrentAnswer(answer: InteractionAnswer): void {}

    registerCurrentInteraction(
        submitAnswerFn: Function, validateExpressionFn: Function) {
      submitAnswerFn();
      validateExpressionFn();
    }
  }

  class MockInteractionAttributesExtractorService {
    getValuesFromAttributes(inputType: string, attributes: Object) {
      return {
        useFractionForDivision: {
          value: {}
        },
        placeholder: {
          value: {
            unicode: '2^2'
          }
        }
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        declarations: [InteractiveNumericExpressionInput],
        providers: [
          {
            provide: CurrentInteractionService,
            useClass: MockCurrentInteractionService
          },
          {
            provide: InteractionAttributesExtractorService,
            useClass: MockInteractionAttributesExtractorService
          }
        ]
      }).compileComponents();
  }));

  beforeEach(() => {
    windowRef = TestBed.inject(WindowRef);
    windowRef.nativeWindow.Guppy = MockGuppy as unknown as Guppy;
    guppyInitializationService = TestBed.inject(GuppyInitializationService);
    mockCurrentInteractionService = TestBed.inject(CurrentInteractionService);
    deviceInfoService = TestBed.inject(DeviceInfoService);
    fixture = TestBed.createComponent(
      InteractiveNumericExpressionInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should add the change handler to guppy', () => {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject as GuppyObject);
    component.ngOnInit();
    expect(guppyInitializationService.findActiveGuppyObject).toHaveBeenCalled();
  });

  it('should not submit the answer if invalid', function() {
    component.hasBeenTouched = false;
    // Invalid answer.
    component.value = '1/';
    fixture.detectChanges();
    spyOn(mockCurrentInteractionService, 'onSubmit');

    component.submitAnswer();

    expect(mockCurrentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(component.warningText).toBe(
      'Your answer seems to be missing a variable/number after the "/".');
    expect(component.hasBeenTouched).toBeTrue();
  });

  it('should submit the answer if valid', function() {
    component.hasBeenTouched = false;
    component.value = '1+1';
    spyOn(mockCurrentInteractionService, 'onSubmit');

    component.submitAnswer();

    expect(mockCurrentInteractionService.onSubmit).toHaveBeenCalled();
    expect(component.warningText).toBe('');
    expect(component.hasBeenTouched).toBeTrue();
  });

  it('should correctly validate current answer', function() {
    // This should be validated as true if the editor hasn't been touched.
    component.value = '';
    component.hasBeenTouched = false;
    fixture.detectChanges();
    expect(component.isCurrentAnswerValid()).toBeTrue();
    expect(component.warningText).toBe('');

    component.hasBeenTouched = true;
    // This should be validated as false if the editor has been touched.
    component.value = '';
    fixture.detectChanges();
    expect(component.isCurrentAnswerValid()).toBeFalse();
    expect(
      component.warningText).toBe('Please enter an answer before submitting.');
  });

  it('should set the value of showOSK to true', function() {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);

    expect(guppyInitializationService.getShowOSK()).toBeFalse();
    component.showOSK();
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
    spyOn(mockCurrentInteractionService, 'updateCurrentAnswer');
    spyOn(component, 'isCurrentAnswerValid');

    component.onAnswerChange({focused: false});

    expect(component.value).toEqual(asciiDummyValue);
    expect(component.hasBeenTouched).toBeTrue();
    expect(
      mockCurrentInteractionService.updateCurrentAnswer
    ).toHaveBeenCalledOnceWith(asciiDummyValue);
    expect(component.isCurrentAnswerValid).toHaveBeenCalledTimes(1);
  });
});
