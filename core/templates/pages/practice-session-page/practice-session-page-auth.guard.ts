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
 * @fileoverview Auth Guard for the practice session page.
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
export class PracticeSessionAccessGuard implements CanActivate {
  constructor(
    private accessValidationBackendApiService: AccessValidationBackendApiService,
    private router: Router,
    private location: Location
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const selectedSubtopicIds = route.queryParams.selected_subtopic_ids || '';
    const classroomUrlFragment =
      route.paramMap.get('classroom_url_fragment') || '';
    const topicUrlFragment = route.paramMap.get('topic_url_fragment') || '';
    return new Promise<boolean>(resolve => {
      this.accessValidationBackendApiService
        .validateAccessToPracticeSessionPage(
          classroomUrlFragment,
          topicUrlFragment,
          selectedSubtopicIds
        )
        .then(() => {
          resolve(true);
        })
        .catch(err => {
          this.router
            .navigate([
              `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/${err.status}`,
            ])
            .then(() => {
              this.location.replaceState(state.url);
              resolve(false);
            });
        });
    });
  }
}
