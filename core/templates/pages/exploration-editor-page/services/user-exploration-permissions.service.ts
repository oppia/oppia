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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ContextService } from 'services/context.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class UserExplorationPermissionsService {
  constructor(
    private contextService: ContextService,
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  static permissionsPromise: Promise<object> = null;
  getPermissionsAsync(): Promise<object> {
    if (!UserExplorationPermissionsService.permissionsPromise) {
      let explorationPermissionsUrl = this.urlInterpolationService
        .interpolateUrl( '/createhandler/permissions/<exploration_id>', {
          exploration_id: this.contextService.getExplorationId()
        });

      UserExplorationPermissionsService.permissionsPromise = (
        this.http.get(explorationPermissionsUrl).toPromise().then(
          (response) => {
            return response;
          }
        ));
    }
    return UserExplorationPermissionsService.permissionsPromise;
  }
}
angular.module('oppia').factory('UserExplorationPermissionsService',
  downgradeInjectable(UserExplorationPermissionsService));
