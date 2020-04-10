// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service to mimic the functionality of $rootScope.
 */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonEventsService {
  // TODO(srijanreddy98): Remove the _rootScope once the project is migrated.
  private _rootScope;
  private _loadingMessage = new Subject<string>();
  constructor() {
    /**
     * TODO(srijanreddy98): Remove the _rootScope and injector once the project
     * is migrated.
     */
    const injector = angular.element(
      document.getElementsByTagName('html')[0]).injector();
    this._rootScope = injector.get('$rootScope');
  }

  getEvent(eventName: string): Subject<any> | null {
    if (this[eventName] !== undefined) {
      return this[eventName];
    }
    return null;
  }

  getLoadingMessageSubject(): Subject<string> {
    return this._loadingMessage;
  }

  emitEvent(eventName, ...args): void {
    this[eventName].emit(...args);
    this._rootScope.$broadcast(eventName, ...args);
  }

  setLoadingMessage(value: string): void {
    this._rootScope.$broadcast('loadingMessageChange', value);
    this._loadingMessage.next(value);
  }
}
