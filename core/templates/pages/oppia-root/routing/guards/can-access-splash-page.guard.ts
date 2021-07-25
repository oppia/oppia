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
 * @fileoverview Route guard for validating access to splash page.
 */

import { Injectable } from '@angular/core';
import { CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AccessValidationBackendApiService } from '../access-validation-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class CanAccessSplashPageGuard implements CanLoad {
  constructor(
    private accessValidationBackendApiService:
    AccessValidationBackendApiService,
    private router: Router,
    private windowRef: WindowRef
  ) {}

  canLoad(
      route: Route,
      segments: UrlSegment[]
  ): boolean | UrlTree | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree> {
    return this.accessValidationBackendApiService.validateAccessToSplashPage()
      .then(resp => {
        if (!resp.valid) {
          // Use router.navigate once both learner dashbaord page and
          // creator dashboard page are migrated to angular router.
          this.windowRef.nativeWindow.location.href = (
            '/' + resp.default_dashboard + '-dashboard');
          return false;
        }
        return true;
      }, err => {
        this.router.navigate(['/not-found']);
        return false;
      });
  }
}
