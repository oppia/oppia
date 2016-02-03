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
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */

oppia.directive('collectionDetailsEditorDirective', [function() {
  return {
    restrict: 'E',
    scope: {
      getTitle: '&title',
      getCategory: '&category',
      getObjective: '&objective',
      getVersion: '&version',
      hasCollectionNode: '&',
      addCollectionNode: '&',
      setCollectionTitle: '&',
      setCollectionCategory: '&',
      setCollectionObjective: '&',
      // TODO(bhenning): The functionality of adding changes should be provided
      // through a change list service singleton that's injected, rather than
      // being passed through $scope.
      addChange: '&'
    },
    templateUrl: 'inline/collection_details_editor_directive',
    controller: ['$scope', 'CollectionUpdateService', 'warningsData',
        function($scope, CollectionUpdateService, warningsData) {
      $scope.addExploration = function(newExplorationId) {
        var addCollectionNodeArgs = {
          explorationId: newExplorationId
        };
        if (!newExplorationId) {
          warningsData.addWarning('Cannot add an empty exploration ID.');
          return;
        }
        if ($scope.hasCollectionNode(addCollectionNodeArgs)) {
          warningsData.addWarning(
            'Exploration with id ' + newExplorationId + ' is already added');
          return;
        }
        $scope.addCollectionNode(addCollectionNodeArgs);
        $scope.addChange({
          change: CollectionUpdateService.buildAddCollectionNodeChangeDict(
            newExplorationId)
        });
      };

      $scope.updateCollectionTitle = function(newCollectionTitle) {
        if (!newCollectionTitle) {
          warningsData.addWarning('Cannot set empty collection title.');
          return;
        }
        $scope.setCollectionTitle({
          newTitle: newCollectionTitle
        });
        $scope.addChange({
          change: CollectionUpdateService.buildCollectionTitleChangeDict(
            newCollectionTitle)
        });
      };

      $scope.updateCollectionCategory = function(newCollectionCategory) {
        if (!newCollectionCategory) {
          warningsData.addWarning('Cannot set empty collection category.');
          return;
        }
        $scope.setCollectionCategory({
          newCategory: newCollectionCategory
        });
        $scope.addChange({
          change: CollectionUpdateService.buildCollectionCategoryChangeDict(
            newCollectionCategory)
        });
      };

      $scope.updateCollectionObjective = function(newCollectionObjective) {
        if (!newCollectionObjective) {
          warningsData.addWarning('Cannot set empty collection objective.');
          return;
        }
        $scope.setCollectionObjective({
          newObjective: newCollectionObjective
        });
        $scope.addChange({
          change: CollectionUpdateService.buildCollectionObjectiveChangeDict(
            newCollectionObjective)
        });
      };
    }]
  };
}]);
