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
 * @fileoverview Primary controller for the collection editor page.
 */

// TODO(bhenning): These constants should be provided by the backend.
oppia.constant(
  'COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');
oppia.constant(
  'WRITABLE_COLLECTION_DATA_URL_TEMPLATE',
  '/collection_editor_handler/data/<collection_id>');
oppia.constant(
  'COLLECTION_RIGHTS_URL_TEMPLATE',
  '/collection_editor_handler/rights/<collection_id>');
oppia.constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', '/explorationsummarieshandler/data');

oppia.controller('CollectionEditor', [
  '$scope', 'CollectionEditorStateService', 'CollectionRightsBackendApiService',
  'CollectionValidationService', 'UndoRedoService', 'alertsService',
  'COLLECTION_EDITOR_INITIALIZED_COLLECTION',
  'COLLECTION_EDITOR_UPDATED_COLLECTION',
  'UNDO_REDO_SERVICE_CHANGE_APPLIED',
  function(
    $scope, CollectionEditorStateService, CollectionRightsBackendApiService,
    CollectionValidationService, UndoRedoService, alertsService,
    COLLECTION_EDITOR_INITIALIZED_COLLECTION,
    COLLECTION_EDITOR_UPDATED_COLLECTION,
    UNDO_REDO_SERVICE_CHANGE_APPLIED) {
    $scope.isPrivate = GLOBALS.isPrivate;
    $scope.canUnpublish = GLOBALS.canUnpublish;
    $scope.validationIssues = [];

    var _collectionId = GLOBALS.collectionId;

    var _validateCollection = function() {
      var collection = CollectionEditorStateService.getCollection();
      if ($scope.isPrivate) {
        $scope.validationIssues = (
          CollectionValidationService.findValidationIssuesForPrivateCollection(
            collection));
      } else {
        $scope.validationIssues = (
          CollectionValidationService.findValidationIssuesForPublicCollection(
            collection));
      }
    };

    // Load the collection to be edited.
    CollectionEditorStateService.loadCollection(_collectionId);

    $scope.$on(COLLECTION_EDITOR_INITIALIZED_COLLECTION, _validateCollection);
    $scope.$on(COLLECTION_EDITOR_UPDATED_COLLECTION, _validateCollection);
    $scope.$on(UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateCollection);

    $scope.getChangeListCount = function() {
      return UndoRedoService.getChangeCount();
    };

    // An explicit save is needed to push all changes to the backend at once
    // because some likely working states of the collection will cause
    // validation errors when trying to incrementally save them.
    $scope.saveCollection = CollectionEditorStateService.saveCollection;

    $scope.publishCollection = function() {
      // TODO(bhenning): This also needs a confirmation of destructive action
      // since it is not reversible.
      var collection = CollectionEditorStateService.getCollection();
      CollectionRightsBackendApiService.setCollectionPublic(
        _collectionId, collection.getVersion()).then(
        function() {
          // TODO(bhenning): There should be a scope-level rights object used,
          // instead. The rights object should be loaded with the collection.
          $scope.isPrivate = false;
        }, function() {
          alertsService.addWarning(
            'There was an error when publishing the collection.');
        });
    };

    // Unpublish the collection. Will only show up if the collection is public
    // and the user have access to the collection.
    $scope.unpublishCollection = function() {
      var collection = CollectionEditorStateService.getCollection();
      CollectionRightsBackendApiService.setCollectionPrivate(
        _collectionId, collection.getVersion()).then(
        function() {
          $scope.isPrivate = true;
        }, function() {
          alertsService.addWarning(
            'There was an error when unpublishing the collection.');
        });
    };
  }]);
