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
import { ServicesConstants } from 'services/services.constants';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ContextService } from 'services/context.service';
@Injectable({
  providedIn: 'root'
})
export class FocusManagerService {
  // This property can be undefined but not null because we need to emit it.
  private nextLabelToFocusOn: string | undefined;
  private focusEventEmitter: EventEmitter<string> = new EventEmitter();

  constructor(
      private deviceInfoService: DeviceInfoService,
      private idGenerationService: IdGenerationService,
      private windowRef: WindowRef = new WindowRef(),
      private contextService: ContextService,
  ) {}

  clearFocus(): void {
    this.setFocus(AppConstants.LABEL_FOR_CLEARING_FOCUS);
  }

  setFocus(name: string): void {
    if (this.nextLabelToFocusOn === undefined) {
      this.nextLabelToFocusOn = name;
      setTimeout(() => {
        this.focusEventEmitter.emit(this.nextLabelToFocusOn);
        this.nextLabelToFocusOn = undefined;
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
    // We need to scroll to the top of the page to ensure that the autofocus in
    // long explorations and questions does not scroll the page down without the
    // learner going through the exploration or question. We do not want to do
    // this for the editor pages because the user may be in the middle of the
    // page and we do not want to scroll them to the top. Therefore, we check
    // for the page context to be exploration or question player before
    // scrolling to top.
    if (
      this.contextService.getPageContext() === (
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER ||
        ServicesConstants.PAGE_CONTEXT.QUESTION_PLAYER
      )
    ) {
      setTimeout(() => {
        this.windowRef.nativeWindow.scrollTo(0, 0);
      }, 5);
    }
  }

  get onFocus(): EventEmitter<string> {
    return this.focusEventEmitter;
  }
}

angular.module('oppia').factory(
  'FocusManagerService', downgradeInjectable(FocusManagerService));
