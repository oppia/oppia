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
 * @fileoverview Directive for the navbar of the collection editor.
 */

oppia.directive('collectionEditorNavbar', [function() {
  return {
    restrict: 'E',
    templateUrl: 'inline/collection_editor_navbar_directive',
    controller: [
      '$scope', '$modal', 'alertsService', 'routerService', 'UndoRedoService',
      'CollectionEditorStateService', 'CollectionValidationService',
      'CollectionRightsBackendApiService',
      'WritableCollectionBackendApiService',
      'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
      'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
      function(
          $scope, $modal, alertsService, routerService, UndoRedoService,
          CollectionEditorStateService, CollectionValidationService,
          CollectionRightsBackendApiService,
          WritableCollectionBackendApiService,
          EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED,
          EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
        $scope.collectionId = GLOBALS.collectionId;
        $scope.collection = CollectionEditorStateService.getCollection();
        $scope.isPrivate = GLOBALS.isPrivate;
        $scope.canUnpublish = GLOBALS.canUnpublish;
        $scope.validationIssues = [];
        $scope.isSaveInProgress = (
          CollectionEditorStateService.isSavingCollection);

        $scope.getTabStatuses = routerService.getTabStatuses;
        $scope.selectMainTab = routerService.navigateToMainTab;
        $scope.selectPreviewTab = routerService.navigateToPreviewTab;
        $scope.selectSettingsTab = routerService.navigateToSettingsTab;
        $scope.selectStatsTab = routerService.navigateToStatsTab;
        $scope.selectHistoryTab = routerService.navigateToHistoryTab;
        $scope.selectFeedbackTab = routerService.navigateToFeedbackTab;

        var _validateCollection = function() {
          if ($scope.isPrivate) {
            $scope.validationIssues = (
              CollectionValidationService
                .findValidationIssuesForPrivateCollection(
                  $scope.collection));
          } else {
            $scope.validationIssues = (
              CollectionValidationService
                .findValidationIssuesForPublicCollection(
                  $scope.collection));
          }
        };

        var _publishCollection = function() {
          // TODO(bhenning): This also needs a confirmation of destructive
          // action since it is not reversible.
          CollectionRightsBackendApiService.setCollectionPublic(
            $scope.collectionId, $scope.collection.getVersion()).then(
            function() {
              // TODO(bhenning): There should be a scope-level rights object
              // used, instead. The rights object should be loaded with the
              // collection.
              $scope.isPrivate = false;
            }, function() {
              alertsService.addWarning(
                'There was an error when publishing the collection.');
            });
        };

        $scope.$on(
          EVENT_COLLECTION_INITIALIZED, _validateCollection);
        $scope.$on(EVENT_COLLECTION_REINITIALIZED, _validateCollection);
        $scope.$on(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateCollection);

        $scope.getWarningsCount = function() {
          return $scope.validationIssues.length;
        };

        $scope.getChangeListCount = function() {
          return UndoRedoService.getChangeCount();
        };

        $scope.isCollectionSaveable = function() {
          return (
            $scope.getChangeListCount() > 0 &&
            $scope.validationIssues.length === 0);
        };

        $scope.isCollectionPublishable = function() {
          return (
            $scope.isPrivate &&
            $scope.getChangeListCount() === 0 &&
            $scope.validationIssues.length === 0);
        };

        $scope.saveChanges = function() {
          var isPrivate = $scope.isPrivate;
          var modalInstance = $modal.open({
            templateUrl: 'modals/saveCollection',
            backdrop: true,
            controller: [
              '$scope', '$modalInstance', function($scope, $modalInstance) {
                $scope.isCollectionPrivate = isPrivate;

                $scope.save = function(commitMessage) {
                  $modalInstance.close(commitMessage);
                };
                $scope.cancel = function() {
                  $modalInstance.dismiss('cancel');
                };
              }
            ]
          });

          modalInstance.result.then(function(commitMessage) {
            CollectionEditorStateService.saveCollection(commitMessage);
          });
        };

        $scope.publishCollection = function() {
          var additionalMetadataNeeded = (
            !$scope.collection.getTitle() ||
            !$scope.collection.getObjective() ||
            !$scope.collection.getCategory());

          if (additionalMetadataNeeded) {
            $modal.open({
              templateUrl: 'modals/addCollectionMetadata',
              backdrop: true,
              controller: [
                '$scope', '$modalInstance', 'CollectionEditorStateService',
                'CollectionUpdateService', 'CATEGORY_LIST',
                function(
                    $scope, $modalInstance, CollectionEditorStatesService,
                    CollectionUpdateService, CATEGORY_LIST) {
                  var collection = (
                    CollectionEditorStateService.getCollection());

                  $scope.requireTitleToBeSpecified = !collection.getTitle();
                  $scope.requireObjectiveToBeSpecified = (
                    !collection.getObjective());
                  $scope.requireCategoryToBeSpecified = (
                    !collection.getCategory());

                  $scope.newTitle = collection.getTitle();
                  $scope.newObjective = collection.getObjective();
                  $scope.newCategory = collection.getCategory();

                  $scope.CATEGORY_LIST_FOR_SELECT2 = [];
                  for (var i = 0; i < CATEGORY_LIST.length; i++) {
                    $scope.CATEGORY_LIST_FOR_SELECT2.push({
                      id: CATEGORY_LIST[i],
                      text: CATEGORY_LIST[i]
                    });
                  }

                  $scope.isSavingAllowed = function() {
                    return Boolean(
                      $scope.newTitle && $scope.newObjective &&
                      $scope.newCategory);
                  };

                  $scope.save = function() {
                    if (!$scope.newTitle) {
                      alertsService.addWarning('Please specify a title');
                      return;
                    }
                    if (!$scope.newObjective) {
                      alertsService.addWarning('Please specify an objective');
                      return;
                    }
                    if (!$scope.newCategory) {
                      alertsService.addWarning('Please specify a category');
                      return;
                    }

                    // Record any fields that have changed.
                    var metadataList = [];
                    if ($scope.newTitle !== collection.getTitle()) {
                      metadataList.push('title');
                      CollectionUpdateService.setCollectionTitle(
                        collection, $scope.newTitle);
                    }
                    if ($scope.newObjective !== collection.getObjective()) {
                      metadataList.push('objective');
                      CollectionUpdateService.setCollectionObjective(
                        collection, $scope.newObjective);
                    }
                    if ($scope.newCategory !== collection.getCategory()) {
                      metadataList.push('category');
                      CollectionUpdateService.setCollectionCategory(
                        collection, $scope.newCategory);
                    }

                    $modalInstance.close(metadataList);
                  };

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(metadataList) {
              var commitMessage = (
                'Add metadata: ' + metadataList.join(', ') + '.');
              CollectionEditorStateService.saveCollection(
                commitMessage, _publishCollection);
            });
          } else {
            _publishCollection();
          }
        };

        // Unpublish the collection. Will only show up if the collection is
        // public and the user has access to the collection.
        $scope.unpublishCollection = function() {
          CollectionRightsBackendApiService.setCollectionPrivate(
            $scope.collectionId, $scope.collection.getVersion()).then(
            function() {
              $scope.isPrivate = true;
            }, function() {
              alertsService.addWarning(
                'There was an error when unpublishing the collection.');
            });
        };
      }
    ]
  };
}]);
