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

import {TestBed} from '@angular/core/testing';
import {BrowserCheckerService} from 'domain/utilities/browser-checker.service';
import {WindowRef} from 'services/contextual/window-ref.service';

describe('Browser Checker Service', function () {
  let bcs: BrowserCheckerService, wrs: WindowRef;

  let mockUserAgent: (ua: string) => void;

  const mobileAgent =
    'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F' +
    ' Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko)' +
    ' Chrome/62.0.3202.84 Mobile Safari/537.36';
  beforeEach(() => {
    bcs = TestBed.get(BrowserCheckerService);
    wrs = TestBed.get(WindowRef);

    let userAgent: string;
    spyOnProperty(wrs.nativeWindow.navigator, 'userAgent').and.callFake(
      () => userAgent
    );
    mockUserAgent = ua => (userAgent = ua);
  });

  it('should evaluate when device is mobile checking navigator userAgent', () => {
    mockUserAgent(mobileAgent);
    expect(!!bcs.isMobileDevice()).toBe(true);
  });

  it('should support speech synthesis when device is desktop', () => {
    spyOnProperty(wrs.nativeWindow, 'speechSynthesis').and.returnValue({
      getVoices: () => [{lang: 'en-US'}],
    } as SpeechSynthesis);
    expect(bcs.supportsSpeechSynthesis()).toBe(true);
  });

  it('should support speech synthesis when device is mobile', () => {
    mockUserAgent(mobileAgent);
    spyOnProperty(window, 'speechSynthesis').and.returnValue({
      getVoices: () => [{lang: 'en_US'}],
    } as SpeechSynthesis);
    expect(bcs.supportsSpeechSynthesis()).toBe(true);
  });

  it('should not support speech synthesis', () => {
    spyOn(wrs.nativeWindow as Object, 'hasOwnProperty')
      .withArgs('speechSynthesis')
      .and.returnValue(false);
    expect(bcs.supportsSpeechSynthesis()).toBe(false);
  });

  describe('.detectBrowserType', () => {
    it('should correctly detect Edge browser.', () => {
      mockUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246'
      );

      expect(bcs.detectBrowserType()).toEqual('Edge');
    });

    it('should correctly detect Chrome browser.', () => {
      mockUserAgent(
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, ' +
          'like Gecko) Chrome/47.0.2526.111 Safari/537.36'
      );

      expect(bcs.detectBrowserType()).toEqual('Chrome');
    });

    it('should correctly detect Firefox browser.', () => {
      mockUserAgent(
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101' +
          ' Firefox/15.0.1'
      );

      expect(bcs.detectBrowserType()).toEqual('Firefox');
    });

    it('should correctly detect Safari browser.', () => {
      mockUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/' +
          '601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9'
      );

      expect(bcs.detectBrowserType()).toEqual('Safari');
    });

    it("should return 'Others' if no other browser type is detected.", () => {
      mockUserAgent('unknown-user-agent-value');

      expect(bcs.detectBrowserType()).toEqual('Others');
    });
  });
});
