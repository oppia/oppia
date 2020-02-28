// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service that manages admin data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AdminPageConstants } from
  'pages/admin-page/admin-page.constants';

@Injectable({
  providedIn: 'root'
})
export class AdminDataService {
  dataPromise: Promise<Object>;

  constructor(private http: HttpClient) {
    this.dataPromise = null;
  }

  _getDataAsync(): Promise<Object> {
    if (this.dataPromise) {
      return this.dataPromise;
    }

    this.dataPromise = this.http.get(
      AdminPageConstants.ADMIN_HANDLER_URL).toPromise();

    return this.dataPromise;
  }

  getDataAsync(): Promise<Object> {
    return this._getDataAsync();
  }
}

angular.module('oppia').factory(
  'AdminDataService',
  downgradeInjectable(AdminDataService));
