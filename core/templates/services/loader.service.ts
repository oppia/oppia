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
 * @fileoverview A service to show loading screen.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  // TODO(#8472): Remove static when migration is complete.
  // Until then, we need to use static so that the two instances of the service
  // created by our hybrid app (one for Angular, the other for AngularJS) can
  // refer to the same objects.
  static loadingMessageChangedEventEmitter = new EventEmitter<string>();
  get onLoadingMessageChange(): EventEmitter<string> {
    // TODO(#9154): Change LoaderService to "this".
    return LoaderService.loadingMessageChangedEventEmitter;
  }

  constructor() {}

  showLoadingScreen(message: string): void {
    // TODO(#9154): Change LoaderService to "this".
    LoaderService.loadingMessageChangedEventEmitter.emit(message);
  }

  hideLoadingScreen(): void {
    // TODO(#9154): Change LoaderService to "this".
    LoaderService.loadingMessageChangedEventEmitter.emit('');
  }
}

angular.module('oppia').factory(
  'LoaderService',
  downgradeInjectable(LoaderService));
