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

import { DeviceInfoService } from 'services/contextual/device-info.service';
import { GuppyConfigurationService } from 'services/guppy-configuration.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';
import { MathInteractionsService } from 'services/math-interactions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { importAllAngularServices } from 'tests/unit-test-utils';

require(
  'interactions/NumericExpressionInput/directives/' +
  'numeric-expression-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/NumericExpressionInput/directives/' +
  'oppia-interactive-numeric-expression-input.component.ts');

describe('NumericExpressionInputInteractive', function() {
  let ctrl = null, $window = null;
  let mockCurrentInteractionService = {
    onSubmit: function(answer, rulesService) {},
    registerCurrentInteraction: function(submitAnswerFn, validateExpressionFn) {
      submitAnswerFn();
    }
  };
  let mockNumericExpressionInputRulesService = {};
  let mockInteractionAttributesExtractorService = {
    getValuesFromAttributes: function(interactionId, attrs) {
      return {
        placeholder: {
          unicode: '2^2'
        }
      };
    }
  };
  let mockGuppyObject = {
    guppyInstance: {
      asciimath: function() {
        return 'Dummy value';
      }
    }
  };
  let guppyConfigurationService = null;
  let mathInteractionsService = null;
  let guppyInitializationService = null;
  let deviceInfoService = null;

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

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(angular.mock.module('oppia', function($provide) {
    guppyConfigurationService = new GuppyConfigurationService();
    mathInteractionsService = new MathInteractionsService();
    guppyInitializationService = new GuppyInitializationService();
    deviceInfoService = new DeviceInfoService(new WindowRef());

    $provide.value(
      'CurrentInteractionService', mockCurrentInteractionService);
    $provide.value(
      'NumericExpressionInputRulesService',
      mockNumericExpressionInputRulesService);
    $provide.value(
      'InteractionAttributesExtractorService',
      mockInteractionAttributesExtractorService);
    $provide.value('$attrs', 'placeholder');
    $provide.value('GuppyConfigurationService', guppyConfigurationService);
    $provide.value('MathInteractionsService', mathInteractionsService);
    $provide.value('GuppyInitializationService', guppyInitializationService);
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $window = $injector.get('$window');
    ctrl = $componentController('oppiaInteractiveNumericExpressionInput');
    $window.Guppy = MockGuppy;
  }));

  it('should add the change handler to guppy', function() {
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      mockGuppyObject);
    ctrl.$onInit();
    expect(guppyInitializationService.findActiveGuppyObject).toHaveBeenCalled();
  });

  it('should not submit the answer if invalid', function() {
    ctrl.hasBeenTouched = true;
    // Invalid answer.
    ctrl.value = '1/';

    spyOn(mockCurrentInteractionService, 'onSubmit');
    ctrl.submitAnswer();
    expect(mockCurrentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(ctrl.warningText).toBe(
      'Your answer seems to be missing a variable/number after the "/".');
  });

  it('should submit the answer if valid', function() {
    ctrl.hasBeenTouched = true;
    ctrl.value = '1+1';

    spyOn(mockCurrentInteractionService, 'onSubmit');
    ctrl.submitAnswer();
    expect(mockCurrentInteractionService.onSubmit).toHaveBeenCalled();
    expect(ctrl.warningText).toBe('');
  });

  it('should correctly validate current answer', function() {
    // This should be validated as true if the editor hasn't been touched.
    ctrl.value = '';
    expect(ctrl.isCurrentAnswerValid()).toBeTrue();
    expect(ctrl.warningText).toBe('');

    ctrl.hasBeenTouched = true;
    // This should be validated as false if the editor has been touched.
    ctrl.value = '';
    expect(ctrl.isCurrentAnswerValid()).toBeFalse();
    expect(ctrl.warningText).toBe('Please enter an answer before submitting.');
  });

  it('should set the value of showOSK to true', function() {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);

    expect(guppyInitializationService.getShowOSK()).toBeFalse();
    ctrl.showOSK();
    expect(guppyInitializationService.getShowOSK()).toBeTrue();
  });
});
