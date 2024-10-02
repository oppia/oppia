// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * if the user is not allowed to access Exploration Editor.
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
import {ContextService} from 'services/context.service';

@Injectable({
  providedIn: 'root',
})
export class ExplorationEditorPageAuthGuard implements CanActivate {
  constructor(
    private accessValidationBackendApiService: AccessValidationBackendApiService,
    private router: Router,
    private location: Location,
    private contextService: ContextService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      let explorationId = this.contextService.getExplorationId();
      this.accessValidationBackendApiService
        .validateAccessToExplorationEditorPage(explorationId)
        .then(() => {
          resolve(true);
        })
        .catch(err => {
          const statusCode = err ? err.status : 401;
          this.router
            .navigate([
              `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/${statusCode}`,
            ])
            .then(() => {
              this.location.replaceState(state.url);
              resolve(false);
            });
        });
    });
  }
}
