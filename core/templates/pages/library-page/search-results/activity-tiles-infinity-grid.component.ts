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
 * @fileoverview Directive for an infinitely-scrollable view of activity tiles
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/search.service.ts');
require('services/contextual/window-dimensions.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('activityTilesInfinityGrid', {
  template: require('./activity-tiles-infinity-grid.component.html'),
  controller: [
    '$rootScope', '$scope', 'LoaderService', 'SearchService',
    'WindowDimensionsService',
    function(
        $rootScope, $scope, LoaderService, SearchService,
        WindowDimensionsService
    ) {
      var ctrl = this;
      ctrl.loadingMessage = '';
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.showMoreActivities = function() {
        if (!ctrl.loadingMessage && !ctrl.endOfPageIsReached) {
          ctrl.searchResultsAreLoading = true;
          SearchService.loadMoreData(function(data, endOfPageIsReached) {
            ctrl.allActivitiesInOrder = (
              ctrl.allActivitiesInOrder.concat(
                data.activity_list));
            ctrl.endOfPageIsReached = endOfPageIsReached;
            ctrl.searchResultsAreLoading = false;
            $rootScope.$applyAsync();
          }, function(endOfPageIsReached) {
            ctrl.endOfPageIsReached = endOfPageIsReached;
            ctrl.searchResultsAreLoading = false;
          });
        }
      };
      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          LoaderService.onLoadingMessageChange.subscribe(
            (message: string) => this.loadingMessage = message));
        // Called when the first batch of search results is retrieved from
        // the server.
        ctrl.directiveSubscriptions.add(
          SearchService.onInitialSearchResultsLoaded.subscribe(
            (activityList) => {
              ctrl.allActivitiesInOrder = activityList;
              ctrl.endOfPageIsReached = false;
              $rootScope.$applyAsync();
            })
        );
        ctrl.endOfPageIsReached = false;
        ctrl.allActivitiesInOrder = [];
        var libraryWindowCutoffPx = 530;
        ctrl.libraryWindowIsNarrow = (
          WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);

        ctrl.directiveSubscriptions.add(
          WindowDimensionsService.getResizeEvent().subscribe(evt => {
            ctrl.libraryWindowIsNarrow = (
              WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
            $scope.$applyAsync();
          })
        );
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
