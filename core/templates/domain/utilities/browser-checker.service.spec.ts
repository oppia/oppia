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
 * @fileoverview Unit tests for BrowserCheckerService.
 */

import { TestBed } from '@angular/core/testing';
import { BrowserCheckerService } from
  'domain/utilities/browser-checker.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Browser Checker Service', function() {
  let bcs, wrs;
  const mobileAgent = 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F' +
  ' Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko)' +
  ' Chrome/62.0.3202.84 Mobile Safari/537.36';
  const desktopAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
  ' AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.123' +
  ' Safari/537.36 OPR/66.0.3515.44';
  beforeEach(() => {
    bcs = TestBed.get(BrowserCheckerService);
    wrs = TestBed.get(WindowRef);
  });

  it('should evaluate when device is mobile checking navigator userAgent',
    () => {
      spyOnProperty(wrs.nativeWindow.navigator, 'userAgent').and
        .returnValue(mobileAgent);
      expect(!!bcs.isMobileDevice()).toBe(true);
    });

  it('should evaluate when device is desktop checking window opera', () => {
    // ref: https://github.com/jasmine/jasmine/issues/1415
    Object.defineProperty(wrs.nativeWindow, 'opera', {
      get: () => undefined
    });
    spyOnProperty(navigator, 'userAgent').and.returnValue(undefined);
    spyOnProperty(wrs.nativeWindow, 'opera').and.returnValue(desktopAgent);
    expect(!!bcs.isMobileDevice()).toBe(false);
  });

  it('should support speech synthesis when device is desktop', () => {
    spyOnProperty(wrs.nativeWindow, 'speechSynthesis').and.returnValue({
      getVoices: () => [{ lang: 'en-GB' }]
    });
    expect(bcs.supportsSpeechSynthesis()).toBe(true);
  });

  it('should support speech synthesis when device is mobile', () => {
    spyOnProperty(wrs.nativeWindow.navigator, 'userAgent').and
      .returnValue(mobileAgent);
    spyOnProperty(window, 'speechSynthesis').and.returnValue({
      getVoices: () => [{ lang: 'en_US' }]
    });
    expect(bcs.supportsSpeechSynthesis()).toBe(true);
  });

  it('should not support speech synthesis', () => {
    spyOn(wrs.nativeWindow, 'hasOwnProperty').withArgs('speechSynthesis').and
      .returnValue(false);
    expect(bcs.supportsSpeechSynthesis()).toBe(false);
  });
});
