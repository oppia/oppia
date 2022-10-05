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
 * @fileoverview Backend api service for android email updates
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})

export class AndroidUpdatesBackendApiService {
  constructor(private http: HttpClient) {}

  private async _putRequestAsync(
      handlerUrl: string, payload: Object): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        handlerUrl, payload).toPromise()
        .then(response => {
          resolve(response);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async subscribeUserToAndroidList(
      email: string, name: string): Promise<void> {
    let payload = {
      email: email,
      name: name,
    };
    return this._putRequestAsync(
      '/subscribetoandroidlist', payload);
  }
}

angular.module('oppia').factory(
  'AndroidUpdatesBackendApiService',
  downgradeInjectable(AndroidUpdatesBackendApiService));
