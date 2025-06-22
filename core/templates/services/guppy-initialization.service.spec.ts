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
    Guppy: typeof MockGuppy;
  }
}

class MockGuppy {
  engine = {
    end: () => {},
  };
  constructor(id: string, config: object) {}

  render(): void {}
  import_text(): void {}
  asciimath(): string {
    return 'Dummy value';
  }

  configure(name: string, val: object): void {}

  static event(name: string, handler: Function): void {
    handler({focused: true});
  }

  static configure(name: string, val: object): void {}
  static remove_global_symbol(symbol: string): void {}
  static add_global_symbol(name: string, symbol: object): void {}
}

describe('GuppyInitializationService', () => {
  let guppyInitializationService: GuppyInitializationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guppyInitializationService = TestBed.inject(GuppyInitializationService);
    window.Guppy = MockGuppy;
  });

  it('should assign a random id to the guppy divs', () => {
    const mockDiv = document.createElement('div');
    mockDiv.classList.add('guppy-div-creator', 'guppy_active');
    document.body.appendChild(mockDiv);

    guppyInitializationService.init('guppy-div-creator', 'placeholder', 'x=y');

    const guppyDivs = document.querySelectorAll('.guppy-div-creator');
    guppyDivs.forEach(div => {
      const id = div.getAttribute('id');
      expect(id).toMatch(/guppy_[0-9]{1,8}/);
    });

    document.body.removeChild(mockDiv);
  });

  it('should find active guppy div', () => {
    const mockDiv = document.createElement('div');
    mockDiv.classList.add('guppy-div-creator', 'guppy_active');
    document.body.appendChild(mockDiv);

    guppyInitializationService.init('guppy-div-creator', 'placeholder', 'x');

    expect(
      guppyInitializationService.findActiveGuppyObject()
    ).not.toBeUndefined();

    document.body.removeChild(mockDiv);
  });

  it('should correctly change and get the value of showOSK var', () => {
    guppyInitializationService.setShowOSK(true);
    expect(guppyInitializationService.getShowOSK()).toBeTrue();
    guppyInitializationService.setShowOSK(false);
    expect(guppyInitializationService.getShowOSK()).toBeFalse();
  });
});
