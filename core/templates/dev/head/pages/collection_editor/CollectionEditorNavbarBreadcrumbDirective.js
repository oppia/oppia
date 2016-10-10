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
 * @fileoverview Controller for the navbar breadcrumb of the collection editor.
 */

// TODO(bhenning): After the navbar is moved to a directive, this directive
// should be updated to say 'Loading...' if the collection editor's controller
// is not yet finished loading the collection. Also, this directive should
// support both displaying the current title of the collection (or untitled if
// it does not yet have one) or setting a new title in the case of an untitled
// collection.
oppia.directive('collectionEditorNavbarBreadcrumb', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'inline/collection_editor_navbar_breadcrumb_directive',
    controller: [
      '$scope', 'routerService', 'CollectionEditorStateService',
      'focusService', 'COLLECTION_TITLE_INPUT_FOCUS_LABEL',
      function(
          $scope, routerService, CollectionEditorStateService,
          focusService, COLLECTION_TITLE_INPUT_FOCUS_LABEL) {
        var _TAB_NAMES_TO_HUMAN_READABLE_NAMES = {
          main: 'Edit',
          preview: 'Preview',
          settings: 'Settings',
          stats: 'Statistics',
          history: 'History'
        };

        $scope.collection = CollectionEditorStateService.getCollection();

        $scope.getCurrentTabName = function() {
          return _TAB_NAMES_TO_HUMAN_READABLE_NAMES[
            routerService.getTabStatuses().active];
        };

        $scope.editCollectionTitle = function() {
          routerService.navigateToSettingsTab();
          focusService.setFocus(COLLECTION_TITLE_INPUT_FOCUS_LABEL);
        };
      }
    ]
  };
}]);
