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
 * @fileoverview Data and controllers for the Oppia contributors' gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.filter('selectedCategoriesFilter', function() {
  return function(items, selectedCategories, fieldName) {
    if (!items) {
      return [];
    }

    return items.filter(function(item) {
      return selectedCategories[item[fieldName]];
    });
  };
});

oppia.directive('checkboxGroup', function() {
  return {
    restrict: 'E',
    scope: {
      allCategoriesLabel: '@',
      // Dict where each key is the name of a category, and each
      // value is true/false according to whether the category is
      // selected or not. It is assumed that not all categories
      // are unselected at the outset.
      model: '='
    },
    templateUrl: 'checkboxGroup/master',
    controller: ['$scope', function($scope) {
      var someCategoryUnchecked = false;
      for (var key in $scope.model) {
        if (!$scope.model[key]) {
          someCategoryUnchecked = true;
        }
      }

      $scope.allCategoriesSelected = !someCategoryUnchecked;
      $scope.individualCategoryCheckboxStatuses = {};
      for (var key in $scope.model) {
        if (someCategoryUnchecked) {
          $scope.individualCategoryCheckboxStatuses[key] = $scope.model[key];
        } else {
          $scope.individualCategoryCheckboxStatuses[key] = false;
        }
      }

      $scope.onChangeSelection = function(allCategoriesCheckboxChanged) {
        if (allCategoriesCheckboxChanged) {
          if ($scope.allCategoriesSelected) {
            for (var key in $scope.model) {
              $scope.model[key] = true;
              $scope.individualCategoryCheckboxStatuses[key] = false;
            }
          } else {
            $scope.allCategoriesSelected = true;
          }
        } else {
          var someCategoryCheckboxIsChecked = false;
          var someCategoryCheckboxIsUnchecked = false;
          for (var key in $scope.model) {
            if ($scope.individualCategoryCheckboxStatuses[key]) {
              someCategoryCheckboxIsChecked = true;
            } else {
              someCategoryCheckboxIsUnchecked = true;
            }
          }

          if (someCategoryCheckboxIsChecked && someCategoryCheckboxIsUnchecked) {
            $scope.allCategoriesSelected = false;
            for (var key in $scope.model) {
              $scope.model[key] = $scope.individualCategoryCheckboxStatuses[key];
            }
          } else {
            for (var key in $scope.model) {
              $scope.model[key] = true;
            }
            $scope.allCategoriesSelected = true;
          }
        }
      };
    }]
  };
});

oppia.controller('Gallery', [
    '$scope', '$http', '$rootScope', 'createExplorationButtonService',
    'oppiaDatetimeFormatter',
    function($scope, $http, $rootScope, createExplorationButtonService,
             oppiaDatetimeFormatter) {
  $scope.galleryDataUrl = '/galleryhandler/data';

  $scope.selectedStatuses = {
    'publicized': true,
    'public': true,
    'private': true
  };
  $scope.selectedCategories = {};
  $scope.selectedLanguages = {};

  var _navigated = false;
  // Prevent trying to navigate to two places at once when the user clicks on the
  // "See inside" button within the main gallery tile.
  $scope.navigateTo = function(url) {
    if (!_navigated) {
      _navigated = true;
      window.location.href = url;
    }
  };

  $scope.getCategoryList = function() {
    return Object.keys($scope.selectedCategories);
  };

  $scope.getFormattedObjective = function(objective) {
    objective = objective.trim();
    return objective.charAt(0).toUpperCase() + objective.slice(1);
  };

  $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
    return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
  };

  $rootScope.loadingMessage = 'Loading';

  $scope.showCreateExplorationModal = (
    createExplorationButtonService.showCreateExplorationModal);
  $scope.showUploadExplorationModal = (
    createExplorationButtonService.showUploadExplorationModal);

  // Retrieves gallery data from the server.
  $http.get($scope.galleryDataUrl).success(function(data) {
    $scope.releasedExplorations = data.released;
    $scope.betaExplorations = data.beta;
    $scope.privateExplorations = data['private'];

    $scope.allExplorationsInOrder = $scope.releasedExplorations.concat(
      $scope.betaExplorations).concat($scope.privateExplorations);

    $scope.selectedCategories = {};
    $scope.selectedLanguageCodes = {};
    $scope.allExplorationsInOrder.map(function(expDict) {
      $scope.selectedCategories[expDict.category] = true;
      $scope.selectedLanguageCodes[expDict.language_code] = true;
    });

    $rootScope.loadingMessage = '';
  });
}]);
