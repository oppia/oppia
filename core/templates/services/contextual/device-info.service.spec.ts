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
 * @fileoverview Unit tests for DeviceInfoService.
 */

import {TestBed} from '@angular/core/testing';

import {DeviceInfoService} from 'services/contextual/device-info.service';
import {WindowRef} from 'services/contextual/window-ref.service';

describe('Device Info Service', () => {
  let dis: DeviceInfoService;
  let wrs: WindowRef;
  const mobileUserAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like ' +
    'Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 ' +
    'Mobile/15A372 Safari/604.1';
  const desktopUserAgent =
    'Mozilla/5.0 (Windows NT 6.1; WOW64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 ' +
    'Safari/537.36';

  beforeEach(() => {
    dis = TestBed.get(DeviceInfoService);
    wrs = TestBed.get(WindowRef);
  });

  it('should evaluate when a device is a mobile device', () => {
    spyOnProperty(wrs.nativeWindow, 'navigator').and.callFake(
      () =>
        ({
          userAgent: mobileUserAgent,
        }) as Navigator
    );

    expect(dis.isMobileDevice()).toBe(true);
    expect(dis.isMobileUserAgent()).toBe(true);
  });

  it('should evaluate when a device is not a mobile device', () => {
    spyOnProperty(wrs.nativeWindow, 'navigator').and.callFake(
      () =>
        ({
          userAgent: desktopUserAgent,
        }) as Navigator
    );

    expect(dis.isMobileDevice()).toBe(false);
    expect(dis.isMobileUserAgent()).toBe(false);
  });

  it('should not have touch events on desktop device', () => {
    expect(dis.hasTouchEvents()).toBe(false);
  });

  it('should have touch events on mobile device', () => {
    wrs.nativeWindow.ontouchstart = () => {};
    expect(dis.hasTouchEvents()).toBe(true);
    delete wrs.nativeWindow.ontouchstart;
  });
});
