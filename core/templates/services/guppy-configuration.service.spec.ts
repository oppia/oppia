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

declare global {
  interface Window {
    Guppy: Object;
  }
}

class MockGuppy {
  constructor(id: string, config: Object) {}

  event(name: string, handler: Function): void {
    handler();
  }
  asciimath(): string {
    return 'Dummy value';
  }
  render(): void {}
  configure(name: string, val: Object): void {}
  static 'remove_global_symbol'(symbol: string): void {}
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
  });

  describe('Individual service', () => {
    it('should configure guppy if service is not initialized', () => {
      GuppyConfigurationService.serviceIsInitialized = false;
      spyOn(Guppy, 'remove_global_symbol');
      guppyConfigurationService.init();
      expect(Guppy.remove_global_symbol).toHaveBeenCalled();
    });

    it('should not configure guppy if service is initialized', () => {
      GuppyConfigurationService.serviceIsInitialized = true;
      spyOn(Guppy, 'remove_global_symbol');
      guppyConfigurationService.init();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();
    });
  });

  describe('Components calling the service', () => {
    let MathEditorCtrl = null;

    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'GuppyConfigurationService', guppyConfigurationService);
    }));
    beforeEach(angular.mock.inject(function($componentController) {
      MathEditorCtrl = $componentController('mathEditor');
    }));

    it('should configure guppy on the first initialization', () => {
      GuppyConfigurationService.serviceIsInitialized = false;
      spyOn(Guppy, 'remove_global_symbol');
      MathEditorCtrl.$onInit();
      expect(Guppy.remove_global_symbol).toHaveBeenCalled();
    });

    it('should not configure guppy on multiple initializations', () => {
      MathEditorCtrl.$onInit();

      spyOn(Guppy, 'remove_global_symbol');
      MathEditorCtrl.$onInit();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();

      let mockComponent = new MockComponent(guppyConfigurationService);
      mockComponent.onInit();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();
    });
  });
});
