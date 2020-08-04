// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Oppia interaction from outer iframe with messaging commands.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {WindowRef} from 'services/contextual/window-ref.service.ts';
require('pages/exploration-player-page/services/exploration-engine.service.ts');

@Injectable({providedIn: 'root'})
export class WindowWrapperMessageService {
  constructor(private windowRef: WindowRef) {
    this.windowRef = windowRef;
  }

  addEventListener(type, func) {
    this.windowRef.nativeWindow.addEventListener(type, func);
  }

  postMessageToParent(message, hostname) {
    this.windowRef.nativeWindow.parent.postMessage(message, hostname);
  }
}

angular.module('oppia').factory(
  'WindowWrapperMessageService',
  downgradeInjectable(WindowWrapperMessageService));
