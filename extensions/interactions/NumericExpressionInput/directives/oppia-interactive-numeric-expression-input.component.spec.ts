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
 * @fileoverview Unit tests for the NumericExpressionInput interactive
 * component.
 */

import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractiveNumericExpressionInput } from
  './oppia-interactive-numeric-expression-input.component';

describe('NumericExpressionInputInteractive', () => {
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        declarations: [InteractiveNumericExpressionInput],
        providers: [
          {
            provide: CurrentInteractionService,
            useClass: MockCurrentInteractionService
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

  
// describe('NumericExpressionInputInteractive', () => {
//   let ctrl = null, $window = null;
//   let mockCurrentInteractionService = {
//     onSubmit: function(answer, rulesService) {},
//     registerCurrentInteraction: function(submitAnswerFn, validateExpressionFn) {
//       submitAnswerFn();
//     }
//   };
//   let mockNumericExpressionInputRulesService = {};
//   let mockInteractionAttributesExtractorService = {
//     getValuesFromAttributes: (interactionId, attrs) => {
//       return {
//         placeholder: {
//           unicode: null
//         }
//       };
//     }
//   };
//   let mockGuppyObject = {
//     guppyInstance: {
//       asciimath: () => {
//         return 'Dummy value';
//       }
//     }
//   };
//   let guppyConfigurationService = null;
//   let mathInteractionsService = null;
//   let guppyInitializationService = null;
//   let deviceInfoService = null;

//   class MockGuppy {
//     constructor(id: string, config: Object) {}

//     asciimath() {
//       return 'Dummy value';
//     }
//     configure(name: string, val: Object): void {}
//     static event(name: string, handler: Function): void {
//       handler({focused: true});
//     }
//     static configure(name: string, val: Object): void {}
//     static 'remove_global_symbol'(symbol: string): void {}
//     static 'add_global_symbol'(name: string, symbol: Object): void {}
//   }

//   beforeEach(angular.mock.module('oppia'));
//   beforeEach(angular.mock.module('oppia', function($provide) {
//     guppyConfigurationService = new GuppyConfigurationService();
//     mathInteractionsService = new MathInteractionsService();
//     guppyInitializationService = new GuppyInitializationService();
//     deviceInfoService = new DeviceInfoService(new WindowRef());

//     $provide.value(
//       'CurrentInteractionService', mockCurrentInteractionService);
//     $provide.value(
//       'NumericExpressionInputRulesService',
//       mockNumericExpressionInputRulesService);
//     $provide.value(
//       'InteractionAttributesExtractorService',
//       mockInteractionAttributesExtractorService);
//     $provide.value('$attrs', 'placeholder');
//     $provide.value('GuppyConfigurationService', guppyConfigurationService);
//     $provide.value('MathInteractionsService', mathInteractionsService);
//     $provide.value('GuppyInitializationService', guppyInitializationService);
//   }));
//   beforeEach(angular.mock.inject(function($injector, $componentController) {
//     $window = $injector.get('$window');
//     ctrl = $componentController('oppiaInteractiveNumericExpressionInput');
//     $window.Guppy = MockGuppy;
//   }));

//   it('should add the change handler to guppy', function() {
//     spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
//       mockGuppyObject);
//     ctrl.$onInit();
//     expect(guppyInitializationService.findActiveGuppyObject).toHaveBeenCalled();
//   });

//   it('should not submit the answer if invalid', function() {
//     ctrl.hasBeenTouched = true;
//     // Invalid answer.
//     ctrl.value = '1/';

//     spyOn(mockCurrentInteractionService, 'onSubmit');
//     ctrl.submitAnswer();
//     expect(mockCurrentInteractionService.onSubmit).not.toHaveBeenCalled();
//     expect(ctrl.warningText).toBe(
//       'Your answer seems to be missing a variable/number after the "/".');
//   });

//   it('should submit the answer if valid', function() {
//     ctrl.hasBeenTouched = true;
//     ctrl.value = '1+1';

//     spyOn(mockCurrentInteractionService, 'onSubmit');
//     ctrl.submitAnswer();
//     expect(mockCurrentInteractionService.onSubmit).toHaveBeenCalled();
//     expect(ctrl.warningText).toBe('');
//   });

//   it('should correctly validate current answer', function() {
//     // This should be validated as true if the editor hasn't been touched.
//     ctrl.value = '';
//     expect(ctrl.isCurrentAnswerValid()).toBeTrue();
//     expect(ctrl.warningText).toBe('');

//     ctrl.hasBeenTouched = true;
//     // This should be validated as false if the editor has been touched.
//     ctrl.value = '';
//     expect(ctrl.isCurrentAnswerValid()).toBeFalse();
//     expect(ctrl.warningText).toBe('Please enter an answer before submitting.');
//   });

//   it('should set the value of showOSK to true', function() {
//     spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
//     spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);

//     expect(guppyInitializationService.getShowOSK()).toBeFalse();
//     ctrl.showOSK();
//     expect(guppyInitializationService.getShowOSK()).toBeTrue();
//   });
// });
