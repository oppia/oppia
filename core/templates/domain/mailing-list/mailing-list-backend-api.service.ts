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

export interface MailingListReturnStatusData {
  status: boolean;
}

export interface MailingListPayload {
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class MailingListBackendApiService {
  constructor(private http: HttpClient) {}

  private async _putRequestAsync(
      handlerUrl: string, payload: MailingListPayload
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http.put<MailingListReturnStatusData>(
        handlerUrl, payload).toPromise()
        .then(response => {
          resolve(response.status);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async subscribeUserToMailingList(
      email: string, name: string, tag: string
  ): Promise<boolean> {
    let payload = {
      email: email,
      name: name,
      tag: tag
    };
    return this._putRequestAsync(
      '/mailinglistsubscriptionhandler', payload);
  }
}

angular.module('oppia').factory(
  'MailingListBackendApiService',
  downgradeInjectable(MailingListBackendApiService));
