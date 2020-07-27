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

import { DeviceInfoService } from 'services/contextual/device-info.service.ts';
import { GuppyConfigurationService } from
  'services/guppy-configuration.service.ts';
import { GuppyInitializationService } from
  'services/guppy-initialization.service.ts';
import { MathInteractionsService } from 'services/math-interactions.service.ts';
import { WindowRef } from 'services/contextual/window-ref.service.ts';

describe('AlgebraicExpressionEditor', function() {
  var ctrl = null, $window = null;
  var mockGuppyObject = {
    guppyInstance: {
      asciimath: function() {
        return 'Dummy value';
      }
    }
  };
  var guppyConfigurationService = null;
  var mathInteractionsService = null;
  var guppyInitializationService = null;
  let deviceInfoService = null;

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
  }

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    guppyConfigurationService = new GuppyConfigurationService(
      new DeviceInfoService(new WindowRef()));
    mathInteractionsService = new MathInteractionsService();
    guppyInitializationService = new GuppyInitializationService();
    deviceInfoService = new DeviceInfoService(new WindowRef());
    $provide.value('GuppyConfigurationService', guppyConfigurationService);
    $provide.value('MathInteractionsService', mathInteractionsService);
    $provide.value('GuppyInitializationService', guppyInitializationService);
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $window = $injector.get('$window');
    ctrl = $componentController('algebraicExpressionEditor');
    $window.Guppy = MockGuppy;
    ctrl.currentValue = '';
  }));

  it('should add the change handler to guppy', function() {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject);
    ctrl.$onInit();
    expect(guppyInitializationService.findActiveGuppyObject).toHaveBeenCalled();
  });

  it('should not show warnings if the editor is active', function() {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject);
    ctrl.warningText = '';
    ctrl.isCurrentAnswerValid();
    expect(ctrl.warningText).toBe('');
  });

  it('should initialize ctrl.value with an empty string', function() {
    ctrl.value = null;
    ctrl.$onInit();
    expect(ctrl.value).not.toBeNull();
  });

  it('should correctly validate current answer', function() {
    // This should not show warnings if the editor hasn't been touched.
    ctrl.currentValue = '';
    ctrl.isCurrentAnswerValid();
    expect(ctrl.warningText).toBe('');

    ctrl.hasBeenTouched = true;
    // This should be validated as false if the editor has been touched.
    ctrl.currentValue = '';
    expect(ctrl.isCurrentAnswerValid()).toBeFalse();
    expect(ctrl.warningText).toBe('Please enter an answer before submitting.');

    ctrl.currentValue = 'x/2';
    expect(ctrl.isCurrentAnswerValid()).toBeTrue();
    expect(ctrl.warningText).toBe('');
  });

  it('should set the value of showOSK to true', function() {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);

    expect(guppyInitializationService.getShowOSK()).toBeFalse();
    ctrl.showOSK();
    expect(guppyInitializationService.getShowOSK()).toBeTrue();

    MockGuppy.focused = false;
    ctrl.$onInit();
  });
});
