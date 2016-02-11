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
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */

// TODO(bhenning): These constants should be provided by the backend.
oppia.constant(
  'COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');
oppia.constant(
  'WRITABLE_COLLECTION_DATA_URL_TEMPLATE',
  '/collection_editor_handler/data/<collection_id>');

oppia.controller('CollectionEditor', ['$scope',
  'WritableCollectionBackendApiService', 'CollectionObjectFactory',
  'SkillListObjectFactory', 'CollectionUpdateService', 'UndoRedoService',
  'warningsData', function(
    $scope, WritableCollectionBackendApiService, CollectionObjectFactory,
    SkillListObjectFactory, CollectionUpdateService, UndoRedoService,
    warningsData) {
    $scope.collection = null;
    $scope.collectionId = GLOBALS.collectionId;
    $scope.collectionSkillList = SkillListObjectFactory.create([]);

    // Get the id of the collection to be loaded
    var pathnameArray = window.location.pathname.split('/');
    for (var i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'create') {
        $scope.collectionId = pathnameArray[i + 1];
        break;
      }
    }

    // Load the collection to be edited.
    WritableCollectionBackendApiService.fetchWritableCollection(
      $scope.collectionId).then(
        function(collection) {
          $scope.collection = CollectionObjectFactory.create(collection);
          $scope.collectionSkillList.setSkills(collection.skills);
        }, function(error) {
          warningsData.addWarning(
            error || 'There was an error loading the collection.');
        });

    $scope.getChangeListCount = function() {
      return UndoRedoService.getChangeCount();
    };

    // To be used after mutating the prerequisite and/or acquired skill lists.
    $scope.updateSkillList = function() {
      $scope.collectionSkillList.clearSkills();
      $scope.collectionSkillList.concatSkillList(
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
        function(collection) {
          $scope.collection = CollectionObjectFactory.create(collection);
          UndoRedoService.clearChanges();
        }, function(error) {
          warningsData.addWarning(
            error || 'There was an error updating the collection.');
        });
    };
  }]);
