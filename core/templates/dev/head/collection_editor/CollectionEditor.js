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
  '$scope', 'WritableCollectionBackendApiService',
  'CollectionRightsBackendApiService', 'CollectionObjectFactory',
  'SkillListObjectFactory', 'CollectionValidationService',
  'CollectionUpdateService', 'UndoRedoService', 'alertsService', function(
    $scope, WritableCollectionBackendApiService,
    CollectionRightsBackendApiService, CollectionObjectFactory,
    SkillListObjectFactory, CollectionValidationService,
    CollectionUpdateService, UndoRedoService, alertsService) {
    $scope.collection = null;
    $scope.collectionId = GLOBALS.collectionId;
    $scope.collectionSkillList = SkillListObjectFactory.create([]);
    $scope.isPrivate = GLOBALS.isPrivate;
    $scope.canUnpublish = GLOBALS.canUnpublish;
    $scope.validationIssues = [];

    var _validateCollection = function() {
      if ($scope.isPrivate) {
        $scope.validationIssues = (
          CollectionValidationService.findValidationIssuesForPrivateCollection(
            $scope.collection));
      } else {
        $scope.validationIssues = (
          CollectionValidationService.findValidationIssuesForPublicCollection(
            $scope.collection));
      }
    };

    var _updateCollection = function(newBackendCollectionObject) {
      $scope.collection = CollectionObjectFactory.create(
        newBackendCollectionObject);
      $scope.collectionSkillList.setSkills(newBackendCollectionObject.skills);
      _validateCollection();
    };

    // Load the collection to be edited.
    WritableCollectionBackendApiService.fetchWritableCollection(
      $scope.collectionId).then(
        _updateCollection, function(error) {
          alertsService.addWarning(
            error || 'There was an error when loading the collection.');
        });

    UndoRedoService.setOnChangedCallback(_validateCollection);

    $scope.getChangeListCount = function() {
      return UndoRedoService.getChangeCount();
    };

    // To be used after mutating the prerequisite and/or acquired skill lists.
    $scope.updateSkillList = function() {
      $scope.collectionSkillList.clearSkills();
      $scope.collectionSkillList.addSkillsFromSkillList(
        $scope.collection.getSkillList());
      $scope.collectionSkillList.sortSkills();
    };

    // An explicit save is needed to push all changes to the backend at once
    // because some likely working states of the collection will cause
    // validation errors when trying to incrementally save them.
    $scope.saveCollection = function(commitMessage) {
      // Don't attempt to save the collection if there are no changes pending.
      if (!UndoRedoService.hasChanges()) {
        return;
      }
      WritableCollectionBackendApiService.updateCollection(
        $scope.collection.getId(), $scope.collection.getVersion(),
        commitMessage, UndoRedoService.getCommittableChangeList()).then(
        function(collectionBackendObject) {
          _updateCollection(collectionBackendObject);
          UndoRedoService.clearChanges();
        }, function(error) {
          alertsService.addWarning(
            error || 'There was an error when updating the collection.');
        });
    };

    $scope.publishCollection = function() {
      // TODO(bhenning): This also needs a confirmation of destructive action
      // since it is not reversible.
      CollectionRightsBackendApiService.setCollectionPublic(
        $scope.collectionId, $scope.collection.getVersion()).then(
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
      CollectionRightsBackendApiService.setCollectionPrivate(
        $scope.collectionId, $scope.collection.getVersion()).then(
        function() {
          $scope.isPrivate = true;
        }, function() {
          alertsService.addWarning(
            'There was an error when unpublishing the collection.');
        });
    };
  }]);
