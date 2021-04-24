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
 * @fileoverview Service for showing issues notifications
 *  in the top-navigation-bar
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WindowRef } from './contextual/window-ref.service';

 @Injectable({
   providedIn: 'root'
 })
export class NavigationBackendApiService {
  constructor(
      private http: HttpClient,
      private windowRef: WindowRef,
  ) {}
  numUnseenNotifications: string | number;

  async showUnseenNotifications(): Promise<void> {
    return new Promise((reject) => {
      this.http.get('/notificationshandler').toPromise().then(
        (response: {
            // eslint-disable-next-line camelcase
            num_unseen_notifications: number}) => {
          if (this.windowRef.nativeWindow.location.pathname !== '/') {
            this.numUnseenNotifications =
               response.num_unseen_notifications;
            if (this.numUnseenNotifications > 0) {
              this.windowRef.nativeWindow.document.title = (
                '(' + this.numUnseenNotifications + ') ' +
                  this.windowRef.nativeWindow.document.title);
            }
          }
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }
}

angular.module('oppia').factory(
  'NavigationBackendApiService',
  downgradeInjectable(NavigationBackendApiService)
);
