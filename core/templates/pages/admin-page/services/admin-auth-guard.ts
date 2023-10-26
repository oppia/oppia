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

import { Injectable } from '@angular/core';
import { UserService } from 'services/user.service';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserInfo } from 'domain/user/user-info.model';
import { AdminPageRootComponent } from '../admin-page-root.component';
import { Error404PageComponent } from 'pages/error-pages/error-404/error-404-page.component';

@Injectable({
  providedIn: 'root'
})
export class AdminPermissionResolver implements Resolve<any> {
  constructor(private userService: UserService, private router: Router) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
   Promise<UserInfo> {
    return this.userService.getUserInfoAsync().then((userInfo) => {
      if (userInfo.isSuperAdmin()) {
                route.routeConfig!.component = AdminPageRootComponent;
      } else {
                route.routeConfig!.component = Error404PageComponent;
      }
      return userInfo;
    });
  }
}
