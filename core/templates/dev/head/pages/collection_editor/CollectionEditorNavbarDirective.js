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

oppia.directive('collectionEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection_editor/collection_editor_navbar_directive.html'),
      controller: [
        '$scope', '$uibModal', 'AlertsService', 'RouterService',
        'UndoRedoService', 'CollectionEditorStateService',
        'CollectionValidationService',
        'CollectionRightsBackendApiService',
        'EditableCollectionBackendApiService',
        'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
        'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
        function(
            $scope, $uibModal, AlertsService, RouterService, UndoRedoService,
            CollectionEditorStateService, CollectionValidationService,
            CollectionRightsBackendApiService,
            EditableCollectionBackendApiService,
            EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED,
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
          $scope.collectionId = GLOBALS.collectionId;
          $scope.collection = CollectionEditorStateService.getCollection();
          $scope.collectionRights = (
            CollectionEditorStateService.getCollectionRights());

          $scope.isLoadingCollection = (
            CollectionEditorStateService.isLoadingCollection);
          $scope.validationIssues = [];
          $scope.isSaveInProgress = (
            CollectionEditorStateService.isSavingCollection);

          $scope.getTabStatuses = RouterService.getTabStatuses;
          $scope.selectMainTab = RouterService.navigateToMainTab;
          $scope.selectPreviewTab = RouterService.navigateToPreviewTab;
          $scope.selectSettingsTab = RouterService.navigateToSettingsTab;
          $scope.selectStatsTab = RouterService.navigateToStatsTab;
          $scope.selectHistoryTab = RouterService.navigateToHistoryTab;

          var _validateCollection = function() {
            if ($scope.collectionRights.isPrivate()) {
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
                $scope.collectionRights.setPublic();
                CollectionEditorStateService.setCollectionRights(
                  $scope.collectionRights);
              });
          };

          $scope.$on(
            EVENT_COLLECTION_INITIALIZED, _validateCollection);
          $scope.$on(EVENT_COLLECTION_REINITIALIZED, _validateCollection);
          $scope.$on(
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateCollection);

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
              $scope.collectionRights.isPrivate() &&
              $scope.getChangeListCount() === 0 &&
              $scope.validationIssues.length === 0);
          };

          $scope.saveChanges = function() {
            var isPrivate = $scope.collectionRights.isPrivate();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/collection_editor/' +
                'collection_editor_save_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.isCollectionPrivate = isPrivate;

                  $scope.save = function(commitMessage) {
                    $uibModalInstance.close(commitMessage);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
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
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/collection_editor/' +
                  'collection_editor_pre_publish_modal_directive.html'),
                backdrop: true,
                controller: [
                  '$scope', '$uibModalInstance', 'CollectionEditorStateService',
                  'CollectionUpdateService', 'ALL_CATEGORIES',
                  function(
                      $scope, $uibModalInstance, CollectionEditorStatesService,
                      CollectionUpdateService, ALL_CATEGORIES) {
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
                    for (var i = 0; i < ALL_CATEGORIES.length; i++) {
                      $scope.CATEGORY_LIST_FOR_SELECT2.push({
                        id: ALL_CATEGORIES[i],
                        text: ALL_CATEGORIES[i]
                      });
                    }

                    $scope.isSavingAllowed = function() {
                      return Boolean(
                        $scope.newTitle && $scope.newObjective &&
                        $scope.newCategory);
                    };

                    $scope.save = function() {
                      if (!$scope.newTitle) {
                        AlertsService.addWarning('Please specify a title');
                        return;
                      }
                      if (!$scope.newObjective) {
                        AlertsService.addWarning('Please specify an objective');
                        return;
                      }
                      if (!$scope.newCategory) {
                        AlertsService.addWarning('Please specify a category');
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

                      $uibModalInstance.close(metadataList);
                    };

                    $scope.cancel = function() {
                      $uibModalInstance.dismiss('cancel');
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
                $scope.collectionRights.setPrivate();
                CollectionEditorStateService.setCollectionRights(
                  $scope.collectionRights);
              }, function() {
                AlertsService.addWarning(
                  'There was an error when unpublishing the collection.');
              });
          };
        }
      ]
    };
  }]);
