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
 * @fileoverview Primary controller for the collection editor navbar breadcrumb.
 *
 * @author oskar.cieslik@gmail.com (Oskar Cieslik)
 */

oppia.directive('collectionEditorNavbarBreadcrumbDirective', [function() {
  return {
    restrict: 'E',
    templateUrl: 'inline/collection_editor_navbar_breadcrumb_directive',
    controller: ['$scope', 'WritableCollectionBackendApiService',
      'CollectionRightsBackendApiService', 'CollectionObjectFactory',
      'CollectionUpdateService', 'UndoRedoService', 'warningsData',
      'routerService', 'CollectionBackendApiService', function(
      $scope, WritableCollectionBackendApiService,
      CollectionRightsBackendApiService, CollectionObjectFactory,
      CollectionUpdateService, UndoRedoService, warningsData, routerService,
      CollectionBackendApiService) {
      $scope.collection = null;
      $scope.collectionId = GLOBALS.collectionId;

      var _TAB_NAMES_TO_HUMAN_READABLE_NAMES = {
        main: 'Edit',
        preview: 'Preview',
        settings: 'Settings',
        stats: 'Statistics',
        history: 'History',
        feedback: 'Feedback'
      };

      CollectionBackendApiService.loadCollection($scope.collectionId).then(
        function(collectionBackendObject) {
          $scope.collection = CollectionObjectFactory.create(
            collectionBackendObject);
        },
        function(error) {
          warningsData.addWarning(
            error || 'There was an error loading the collection.');
        }
      );

      $scope.getCurrentTabName = function() {
        return _TAB_NAMES_TO_HUMAN_READABLE_NAMES[
          routerService.getTabStatuses().active];
      };

      $scope.getCollection = function() {
        return $scope.collection;
      };
    }]
  };
}]);
