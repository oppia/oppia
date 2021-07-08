// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for manipulating getting and putting the cookies.
 */

/**
 * NOTE: In general, we don't prefix our services with the 'oppia' prefix. This
 * is an exception as the class name without oppia would collide with the
 * existing class of CookieService from 'ngx-cookie'.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { CookieOptions, CookieService } from 'ngx-cookie';

@Injectable({
  providedIn: 'root'
})
export class OppiaCookieService {
  constructor(private ngxCookieService: CookieService) { }

  getCookie(key: string): string | null {
    if (!this.ngxCookieService.hasKey(key)) {
      return null;
    }
    return this.ngxCookieService.get(key);
  }

  putCookie(key: string, value: string, options?: CookieOptions): void {
    this.ngxCookieService.put(key, value, options);
  }
}

angular.module('oppia').factory('OppiaCookieService', downgradeInjectable(
  OppiaCookieService
));
