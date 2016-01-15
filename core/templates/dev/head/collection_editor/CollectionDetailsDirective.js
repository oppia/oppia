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
 * @fileoverview Directive displaying and editing a collection details. Edit
 * options include: chaning the title, changing the objective, changing the
 * category, and adding a new exploration.
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */

oppia.directive('collectionDetailsDirective', [function() {
  return {
    restrict: 'E',
    scope: {
      getTitle: '&title',
      getCategory: '&category',
      getObjective: '&objective',
      getVersion: '&version',
      addNewExploration: '&',
      setCollectionTitle: '&',
      setCollectionCategory: '&',
      setCollectionObjective: '&',
      addChange: '&'
    },
    templateUrl: 'inline/collection_details_directive',
    controller: ['$scope', 'CollectionUpdateService', function($scope,
      CollectionUpdateService) {
      $scope.addExploration = function(newExpId) {
        if ($scope.addNewExploration({expId: newExpId})) {
          var change = CollectionUpdateService.buildAddCollectionNodeUpdate(
            newExpId);
          $scope.addChange({change: change});
        }
      };

      $scope.updateCollectionTitle = function(newCollectionTitle) {
        console.log(newCollectionTitle);
        if ($scope.setCollectionTitle({newTitle: newCollectionTitle})) {
          var change = CollectionUpdateService.buildCollectionTitleUpdate(
            newCollectionTitle);
          $scope.addChange({change: change});
        }
      };

      $scope.updateCollectionCategory = function(newCollectionCategory) {
        if ($scope.setCollectionCategory({newCategory: newCollectionCategory})) {
          var change = CollectionUpdateService.buildCollectionCategoryUpdate(
            newCollectionCategory);
          $scope.addChange({change: change});
        }
      };

      $scope.updateCollectionObjective = function(newCollectionObjective) {
        if ($scope.setCollectionObjective({newObjective: newCollectionObjective})) {
          var change = CollectionUpdateService.buildCollectionObjectiveUpdate(
            newCollectionObjective);
          $scope.addChange({change: change});
        }
      };
    }]
  };
}]);
