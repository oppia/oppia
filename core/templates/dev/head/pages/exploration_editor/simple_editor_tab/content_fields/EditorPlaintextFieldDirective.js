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
 * @fileoverview Directive for a plain-text content field in the simple editor.
 */

oppia.directive('editorPlaintextField', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getOriginalValue: '&originalValue',
        placeholder: '@',
        onFinishEditing: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/simple_editor_tab/content_fields/' +
        'editor_plaintext_field_directive.html'),
      controller: ['$scope', 'focusService', function($scope, focusService) {
        $scope.data = {
          valueBeingEdited: null
        };

        $scope.inEditMode = false;
        $scope.focusLabel = focusService.generateFocusLabel();

        $scope.startEditing = function() {
          $scope.data.valueBeingEdited = $scope.getOriginalValue();
          $scope.inEditMode = true;
          focusService.setFocus($scope.focusLabel);
        };

        $scope.finishEditing = function() {
          $scope.inEditMode = false;
          $scope.onFinishEditing({
            newValue: $scope.data.valueBeingEdited
          });
          $scope.data.valueBeingEdited = null;
        };

        $scope.onKeypress = function(evt) {
          if (evt.keyCode === 13) {
            $scope.finishEditing();
          }
        };
      }]
    };
  }
]);
