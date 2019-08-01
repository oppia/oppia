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

require('pages/admin-page/admin-page.constants.ts');

angular.module('oppia').factory('AdminRouterService', [
  'ADMIN_TAB_URLS',
  function(ADMIN_TAB_URLS) {
    var currentTabHash = ADMIN_TAB_URLS.ACTIVITIES;

    var getTabNameByHash = function(tabHash) {
      for (var tabName in ADMIN_TAB_URLS) {
        if (ADMIN_TAB_URLS[tabName] === tabHash) {
          return tabName;
        }
      }
      return null;
    };

    return {
      /**
       * Navigates the page to the specified tab based on its HTML hash.
       */
      showTab: function(tabHash) {
        if (getTabNameByHash(tabHash)) {
          currentTabHash = tabHash;
        }
      },

      /**
       * Returns whether the activities tab is open.
       */
      isActivitiesTabOpen: function() {
        return currentTabHash === ADMIN_TAB_URLS.ACTIVITIES;
      },

      /**
       * Returns whether the jobs tab is open.
       */
      isJobsTabOpen: function() {
        return currentTabHash === ADMIN_TAB_URLS.JOBS;
      },

      /**
       * Returns whether the config tab is open.
       */
      isConfigTabOpen: function() {
        return currentTabHash === ADMIN_TAB_URLS.CONFIG;
      },

      /**
       * Returns whether the roles tab is open.
       */
      isRolesTabOpen: function() {
        return currentTabHash === ADMIN_TAB_URLS.ROLES;
      },

      /**
       * Returns whether the miscellaneous tab is open.
       */
      isMiscTabOpen: function() {
        return currentTabHash === ADMIN_TAB_URLS.MISC;
      }
    };
  }
]);
