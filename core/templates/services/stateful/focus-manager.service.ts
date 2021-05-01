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
 * @fileoverview Service for setting focus. This broadcasts a 'focusOn' event
 *     which sets focus to the element in the page with the corresponding
 *     focusOn attribute. This requires LABEL_FOR_CLEARING_FOCUS to exist
 *     somewhere in the HTML page.
 */

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { IdGenerationService } from 'services/id-generation.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { WindowRef } from 'services/contextual/window-ref.service';
@Injectable({
  providedIn: 'root'
})
export class FocusManagerService {
  private nextLabelToFocusOn: string = null;
  private focusEventEmitter: EventEmitter<string> = new EventEmitter();

  constructor(
      private deviceInfoService: DeviceInfoService,
      private idGenerationService: IdGenerationService,
      private windowRef: WindowRef = new WindowRef(),
  ) {}
  clearFocus(): void {
    this.setFocus(AppConstants.LABEL_FOR_CLEARING_FOCUS);
  }

  setFocus(name: string): void {
    if (this.nextLabelToFocusOn === null) {
      this.nextLabelToFocusOn = name;
      setTimeout(() => {
        this.focusEventEmitter.emit(this.nextLabelToFocusOn);
        this.nextLabelToFocusOn = null;
      });
    }
  }

  setFocusIfOnDesktop(newFocusLabel: string): void {
    if (!this.deviceInfoService.isMobileDevice()) {
      this.setFocus(newFocusLabel);
    }
  }

  generateFocusLabel(): string {
    return this.idGenerationService.generateNewId();
  }

  setFocusWithoutScroll(name: string): void {
    this.setFocus(name);
    setTimeout(() => {
      this.windowRef.nativeWindow.scrollTo(0, 0);
    }, 5);
  }

  get onFocus(): EventEmitter<string> {
    return this.focusEventEmitter;
  }
}

angular.module('oppia').factory(
  'FocusManagerService', downgradeInjectable(FocusManagerService));
