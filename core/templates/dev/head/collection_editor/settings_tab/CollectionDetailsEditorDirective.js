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
 * @fileoverview Directive for displaying and editing a collection details.
 * Edit options include: changing the title, objective, and category, and also
 * adding a new exploration.
 */

oppia.directive('collectionDetailsEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      getCollection: '&collection'
    },
    templateUrl: 'inline/collection_details_editor_directive',
    controller: [
        '$scope', 'CollectionUpdateService', 'alertsService', 'CATEGORY_LIST',
        function(
          $scope, CollectionUpdateService, alertsService, CATEGORY_LIST) {
      $scope.hasPageLoaded = false;
      $scope.CATEGORY_LIST_FOR_SELECT2 = CATEGORY_LIST.map(function(category) {
        return {
          id: category,
          text: category
        };
      });

      $scope.$on('collectionLoaded', function() {
        $scope.displayedCollectionTitle = $scope.getCollection().getTitle();
        $scope.displayedCollectionObjective = (
          $scope.getCollection().getObjective());
        $scope.displayedCollectionCategory = (
          $scope.getCollection().getCategory());

        var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2.some(
          function(categoryItem) {
            return categoryItem.id === $scope.getCollection().getCategory();
          }
        );

        // If the current category is not in the dropdown, add it as the first
        // option.
        if (!categoryIsInSelect2 && $scope.getCollection().getCategory()) {
          $scope.CATEGORY_LIST_FOR_SELECT2.unshift({
            id: $scope.getCollection().getCategory(),
            text: $scope.getCollection().getCategory()
          });
        }

        $scope.hasPageLoaded = true;
      });

      $scope.updateCollectionTitle = function() {
        if (!$scope.displayedCollectionTitle) {
          alertsService.addWarning(
            'Please specify a title for the collection.');
          return;
        }
        CollectionUpdateService.setCollectionTitle(
          $scope.getCollection(), $scope.displayedCollectionTitle);
      };

      $scope.updateCollectionObjective = function() {
        if (!$scope.displayedCollectionObjective) {
          alertsService.addWarning(
            'Please specify a goal for the collection.');
          return;
        }
        CollectionUpdateService.setCollectionObjective(
          $scope.getCollection(), $scope.displayedCollectionObjective);
      };

      $scope.updateCollectionCategory = function() {
        if (!$scope.displayedCollectionCategory) {
          alertsService.addWarning(
            'Please specify a category for the collection.');
          return;
        }
        CollectionUpdateService.setCollectionCategory(
          $scope.getCollection(), $scope.displayedCollectionCategory);
      };
    }]
  };
}]);
