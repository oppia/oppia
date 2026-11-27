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

import {
  KNOWN_CSS,
  LazyCssLoaderService,
} from 'services/lazy-css-loader.service';
import {GuppyInitializationService} from 'services/guppy-initialization.service';

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
  activate(): void {}
  deactivate(): void {}

  configure(name: string, val: Object): void {}
  static active_guppy: MockGuppy | null = null;
  static event(name: string, handler: Function): void {
    handler({focused: true});
  }

  static configure(name: string, val: Object): void {}
  static remove_global_symbol(symbol: string): void {}
  static add_global_symbol(name: string, symbol: Object): void {}
}

describe('GuppyInitializationService', () => {
  let guppyInitializationService: GuppyInitializationService;
  let lazyCssLoaderService: LazyCssLoaderService;

  beforeEach(() => {
    guppyInitializationService = TestBed.inject(GuppyInitializationService);
    lazyCssLoaderService = TestBed.inject(LazyCssLoaderService);
    window.Guppy = MockGuppy as unknown as Guppy;
  });

  it('should lazy load guppy css before creating guppy instances', () => {
    const loadCssSpy = spyOn(lazyCssLoaderService, 'loadCss');
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-creator', 'guppy_active');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);

    guppyInitializationService.init('guppy-div-creator', 'placeholder', 'x');

    expect(loadCssSpy).toHaveBeenCalledWith(KNOWN_CSS.GUPPY);
  });

  it('should assign a random id to the guppy divs', function () {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-creator', 'guppy_active');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);

    const guppySpy = spyOn(MockGuppy.prototype, 'configure');
    guppyInitializationService.init('guppy-div-creator', 'placeholder', 'x=y');

    expect(guppySpy).toHaveBeenCalledWith(
      'empty_content',
      '\\color{grey}{\\small \\text{placeholder}}'
    );

    let guppyDivs = document.querySelectorAll('.guppy-div-creator');
    for (let i = 0; i < guppyDivs.length; i++) {
      expect(guppyDivs[i].getAttribute('id')).toMatch(/guppy_[0-9]{1,8}/);
    }
  });

  it('should find active guppy div', function () {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-creator', 'guppy_active');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);

    guppyInitializationService.init('guppy-div-creator', 'placeholder', 'x');

    expect(guppyInitializationService.findActiveGuppyObject()).not.toBe(
      undefined
    );
  });

  it('should correctly change and get the value of showOSK var', function () {
    guppyInitializationService.setShowOSK(true);
    expect(guppyInitializationService.getShowOSK()).toBe(true);
    guppyInitializationService.setShowOSK(false);
    expect(guppyInitializationService.getShowOSK()).toBe(false);
  });

  it('should activate the most recent guppy instance', function () {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-creator', 'guppy_active');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);

    guppyInitializationService.init('guppy-div-creator', 'placeholder', 'x');

    const activateSpy = spyOn(MockGuppy.prototype, 'activate');
    guppyInitializationService.activate();

    expect(activateSpy).toHaveBeenCalled();
  });

  it('should keep the guppy divs in the normal tab order', () => {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-tab-order');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);

    guppyInitializationService.init('guppy-div-tab-order', 'placeholder');

    const guppyDiv = document.querySelector(
      '.guppy-div-tab-order'
    ) as HTMLElement;
    expect(guppyDiv.tabIndex).toBe(0);
  });

  it('should deactivate the active guppy div when tab is pressed', () => {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-tab-out');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);
    guppyInitializationService.init('guppy-div-tab-out', 'placeholder');
    MockGuppy.active_guppy = new MockGuppy('guppy-div-tab-out', {});
    const deactivateSpy = spyOn(MockGuppy.prototype, 'deactivate');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Tab', bubbles: true})
    );

    expect(deactivateSpy).toHaveBeenCalled();
    expect(MockGuppy.active_guppy).toBeNull();
  });

  it('should not deactivate the active guppy div for other keys', () => {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-other-key');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);
    guppyInitializationService.init('guppy-div-other-key', 'placeholder');
    MockGuppy.active_guppy = new MockGuppy('guppy-div-other-key', {});
    const deactivateSpy = spyOn(MockGuppy.prototype, 'deactivate');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'x', bubbles: true})
    );

    expect(deactivateSpy).not.toHaveBeenCalled();
    expect(MockGuppy.active_guppy).not.toBeNull();
  });

  it('should do nothing when tab is pressed and no guppy div is active', () => {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-none-active');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);
    guppyInitializationService.init('guppy-div-none-active', 'placeholder');
    MockGuppy.active_guppy = null;
    const deactivateSpy = spyOn(MockGuppy.prototype, 'deactivate');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Tab', bubbles: true})
    );

    expect(deactivateSpy).not.toHaveBeenCalled();
  });

  it('should activate the guppy div when it receives focus', () => {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-focus');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);
    guppyInitializationService.init('guppy-div-focus', 'placeholder');
    const guppyDiv = document.querySelector('.guppy-div-focus') as HTMLElement;
    MockGuppy.active_guppy = null;
    const activateSpy = spyOn(MockGuppy.prototype, 'activate');

    guppyDiv.dispatchEvent(new FocusEvent('focus'));

    expect(activateSpy).toHaveBeenCalled();
  });

  it('should not activate the guppy div again if it is already active', () => {
    let mockDocument = document.createElement('div');
    mockDocument.classList.add('guppy-div-already-active');
    document.body.insertAdjacentHTML('beforeend', mockDocument.outerHTML);
    guppyInitializationService.init('guppy-div-already-active', 'placeholder');
    const guppyDiv = document.querySelector(
      '.guppy-div-already-active'
    ) as HTMLElement;
    MockGuppy.active_guppy = null;
    const activateSpy = spyOn(MockGuppy.prototype, 'activate').and.callFake(
      function (this: MockGuppy) {
        MockGuppy.active_guppy = this;
      }
    );

    guppyDiv.dispatchEvent(new FocusEvent('focus'));
    guppyDiv.dispatchEvent(new FocusEvent('focus'));

    expect(activateSpy).toHaveBeenCalledTimes(1);
  });

  it('should do nothing when activate is called with no guppy instances', function () {
    expect(() => {
      guppyInitializationService.activate();
    }).not.toThrowError();
  });
});
