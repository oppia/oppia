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
 * @fileoverview Service to handle prevent reload events.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class PreventPageUnloadEventService {
  private listenerActive: boolean;
  validationCallback: undefined | (() => boolean);
  _preventPageUnloadEventHandlerBind?: (
    this: Window, ev: BeforeUnloadEvent) => void;

  constructor(private windowRef: WindowRef) {
    this.listenerActive = false;
    this.validationCallback = undefined;
  }

  addListener(callback?: () => boolean): void {
    if (this.listenerActive) {
      return;
    }
    // A value must be assigned to validationCallback since it cannot be an
    // optional argument. Check _preventPageUnloadEventHandler function.
    this.validationCallback = callback ? callback : () => true;
    this._preventPageUnloadEventHandlerBind =
      this._preventPageUnloadEventHandler.bind(null, this.validationCallback);
    this.windowRef.nativeWindow.addEventListener(
      'beforeunload', this._preventPageUnloadEventHandlerBind, true);
    this.listenerActive = true;
  }

  removeListener(): void {
    if (this._preventPageUnloadEventHandlerBind === undefined) {
      return;
    }
    this.windowRef.nativeWindow.removeEventListener(
      'beforeunload', this._preventPageUnloadEventHandlerBind, true);
    this.listenerActive = false;
  }

  private _preventPageUnloadEventHandler(
      validationCallback: () => boolean, e: BeforeUnloadEvent): void {
    if (validationCallback()) {
      // The preventDefault call is used to trigger a confirmation
      // before leaving.
      e.preventDefault();
      // According to the specification, to show the confirmation dialog an
      // event handler should call preventDefault() on the event. However note
      // that not all browsers support this method. So returnValue is also used.
      // The exact value in returnValue is not relevant, but it needs to be set
      // in order to trigger a confirmation before leaving.
      e.returnValue = '';
    }
  }

  isListenerActive(): boolean {
    return this.listenerActive;
  }

  ngOnDestroy(): void {
    this.removeListener();
  }
}

angular.module('oppia').factory(
  'PreventPageUnloadEventService',
  downgradeInjectable(PreventPageUnloadEventService));
