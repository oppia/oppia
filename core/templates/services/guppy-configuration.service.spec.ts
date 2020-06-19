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

import { GuppyConfigurationService } from
  'services/guppy-configuration.service';

declare global {
  interface Window {
    Guppy: Object;
  }
}

describe('GuppyConfigurationService', () => {
  let guppyConfigurationService: GuppyConfigurationService = null;
  let $componentController = null, MathEditorCtrl = null;
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

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    guppyConfigurationService = new GuppyConfigurationService();
    $provide.value('GuppyConfigurationService', guppyConfigurationService);
  }));
  beforeEach(angular.mock.inject(function(_$componentController_) {
    $componentController = _$componentController_;
  }));
  beforeEach(() => {
    window.Guppy = MockGuppy;
    MathEditorCtrl = $componentController('mathEditor');
    spyOn(Guppy, 'remove_global_symbol');
  });

  it('should configure guppy if service is not initialized', () => {
    GuppyConfigurationService.serviceIsInitialized = false;
    guppyConfigurationService.init();
    expect(Guppy.remove_global_symbol).toHaveBeenCalled();
  });

  it('should not configure guppy if service is initialized', () => {
    GuppyConfigurationService.serviceIsInitialized = true;
    guppyConfigurationService.init();
    expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();
  });

  it(
    'should configure guppy only once if service is invoked multiple times',
    () => {
      // The serviceIsInitialized variable should be toggled to true on the
      // first init call and should remain true upon subsequent calls so that
      // the global configuration only happens once.
      expect(GuppyConfigurationService.serviceIsInitialized).toBeFalse();
      MathEditorCtrl.$onInit();
      expect(GuppyConfigurationService.serviceIsInitialized).toBeTrue();
      MathEditorCtrl.$onInit();
      expect(GuppyConfigurationService.serviceIsInitialized).toBeTrue();
    });
});
