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
 * @fileoverview Service to revert/change admin-config-tab properties
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminPageConstants } from 'pages/admin-page/admin-page.constants';

 @Injectable({
   providedIn: 'root'
 })
export class AdminConfigTabBackendApiService {
  constructor(private http: HttpClient) {}

  private _revertConfigProperty(configPropertyId: string):Promise<void> {
    return this.http.post<void>(
      AdminPageConstants.ADMIN_HANDLER_URL,
      {
        action: 'revert_config_property',
        config_property_id: configPropertyId
      }
    ).toPromise();
  }

  private _saveConfigProperties(
      newConfigPropertyValues: object): Promise<void> {
    return this.http.post<void>(
      AdminPageConstants.ADMIN_HANDLER_URL,
      {
        action: 'save_config_properties',
        new_config_property_values: newConfigPropertyValues
      }
    ).toPromise();
  }

  revertConfigProperty(configPropertyId: string): Promise<void> {
    return this._revertConfigProperty(configPropertyId);
  }

  saveConfigProperties(newConfigPropertyValues: object): Promise<void> {
    return this._saveConfigProperties(newConfigPropertyValues);
  }
}

angular.module('oppia').factory(
  'AdminConfigTabBackendApiService', downgradeInjectable(
    AdminConfigTabBackendApiService));
