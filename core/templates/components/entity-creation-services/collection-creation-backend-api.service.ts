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
 * @fileoverview Service to notify about creation of collection and obtain
 * collection_id.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CollectionCreationBackendService {
  constructor(private http: HttpClient) {}

  private _createCollection(
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    this.http.post('/collection_editor_handler/create_new', {}).toPromise()
      .then((response) => {
        if (successCallback) {
          successCallback(response);
        }
      }, () => {
        if (errorCallback) {
          errorCallback();
        }
      });
  }


  createCollection(): Promise<object> {
    return new Promise((resolve, reject) => {
      this._createCollection(resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'CollectionCreationBackendService',
  downgradeInjectable(CollectionCreationBackendService));
