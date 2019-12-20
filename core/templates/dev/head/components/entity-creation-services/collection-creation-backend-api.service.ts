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
 * @fileoverview Service to notify about creation of collection and obtain
 * collection_id.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').factory('CollectionCreationBackendService', [
  '$http', '$rootScope', '$timeout', '$window',
  'SiteAnalyticsService', 'UrlInterpolationService',
  function(
      $http, $rootScope, $timeout, $window, SiteAnalyticsService,
      UrlInterpolationService) {
    var _createCollection = function(CREATE_NEW_COLLECTION_URL_TEMPLATE) {
      $http.post('/collection_editor_handler/create_new', {})
        .then(function(response) {
          SiteAnalyticsService.registerCreateNewCollectionEvent(
            response.data.collectionId);
          $timeout(function() {
            $window.location = UrlInterpolationService.interpolateURL(
              CREATE_NEW_COLLECTION_URL_TEMPLATE, {
                collection_id: response.data.collectionId
              }
            );
          }, 150);
        }, function() {
          $rootScope.loadingMessage = '';
        });
    };

    return {
      createCollection: function(
          CREATE_NEW_COLLECTION_URL_TEMPLATE) {
        return _createCollection(CREATE_NEW_COLLECTION_URL_TEMPLATE);
      }
    };
  }
]);
