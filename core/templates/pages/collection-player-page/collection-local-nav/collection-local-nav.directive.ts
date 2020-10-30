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
 * @fileoverview Directive for the local navigation in the collection view.
 */

require('domain/collection/read-only-collection-backend-api.service.ts');
require('services/contextual/url.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('collectionLocalNav', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-player-page/collection-local-nav/' +
        'collection-local-nav.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'ReadOnlyCollectionBackendApiService', 'UrlService',
        function(
            ReadOnlyCollectionBackendApiService, UrlService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          ctrl.$onInit = function() {
            ctrl.collectionId = UrlService.getCollectionIdFromUrl();
            ctrl.directiveSubscriptions.add(
              ReadOnlyCollectionBackendApiService.onCollectionLoad.subscribe(
                () => {
                  var collectionDetails = (
                    ReadOnlyCollectionBackendApiService.getCollectionDetails(
                      ctrl.collectionId));
                  ctrl.canEdit = collectionDetails.canEdit;
                }
              )
            );
          };

          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }
]);
