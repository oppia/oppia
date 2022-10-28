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
import { Injectable } from '@angular/core';

import {
  AdminPageData,
  AdminBackendApiService,
} from 'domain/admin/admin-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminDataService {
  // This property is initialized using private methods
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  dataPromise!: Promise<AdminPageData>;

  constructor(
    private adminBackendApiService: AdminBackendApiService
  ) {}

  async _getDataAsync(): Promise<AdminPageData> {
    if (this.dataPromise) {
      return this.dataPromise;
    }

    this.dataPromise = this.adminBackendApiService.getDataAsync();

    return this.dataPromise;
  }

  async getDataAsync(): Promise<AdminPageData> {
    return this._getDataAsync();
  }
}

angular.module('oppia').factory(
  'AdminDataService',
  downgradeInjectable(AdminDataService));
