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

describe('GuppyConfigurationService', () => {
  let guppyConfigurationService: GuppyConfigurationService = null;
  class MockGuppy {
    static 'remove_global_symbol'(symbol: string): void {}
  }

  beforeEach(() => {
    window.Guppy = MockGuppy;
    spyOn(Guppy, 'remove_global_symbol');
    guppyConfigurationService = TestBed.get(GuppyConfigurationService);
  });

  it('should configure guppy if service is not initialized', () => {
    guppyConfigurationService.init();
    expect(Guppy.remove_global_symbol).toHaveBeenCalled();
  });

  it('should not configure guppy if service is initialized', () => {
    GuppyConfigurationService.serviceIsInitialized = true;
    guppyConfigurationService.init();
    expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();
  });
});
