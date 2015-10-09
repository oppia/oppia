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
 * @fileoverview Controller for the learner's view of a collection.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

oppia.constant(
  'COLLECTION_DATA_URL', '/collectionhandler/data/<collection_id>');

oppia.controller('CollectionPlayer', [
    '$scope', 'CollectionDataService', 'warningsData',
    function($scope, collectionDataService, warningsData) {

  $scope.collection = {};

  // Load the collection the learner wants to view.
  collectionDataService.loadCollection(
      GLOBALS.collectionId, function(collection) {
    $scope.collection = collection;
  }, function(error, collectionId) {
    // TODO(bhenning): Handle not being able to load the collection.
    warningsData.addWarning(
      error || 'There was an error loading the collection.');
  });
}]);
