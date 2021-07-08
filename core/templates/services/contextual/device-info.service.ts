// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to check if user is on a mobile device.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { WindowRef } from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
// See: https://stackoverflow.com/a/11381730
export class DeviceInfoService {
  constructor(private window: WindowRef) {}

  isMobileDevice(): boolean {
    return Boolean(
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i));
  }

  isMobileUserAgent(): boolean {
    return /Mobi/.test(navigator.userAgent);
  }

  hasTouchEvents(): boolean {
    return 'ontouchstart' in this.window.nativeWindow;
  }
}

angular.module('oppia').factory(
  'DeviceInfoService',
  downgradeInjectable(DeviceInfoService));
