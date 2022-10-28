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
 * @fileoverview Service for debouncing function calls.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { WindowRef } from './contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class DebouncerService {
  // Returns a function that will not be triggered as long as it continues to
  // be invoked. The function only gets executed after it stops being called
  // for `wait` milliseconds.
  debounce(func: () => void, millisecsToWait: number): () => void {
    let timeout: number;
    let context: this | null = this;
    let timestamp: number;
    let result: void;
    let windowRef: WindowRef = new WindowRef();

    const later = () => {
      let last = new Date().getTime() - timestamp;
      if (last < millisecsToWait) {
        timeout = windowRef.nativeWindow.setTimeout(
          later, millisecsToWait - last);
      } else {
        timeout = 0;
        result = func.apply(context);
        if (!timeout) {
          context = null;
        }
      }
    };

    return function() {
      timestamp = new Date().getTime();
      if (!timeout) {
        timeout = window.setTimeout(later, millisecsToWait);
      }
      return result;
    };
  }
}

angular.module('oppia').factory(
  'DebouncerService', downgradeInjectable(DebouncerService));
