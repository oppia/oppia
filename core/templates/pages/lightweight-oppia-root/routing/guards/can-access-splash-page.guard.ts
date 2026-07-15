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

import {Injectable} from '@angular/core';
import {CanLoad, Route, UrlSegment} from '@angular/router';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';

@Injectable({
  providedIn: 'root',
})
export class CanAccessSplashPageGuard implements CanLoad {
  constructor(
    private userService: UserService,
    private windowRef: WindowRef
  ) {}

  canLoad(route: Route, segments: UrlSegment[]): Promise<boolean> {
    return this.userService.getUserInfoAsync().then(
      userInfo => {
        if (userInfo.isLoggedIn()) {
          this.userService
            .getUserPreferredDashboardAsync()
            .then(preferredDashboard => {
              // Use router.navigate once both learner dashbaord page and
              // creator dashboard page are migrated to angular router.
              this.windowRef.nativeWindow.location.href =
                '/' + preferredDashboard + '-dashboard';
            });
          return false;
        } else {
          return true;
        }
      },
      () => {
        return true;
      }
    );
  }
}
