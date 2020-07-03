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
 * @fileoverview Unit test for GuppyConfigurationService
 */

import { TestBed } from '@angular/core/testing';

import { GuppyConfigurationService } from
  'services/guppy-configuration.service';
import { GuppyInitializationService } from
  'services/guppy-initialization.service.ts';
import { MathInteractionsService } from 'services/math-interactions.service.ts';
import { DeviceInfoService } from 'services/contextual/device-info.service.ts';
import { WindowRef } from 'services/contextual/window-ref.service.ts';

declare global {
  interface Window {
    Guppy: Object;
    GuppyOSK: Object;
  }
}

class MockGuppyOSK {
  constructor(config: Object) {}
}

class MockGuppy {
  constructor(id: string, config: Object) {}

  asciimath(): string {
    return 'Dummy value';
  }
  configure(name: string, val: Object): void {}
  static event(name: string, handler: Function): void {
    handler();
  }
  static configure(name: string, val: Object): void {}
  static 'remove_global_symbol'(symbol: string): void {}
  static 'use_osk'(osk: MockGuppyOSK): void {}
}

class MockComponent {
  guppyConfigService: GuppyConfigurationService = null;
  constructor(guppyConfigService: GuppyConfigurationService) {
    this.guppyConfigService = guppyConfigService;
  }

  onInit(): void {
    this.guppyConfigService.init();
  }
}

let guppyConfigurationService: GuppyConfigurationService = null;

describe('GuppyConfigurationService', () => {
  beforeAll(() => {
    guppyConfigurationService = TestBed.get(GuppyConfigurationService);
    window.Guppy = MockGuppy;
    window.GuppyOSK = MockGuppyOSK;
  });

  describe('Individual service', () => {
    it('should configure guppy if service is not initialized', () => {
      GuppyConfigurationService.serviceIsInitialized = false;
      spyOn(Guppy, 'remove_global_symbol');
      guppyConfigurationService.init();
      expect(Guppy.remove_global_symbol).toHaveBeenCalled();
    });

    it('should not attach osk if user is not on mobile device', () => {
      GuppyConfigurationService.serviceIsInitialized = false;
      spyOn(Guppy, 'use_osk');
      guppyConfigurationService.init();
      expect(Guppy.use_osk).not.toHaveBeenCalled();
    });

    it('should attach osk if user is on mobile device', () => {
      GuppyConfigurationService.serviceIsInitialized = false;
      let deviceInfoService = new DeviceInfoService(new WindowRef());
      let guppyConfigService = new GuppyConfigurationService(deviceInfoService);
      spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
      spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);
      spyOn(Guppy, 'use_osk');
      guppyConfigService.init();
      expect(Guppy.use_osk).toHaveBeenCalled();
    });

    it('should not configure guppy if service is initialized', () => {
      GuppyConfigurationService.serviceIsInitialized = true;
      spyOn(Guppy, 'remove_global_symbol');
      guppyConfigurationService.init();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();
    });
  });

  describe('Components calling the service', () => {
    let ctrl = null;

    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'GuppyConfigurationService', guppyConfigurationService);
      $provide.value('MathInteractionsService', new MathInteractionsService());
      $provide.value('GuppyInitializationService',
        new GuppyInitializationService());
    }));
    beforeEach(angular.mock.inject(function($componentController) {
      ctrl = $componentController('algebraicExpressionEditor');
    }));

    it('should configure guppy on the first initialization', () => {
      GuppyConfigurationService.serviceIsInitialized = false;
      spyOn(Guppy, 'remove_global_symbol');
      ctrl.$onInit();
      expect(Guppy.remove_global_symbol).toHaveBeenCalled();
    });

    it('should not configure guppy on multiple initializations', () => {
      ctrl.$onInit();

      spyOn(Guppy, 'remove_global_symbol');
      ctrl.$onInit();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();

      let mockComponent = new MockComponent(guppyConfigurationService);
      mockComponent.onInit();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();
    });
  });
});
