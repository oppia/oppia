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
 * @fileoverview Backend api service for user exploration permissions.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ContextService } from 'services/context.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import {
  ExplorationPermissionsBackendDict,
  ExplorationPermissions,
} from 'domain/exploration/exploration-permissions.model';

@Injectable({
  providedIn: 'root'
})
export class ExplorationPermissionsBackendApiService {
  constructor(
    private contextService: ContextService,
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  async getPermissionsAsync(): Promise<ExplorationPermissions> {
    let explorationPermissionsUrl = this.urlInterpolationService
      .interpolateUrl('/createhandler/permissions/<exploration_id>', {
        exploration_id: this.contextService.getExplorationId()
      });

    return new Promise((resolve, reject) => {
      this.http.get<ExplorationPermissionsBackendDict>(
        explorationPermissionsUrl).toPromise().then(response => {
        let permissionsObject = (
          ExplorationPermissions.createFromBackendDict(
            response));
        resolve(permissionsObject);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'ExplorationPermissionsBackendApiService',
  downgradeInjectable(ExplorationPermissionsBackendApiService));
