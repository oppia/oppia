// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the header of items in a list.
 */

oppia.directive('summaryListHeader', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isSortingDisabled: '&disableSorting',
        getIndex: '&index',
        getSummary: '&summary',
        getShortSummary: '&shortSummary',
        isActive: '&isActive',
        getOnDeleteFn: '&onDeleteFn',
        isDeleteAvailable: '&isDeleteAvailable',
        getNumItems: '&numItems',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary_list_header_directive.html'),
      controller: ['$scope',
        function($scope) {
          $scope.deleteItem = function(evt) {
            $scope.getOnDeleteFn()($scope.getIndex(), evt);
          };
        }
      ]
    };
  }
]);
