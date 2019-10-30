// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to maintain the routing state of the admin page,
 * provide routing functionality, and store all available tab states.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { AdminPageConstants } from
  'pages/admin-page/admin-page.constants.ts';

@Injectable({
  providedIn: 'root'
})
export class AdminRouterService {
  currentTabHash: string = (
    AdminPageConstants.ADMIN_TAB_URLS.ACTIVITIES);

  getTabNameByHash(tabHash: string): string | null {
    for (var tabName in AdminPageConstants.ADMIN_TAB_URLS) {
      if (AdminPageConstants.ADMIN_TAB_URLS[tabName] === tabHash) {
        return tabName;
      }
    }
    return null;
  }

  /**
   * Navigates the page to the specified tab based on its HTML hash.
   */
  showTab(tabHash: string): void {
    if (this.getTabNameByHash(tabHash)) {
      this.currentTabHash = tabHash;
    }
  }

  /**
   * Returns whether the activities tab is open.
   */
  isActivitiesTabOpen(): boolean {
    return this.currentTabHash === (
      AdminPageConstants.ADMIN_TAB_URLS.ACTIVITIES);
  }

  /**
   * Returns whether the jobs tab is open.
   */
  isJobsTabOpen(): boolean {
    return this.currentTabHash === AdminPageConstants.ADMIN_TAB_URLS.JOBS;
  }

  /**
   * Returns whether the config tab is open.
   */
  isConfigTabOpen(): boolean {
    return this.currentTabHash === AdminPageConstants.ADMIN_TAB_URLS.CONFIG;
  }

  /**
   * Returns whether the roles tab is open.
   */
  isRolesTabOpen(): boolean {
    return this.currentTabHash === AdminPageConstants.ADMIN_TAB_URLS.ROLES;
  }

  /**
   * Returns whether the miscellaneous tab is open.
   */
  isMiscTabOpen(): boolean {
    return this.currentTabHash === AdminPageConstants.ADMIN_TAB_URLS.MISC;
  }
}

angular.module('oppia').factory(
  'AdminRouterService', downgradeInjectable(AdminRouterService));
