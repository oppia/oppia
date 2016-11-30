// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the sidebar of the simple editor.
 */

oppia.factory('ScrollSyncService', ['$anchorScroll', function($anchorScroll) {
    $anchorScroll.yOffset = 80;
    return {
      scrollTo: function(hash) {
        $anchorScroll(hash);
      }
    }
}]);

oppia.directive('simpleEditorSidebar', [function() {
  return {
    restrict: 'E',
    templateUrl: 'simpleEditor/sidebar',
    controller: [
        '$scope', 'EditorModeService', 'SimpleEditorManagerService',
        'ScrollSyncService',
        function($scope, EditorModeService, SimpleEditorManagerService,
                 ScrollSyncService) {
      $scope.SUBFIELD_LABELS = [
        {label: 'Multiple choice', abbr: 'mc'},
        {label: 'Correct answer', abbr: 'ca'},
        {label: 'Hints', abbr: 'hint'},
        {label: 'Bridge text', abbr: 'bt'}
      ];
      $scope.setEditorModeToFull = EditorModeService.setModeToFull;
      $scope.questionList = SimpleEditorManagerService.getQuestionList();
      $scope.hightlighted_element_hash = 'title';
      $scope.scrollTo = function(hash) {
        ScrollSyncService.scrollTo(hash);
        $scope.highlightedElementHash = hash;
      };
      $scope.isHighlighted = function(hash) {
        return hash === $scope.highlightedElementHash;
      };
    }]
  };
}]);
