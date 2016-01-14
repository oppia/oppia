// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
  'COLLECTION_DATA_URL', '/collection_handler/data/<collection_id>');
oppia.constant(
  'WRITABLE_COLLECTION_DATA_URL', '/collection_editor/data/<collection_id>');

oppia.controller('CollectionEditor', ['$scope', 'CollectionBackendApiService',
  'WritableCollectionBackendApiService', 'CollectionUpdateService',
  'warningsData', function(
    $scope, CollectionBackendApiService, WritableCollectionBackendApiService,
    CollectionUpdateService, warningsData) {

  $scope.collection = null;
  $scope.collectionId = GLOBALS.collectionId;
  $scope.collectionSkills = null;

  // Get the id of the collection to be loaded
  var pathnameArray = window.location.pathname.split('/');
  for (var i = 0; i < pathnameArray.length; i++) {
    if (pathnameArray[i] === 'create') {
      $scope.collectionId = pathnameArray[i + 1];
      break;
    }
  }

  // Load the collection to be edited.
  CollectionBackendApiService.loadCollection($scope.collectionId).then(
    function(collection) {
      $scope.collection = collection;
      $scope.collectionSkills = collection.skills;
    }, function(error) {
      // TODO(mgowano): Handle not being able to load the collection.
      warningsData.addWarning(
        error || 'There was an error loading the collection.');
  });

  // Stores a pending list of changes.
  $scope.changeList = [];

  $scope.addChange = function(change) {
    $scope.changeList.push(change);
  };

  // An explicit save is needed to push all changes to the backend at once
  // because some likely working states of the collection will cause validation
  // errors when trying to incrementally save them.
  $scope.saveCollection = function(commitMessage) {
    WritableCollectionBackendApiService.updateCollection(
      $scope.collection.id, $scope.collection.version, commitMessage,
      $scope.changeList).then(function(collection) {
        $scope.collection = collection;
        $scope.changeList = [];
      }, function(error) {
        warningsData.addWarning(
          error || 'There was an error updating the collection.');
      });
  };
}]);
