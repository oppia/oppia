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
 * player page for logged-out users and redirects to 404 when the page is
 * disabled.
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
import {PlatformFeatureService} from 'services/platform-feature.service';
import {UserService} from 'services/user.service';

@Injectable({
  providedIn: 'root',
})
export class CertificateAssessmentPlayerPageAuthGuard implements CanActivate {
  constructor(
    private platformFeatureService: PlatformFeatureService,
    private router: Router,
    private location: Location,
    private userService: UserService
  ) {}

  /**
   * Returns true if the EnableCertificateAssessment feature flag is
   * enabled and the user is logged in, allowing navigation to proceed
   * to the requested route.
   *
   * Returns false if the feature flag is disabled, the user is logged
   * out, or the user-info request fails. In this case the user is
   * redirected to the 404 page and the browser URL is replaced with
   * the originally requested state.url, so that navigation to the
   * blocked route does not appear in browser history.
   */
  async canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    if (
      !this.platformFeatureService.status.EnableCertificateAssessment.isEnabled
    ) {
      return this.redirectToNotFound(state.url);
    }

    try {
      const userInfo = await this.userService.getUserInfoAsync();
      if (!userInfo.isLoggedIn()) {
        return this.redirectToNotFound(state.url);
      }
    } catch {
      return this.redirectToNotFound(state.url);
    }

    return true;
  }

  private async redirectToNotFound(url: string): Promise<boolean> {
    try {
      await this.router.navigate([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
      ]);
      this.location.replaceState(url);
    } catch {
      this.location.replaceState(url);
    }
    return false;
  }
}
