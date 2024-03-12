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
 * if the user is not a blog admin.
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
import {UserService} from 'services/user.service';

@Injectable({
  providedIn: 'root',
})
export class BlogAdminAuthGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router,
    private location: Location
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const userInfo = await this.userService.getUserInfoAsync();
    if (userInfo.isBlogAdmin()) {
      return true;
    }

    this.router
      .navigate([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/401`,
      ])
      .then(() => {
        this.location.replaceState(state.url);
      });
    return false;
  }
}
