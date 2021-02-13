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
 * @fileoverview A service that fetches and stores the permissions
 * of a user for a particular exploration.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ExplorationPermissionsBackendApiService } from
  'domain/exploration/exploration-permissions-backend-api.service';
import { ExplorationPermissions } from
  'domain/exploration/exploration-permissions.model';

@Injectable({
  providedIn: 'root'
})
export class UserExplorationPermissionsService {
  constructor(
    private explorationPermissionsBackendApiService:
    ExplorationPermissionsBackendApiService) {}

  static permissionsPromise: Promise<ExplorationPermissions> = null;

  async getPermissionsAsync(): Promise<ExplorationPermissions> {
    if (!UserExplorationPermissionsService.permissionsPromise) {
      UserExplorationPermissionsService.permissionsPromise = (
        this.explorationPermissionsBackendApiService.getPermissionsAsync());
    }
    return UserExplorationPermissionsService.permissionsPromise;
  }
}

angular.module('oppia').factory('UserExplorationPermissionsService',
  downgradeInjectable(UserExplorationPermissionsService));
