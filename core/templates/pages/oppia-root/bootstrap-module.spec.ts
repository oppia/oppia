// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the bootstrap module selector.
 */

import {
  markAngularContentReady,
  shouldUseLiteAppModule,
} from './bootstrap-module';

describe('shouldUseLiteAppModule', () => {
  it('should select the lightweight module for the target pages', () => {
    expect(shouldUseLiteAppModule('/terms')).toBeTrue();
    expect(shouldUseLiteAppModule('/maintenance')).toBeTrue();
  });

  it('should tolerate trailing slashes', () => {
    expect(shouldUseLiteAppModule('/terms/')).toBeTrue();
    expect(shouldUseLiteAppModule('/maintenance///')).toBeTrue();
  });

  it('should select the full module for other paths', () => {
    expect(shouldUseLiteAppModule('/')).toBeFalse();
    expect(shouldUseLiteAppModule('/privacy-policy')).toBeFalse();
    expect(shouldUseLiteAppModule('/terms/extra')).toBeFalse();
  });
});

describe('markAngularContentReady', () => {
  afterEach(() => {
    document.documentElement.classList.remove('oppia-angular-ready');
    const shell = document.getElementById('oppia-prerender-shell');
    if (shell) {
      shell.remove();
    }
  });

  it('should reveal Angular content and hide the prerender shell', () => {
    const shell = document.createElement('div');
    shell.id = 'oppia-prerender-shell';
    document.body.appendChild(shell);

    markAngularContentReady();

    expect(
      document.documentElement.classList.contains('oppia-angular-ready')
    ).toBeTrue();
    expect(shell.style.visibility).toBe('hidden');
  });

  it('should tolerate a missing prerender shell', () => {
    expect(() => markAngularContentReady()).not.toThrowError();
  });
});
