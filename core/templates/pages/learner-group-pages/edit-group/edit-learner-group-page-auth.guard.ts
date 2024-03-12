// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Guard that redirects user to 401 error page
 * if the user is not a valid facilitator.
 */

import {Location} from '@angular/common';
import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import {AppConstants} from 'app.constants';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';

@Injectable({
  providedIn: 'root',
})
export class EditLearnerGroupPageAuthGuard implements CanActivate {
  constructor(
    private accessValidationBackendApiService: AccessValidationBackendApiService,
    private router: Router,
    private location: Location
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    let learnerGroupId = route.paramMap.get('learner_group_id') || '';

    return new Promise<boolean>(resolve => {
      this.accessValidationBackendApiService
        .validateAccessToLearnerGroupEditorPage(learnerGroupId)
        .then(() => {
          resolve(true);
        })
        .catch(err => {
          this.router
            .navigate([
              `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/401`,
            ])
            .then(() => {
              this.location.replaceState(state.url);
              resolve(false);
            });
        });
    });
  }
}
