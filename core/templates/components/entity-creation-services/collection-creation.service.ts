// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Modal and functionality for the create collection button.
 */

// eslint-disable-next-line max-len
require('components/entity-creation-services/collection-creation-backend-api.service.ts');
require('services/alerts.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/site-analytics.service.ts');

// TODO(bhenning): Refactor this to match the frontend design spec and reduce
// duplicated code between CollectionCreationService and
// ExplorationCreationService.

angular.module('oppia').factory('CollectionCreationService', [
  '$timeout', '$window', 'AlertsService',
  'CollectionCreationBackendService', 'LoaderService', 'SiteAnalyticsService',
  'UrlInterpolationService',
  function(
      $timeout, $window, AlertsService,
      CollectionCreationBackendService, LoaderService, SiteAnalyticsService,
      UrlInterpolationService) {
    var CREATE_NEW_COLLECTION_URL_TEMPLATE = (
      '/collection_editor/create/<collection_id>');
    var collectionCreationInProgress = false;

    return {
      createNewCollection: function() {
        if (collectionCreationInProgress) {
          return;
        }

        collectionCreationInProgress = true;
        AlertsService.clearWarnings();

        LoaderService.showLoadingScreen('Creating collection');

        CollectionCreationBackendService.createCollection().then(
          function(response) {
            SiteAnalyticsService.registerCreateNewCollectionEvent(
              response.collectionId);
            $timeout(function() {
              $window.location = UrlInterpolationService.interpolateUrl(
                CREATE_NEW_COLLECTION_URL_TEMPLATE, {
                  collection_id: response.collectionId
                }
              );
            }, 150);
          }, function() {
            LoaderService.hideLoadingScreen();
          }
        );
      }
    };
  }
]);
