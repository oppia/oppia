// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A data service that stores data
 * about the rights for this exploration.
 * This is different from the exploration rights service
 * since the data used here is required globally and may
 * create a circular dependency with exploration data service
 * which is used in exploration rights service
 */
require('services/ContextService.ts');
require('services/contextual/UrlService.ts');
var oppia = require('AppInit.ts').module;

oppia.factory('ExplorationRightsDataService', [
  '$http', '$q', 'ContextService', 'UrlService',
  function($http, $q, ContextService, UrlService) {
    var rights = null;
    var pathname = UrlService.getPathname();

    return {
      getRightsAsync: function() {
        // TODO(#7221): This can be removed after exploration data
        // service works correctly if called from different contexts.
        if (pathname.includes('collection_editor')) {
          return $q.resolve({});
        }
        if (rights) {
          return rights;
        }
        rights = $http.get(
          '/createhandler/rights/' + ContextService.getExplorationId()).then(
          function(response) {
            return response.data;
          }
        );
        return rights;
      }
    };
  }
]);
