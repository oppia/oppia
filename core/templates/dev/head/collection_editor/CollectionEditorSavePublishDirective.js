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
 * @fileoverview Controller for the save/publish buttons in the collection
 * editor.
 */

oppia.directive('collectionEditorSavePublish', [function() {
  return {
    restrict: 'E',
    templateUrl: 'inline/collection_editor_save_publish_directive',
    controller: [
      '$scope', '$modal', 'alertsService', 'UndoRedoService',
      'CollectionEditorStateService', 'CollectionValidationService',
      'CollectionRightsBackendApiService',
      'WritableCollectionBackendApiService',
      'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_UPDATED',
      'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
      function(
          $scope, $modal, alertsService, UndoRedoService,
          CollectionEditorStateService, CollectionValidationService,
          CollectionRightsBackendApiService,
          WritableCollectionBackendApiService,
          EVENT_COLLECTION_INITIALIZED,
          EVENT_COLLECTION_UPDATED,
          EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
        $scope.collection = CollectionEditorStateService.getCollection();
        $scope.isPrivate = GLOBALS.isPrivate;
        $scope.canUnpublish = GLOBALS.canUnpublish;
        $scope.validationIssues = [];
        $scope.isSaveInProgress = (
          CollectionEditorStateService.isSavingCollection);
        var _collectionId = GLOBALS.collectionId;

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

        $scope.$on(
          EVENT_COLLECTION_INITIALIZED, _validateCollection);
        $scope.$on(EVENT_COLLECTION_UPDATED, _validateCollection);
        $scope.$on(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateCollection);

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
          // TODO(bhenning): This also needs a confirmation of destructive
          // action since it is not reversible.
          CollectionRightsBackendApiService.setCollectionPublic(
            _collectionId, $scope.collection.getVersion()).then(
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

        // Unpublish the collection. Will only show up if the collection is
        // public and the user has access to the collection.
        $scope.unpublishCollection = function() {
          CollectionRightsBackendApiService.setCollectionPrivate(
            _collectionId, $scope.collection.getVersion()).then(
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
