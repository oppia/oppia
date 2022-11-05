// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend api service for android email updates.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface AndroidListReturnStatusData {
  status: boolean;
}

export interface AndroidListPayload {
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AndroidUpdatesBackendApiService {
  constructor(private http: HttpClient) {}

  private async _putRequestAsync(
      handlerUrl: string, payload: AndroidListPayload
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http.put<AndroidListReturnStatusData>(
        handlerUrl, payload).toPromise()
        .then(response => {
          resolve(response.status);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async subscribeUserToAndroidList(
      email: string, name: string
  ): Promise<boolean> {
    let payload = {
      email: email,
      name: name,
    };
    return this._putRequestAsync(
      '/androidlistsubscriptionhandler', payload);
  }
}

angular.module('oppia').factory(
  'AndroidUpdatesBackendApiService',
  downgradeInjectable(AndroidUpdatesBackendApiService));
