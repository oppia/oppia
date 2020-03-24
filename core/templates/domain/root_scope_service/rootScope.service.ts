// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service which provides rootScope to migrate services
 * This should not be used once all files are migrated.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class RootScopeService {
    private _rootScope;
    constructor() {
      const injector = angular.injector(['ng', 'oppia']);
      this._rootScope = injector.get('$rootScope');
    }

    broadcast(event, ...args) {
      this._rootScope.$broadcast(event, ...args);
    }

    emit(event, ...args) {
      this._rootScope.$emit(event, ...args);
    }

    on(event, listener) {
      this._rootScope.$on(event, listener);
    }
    watch(watchExpression, ...args) {
      this._rootScope.$watch(watchExpression, ...args);
    }
}
angular.module('oppia').factory(
  'RootScopeService',
  downgradeInjectable(RootScopeService));
