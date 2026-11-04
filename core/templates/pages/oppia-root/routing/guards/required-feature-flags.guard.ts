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
 * @fileoverview Guard that blocks navigation to a route whose
 * data.requiredFeatureFlags lists a feature flag that is currently disabled.
 *
 * Making this guard consume data.requiredFeatureFlags means the declaration is
 * enforced at runtime, not just read by the CI script, so the feature flags a
 * route requires can never silently drift from the feature flags the app
 * actually gates it on.
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
import {
  FeatureNames,
  FeatureNamesKeys,
  FeatureStatusChecker,
} from 'domain/feature-flag/feature-status-summary.model';
import {PlatformFeatureService} from 'services/platform-feature.service';

// The route data stores the snake_case FeatureNames values, whereas
// PlatformFeatureService.status is keyed by the PascalCase enum member names.
const FEATURE_NAME_TO_STATUS_KEY = new Map<
  FeatureNames,
  keyof FeatureStatusChecker
>();
(Object.keys(FeatureNames) as FeatureNamesKeys).forEach(key => {
  FEATURE_NAME_TO_STATUS_KEY.set(FeatureNames[key], key);
});

@Injectable({
  providedIn: 'root',
})
export class RequiredFeatureFlagsGuard implements CanActivate {
  constructor(
    private platformFeatureService: PlatformFeatureService,
    private router: Router,
    private location: Location
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const requiredFeatureFlags = (route.data.requiredFeatureFlags ??
      []) as FeatureNames[];
    const disabledFeatureFlag = requiredFeatureFlags.find(
      featureFlag => !this.isFeatureEnabled(featureFlag)
    );
    if (disabledFeatureFlag === undefined) {
      return true;
    }

    try {
      await this.router.navigate([
        `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
      ]);
    } catch {
      // The URL is still replaced below so that the blocked route does not
      // stay in the browser history even if navigation fails.
    }
    this.location.replaceState(state.url);
    return false;
  }

  private isFeatureEnabled(featureFlag: FeatureNames): boolean {
    const statusKey = FEATURE_NAME_TO_STATUS_KEY.get(featureFlag);
    if (statusKey === undefined) {
      throw new Error(`Feature '${featureFlag}' does not exist.`);
    }
    return this.platformFeatureService.status[statusKey].isEnabled;
  }
}
