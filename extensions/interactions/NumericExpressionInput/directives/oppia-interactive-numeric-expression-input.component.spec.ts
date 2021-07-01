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
import { GuppyInitializationService } from 'services/guppy-initialization.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractiveNumericExpressionInput } from './oppia-interactive-numeric-expression-input.component';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('NumericExpressionInputInteractive', () => {
  importAllAngularServices();

  let component: InteractiveNumericExpressionInput;
  let fixture: ComponentFixture<InteractiveNumericExpressionInput>;
  let windowRef: WindowRef;
  let guppyInitializationService: GuppyInitializationService;
  let deviceInfoService: DeviceInfoService;
  let mockCurrentInteractionService;
  let mockGuppyObject = {
    divId: '1',
    guppyInstance: {
      asciimath: function() {
        return 'Dummy value';
      }
    }
  };
  class MockGuppy {
    constructor(id: string, config: Object) {}

    asciimath() {
      return 'Dummy value';
    }
    configure(name: string, val: Object): void {}
    static event(name: string, handler: Function): void {
      handler({focused: true});
    }
    static configure(name: string, val: Object): void {}
    static 'remove_global_symbol'(symbol: string): void {}
    static 'add_global_symbol'(name: string, symbol: Object): void {}
  }

  class MockCurrentInteractionService {
    onSubmit(answer, rulesService) {}
    registerCurrentInteraction(submitAnswerFn, validateExpressionFn) {
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
    windowRef.nativeWindow.Guppy = MockGuppy;
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
      mockGuppyObject);
    component.ngOnInit();
    expect(guppyInitializationService.findActiveGuppyObject).toHaveBeenCalled();
  });

  it('should not submit the answer if invalid', function() {
    component.hasBeenTouched = true;
    // Invalid answer.
    component.value = '1/';
    fixture.detectChanges();
    spyOn(mockCurrentInteractionService, 'onSubmit');
    component.submitAnswer();
    expect(mockCurrentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(component.warningText).toBe(
      'Your answer seems to be missing a variable/number after the "/".');
  });

  it('should submit the answer if valid', function() {
    component.hasBeenTouched = true;
    component.value = '1+1';
    spyOn(mockCurrentInteractionService, 'onSubmit');
    component.submitAnswer();
    expect(mockCurrentInteractionService.onSubmit).toHaveBeenCalled();
    expect(component.warningText).toBe('');
  });

  it('should correctly validate current answer', function() {
    // This should be validated as true if the editor hasn't been touched.
    component.value = '';
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
});
