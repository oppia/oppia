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
 * @fileoverview Service for computing the window dimensions.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HostListener, Injectable } from '@angular/core';
import { WindowRef } from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class WindowDimensionsService {
  constructor(private windowRef: WindowRef) {}
  onResizeHooks: Array<Function> = [];

  @HostListener('this.windowRef.nativeWindow:resize', ['$event'])
  onResize(event: Event): void {
    this.onResizeHooks.forEach(function(hookFn) {
      hookFn();
    });
  }

  getWidth(): number {
    return (this.windowRef.nativeWindow.innerWidth ||
        this.windowRef.nativeWindow.document.documentElement.clientWidth ||
        this.windowRef.nativeWindow.document.body.clientWidth);
  }

  registerOnResizeHook(hookFn: Function): void {
    this.onResizeHooks.push(hookFn);
  }

  isWindowNarrow(): boolean {
    let NORMAL_NAVBAR_CUTOFF_WIDTH_PX = 768;
    return this.getWidth() <= NORMAL_NAVBAR_CUTOFF_WIDTH_PX;
  }
}

angular.module('oppia').factory(
  'WindowDimensionsService',
  downgradeInjectable(WindowDimensionsService));
