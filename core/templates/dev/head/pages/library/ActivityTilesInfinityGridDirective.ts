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

require('domain/utilities/UrlInterpolationService.ts');
require('services/SearchService.ts');
require('services/contextual/WindowDimensionsService.ts');

oppia.directive('activityTilesInfinityGrid', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/library/' +
        'activity_tiles_infinity_grid_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$rootScope', 'SearchService', 'WindowDimensionsService',
        function($scope, $rootScope, SearchService, WindowDimensionsService) {
          var ctrl = this;
          ctrl.endOfPageIsReached = false;
          ctrl.allActivitiesInOrder = [];
          // Called when the first batch of search results is retrieved from the
          // server.
          $scope.$on(
            'initialSearchResultsLoaded', function(evt, activityList) {
              ctrl.allActivitiesInOrder = activityList;
              ctrl.endOfPageIsReached = false;
            }
          );

          ctrl.showMoreActivities = function() {
            if (!$rootScope.loadingMessage && !ctrl.endOfPageIsReached) {
              ctrl.searchResultsAreLoading = true;
              SearchService.loadMoreData(function(data, endOfPageIsReached) {
                ctrl.allActivitiesInOrder =
                ctrl.allActivitiesInOrder.concat(
                  data.activity_list);
                ctrl.endOfPageIsReached = endOfPageIsReached;
                ctrl.searchResultsAreLoading = false;
              }, function(endOfPageIsReached) {
                ctrl.endOfPageIsReached = endOfPageIsReached;
                ctrl.searchResultsAreLoading = false;
              });
            }
          };

          var libraryWindowCutoffPx = 530;
          ctrl.libraryWindowIsNarrow = (
            WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);

          WindowDimensionsService.registerOnResizeHook(function() {
            ctrl.libraryWindowIsNarrow = (
              WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
            $scope.$apply();
          });
        }
      ]
    };
  }]);
