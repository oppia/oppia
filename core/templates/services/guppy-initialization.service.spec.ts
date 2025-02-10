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
 * @fileoverview Unit test for GuppyInitializationService
 */

import {TestBed} from '@angular/core/testing';

import {GuppyInitializationService} from 'services/guppy-initialization.service';

declare global {
  interface Window {
    Guppy: Guppy;
  }
}

class MockGuppy {
  constructor(id: string, config: Object) {}

  engine = {
    end: () => {},
  };

  render(): void {}
  import_text(): void {}
  asciimath(): string {
    return 'Dummy value';
  }

  configure(name: string, val: Object): void {}
  static event(name: string, handler: Function): void {
    handler({focused: true});
  }

  static configure(name: string, val: Object): void {}
  static remove_global_symbol(symbol: string): void {}
  static add_global_symbol(name: string, symbol: Object): void {}
}

describe('GuppyInitializationService', () => {
  let guppyInitializationService: GuppyInitializationService;

  beforeEach(() => {
    guppyInitializationService = TestBed.inject(GuppyInitializationService);
    window.Guppy = MockGuppy as unknown as Guppy;
  });

  it('should assign a random id to the guppy divs', function () {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-creator', 'guppy_active');
    angular.element(document).find('body').append(mockDocument.outerHTML);

    guppyInitializationService.init('guppy-div-creator', 'placeholder', 'x=y');

    let guppyDivs = document.querySelectorAll('.guppy-div-creator');
    for (let i = 0; i < guppyDivs.length; i++) {
      expect(guppyDivs[i].getAttribute('id')).toMatch(/guppy_[0-9]{1,8}/);
    }
  });

  it('should find active guppy div', function () {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-creator', 'guppy_active');
    angular.element(document).find('body').append(mockDocument.outerHTML);

    guppyInitializationService.init('guppy-div-creator', 'placeholder', 'x');

    expect(guppyInitializationService.findActiveGuppyObject()).not.toBe(
      undefined
    );
  });

  it('should correctly change and get the value of showOSK var', function () {
    guppyInitializationService.setShowOSK(true);
    expect(guppyInitializationService.getShowOSK()).toBeTrue();
    guppyInitializationService.setShowOSK(false);
    expect(guppyInitializationService.getShowOSK()).toBeFalse();
  });
});
