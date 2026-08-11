// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Guard that blocks access to the certificate assessment
 * learner page for logged-out users and redirects to 404 when the page is
 * disabled or the classroom does not exist.
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
import {PlatformFeatureService} from 'services/platform-feature.service';
import {UserService} from 'services/user.service';

@Injectable({
  providedIn: 'root',
})
export class CertificateOfferingAvailablePageAuthGuard implements CanActivate {
  constructor(
    private accessValidationBackendApiService: AccessValidationBackendApiService,
    private platformFeatureService: PlatformFeatureService,
    private router: Router,
    private location: Location,
    private userService: UserService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    if (
      !this.platformFeatureService.status.EnableCertificateAssessment.isEnabled
    ) {
      return this.redirectToNotFound(state.url);
    }

    const userInfo = await this.userService.getUserInfoAsync();
    if (!userInfo.isLoggedIn()) {
      return this.redirectToHome(state.url);
    }

    const classroomUrlFragment =
      route.paramMap.get('classroomUrlFragment') || '';
    try {
      await this.accessValidationBackendApiService.validateAccessToClassroomPage(
        classroomUrlFragment
      );
      return true;
    } catch {
      return this.redirectToNotFound(state.url);
    }
  }

  private async redirectToNotFound(url: string): Promise<boolean> {
    return this.navigateToRoute(
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
      url
    );
  }

  private async redirectToHome(url: string): Promise<boolean> {
    return this.navigateToRoute('/', url);
  }

  private async navigateToRoute(route: string, url: string): Promise<boolean> {
    try {
      await this.router.navigate([route]);
      this.location.replaceState(url);
    } catch {
      this.location.replaceState(url);
    }
    return false;
  }
}
