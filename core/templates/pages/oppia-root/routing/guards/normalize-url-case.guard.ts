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
 * @fileoverview normalizing url case
 */

import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

@Injectable({providedIn: 'root'})
export class NormalizeUrlCaseGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const originalUrl = state.url;
    const lowerUrl = originalUrl.toLowerCase();

    // Fast-path: already lowercase → continue navigation.
    if (originalUrl === lowerUrl) {
      return true;
    }
    // Otherwise, issue an in-app redirect that replaces the current history
    // entry (so the Back button behaves naturally).
    return this.router.parseUrl(lowerUrl);
  }
}
