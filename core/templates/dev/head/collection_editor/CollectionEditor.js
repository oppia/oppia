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

oppia.constant(
  'COLLECTION_EDITOR_DATA_URL', '/collection_editor/data/<collection_id>');

oppia.controller('CollectionEditor', ['$scope', 'collectionEditorDataService', 'warningsData',
	function($scope, collectionEditorDataService, warningsData){

  $scope.collection = null;
  $scope.collectionId = '';
  $scope.isCollectionLoaded = false;

  // Get the id of the collection to be loaded
  var pathnameArray = window.location.pathname.split('/');
  for (var i = 0; i < pathnameArray.length; i++) {
    if (pathnameArray[i] === 'create') {
      $scope.collectionId = pathnameArray[i + 1];
      break;
    }
  }

  // Load the collection to be edited.
  collectionEditorDataService.loadCollection(
      $scope.collectionId, function(collection) {
    $scope.collection = collection;
    $scope.isCollectionLoaded = true;
  }, function(error, collectionId) {
    // TODO(mgowano): Handle not being able to load the collection.
    warningsData.addWarning(
      error || 'There was an error loading the collection.');
  });
}]);