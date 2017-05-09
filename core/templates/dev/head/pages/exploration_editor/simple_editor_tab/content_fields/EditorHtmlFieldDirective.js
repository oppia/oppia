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
 * @fileoverview Directive for an HTML content field in the simple editor.
 */

oppia.directive('editorHtmlField', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        fieldId: '@',
        getOriginalValue: '&originalValue',
        onFinishEditing: '&',
        placeholder: '@',
        // The '?' means that $scope.validator will return undefined if it has
        // not been set.
        validator: '&?'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/simple_editor_tab/content_fields/' +
        'editor_html_field_directive.html'),
      controller: ['$scope', 'focusService', function($scope, focusService) {
        $scope.SCHEMA = {
          type: 'html'
        };
        $scope.data = {
          valueBeingEdited: null
        };

        $scope.inEditMode = false;
        $scope.focusLabel = focusService.generateFocusLabel();

        $scope.$on('openEditorHtmlField', function(evt, data) {
          if (data.fieldId === $scope.fieldId) {
            if (!$scope.inEditMode) {
              $scope.startEditing();
            } else {
              // TODO(sll): For some reason, this does not do anything.
              focusService.setFocus($scope.focusLabel);
            }
          }
        });

        $scope.$on('discardChangesEditorHtmlField', function(evt, data) {
          if (data.fieldId === $scope.fieldId) {
            $scope.inEditMode = false;
            $scope.data.valueBeingEdited = null;
          }
        });

        $scope.canSave = function() {
          if ($scope.validator) {
            var isValid = $scope.validator({
              newValue: $scope.data.valueBeingEdited
            });
            return isValid;
          } else {
            return true;
          }
        };

        $scope.startEditing = function() {
          $scope.data.valueBeingEdited = $scope.getOriginalValue();
          $scope.inEditMode = true;
          focusService.setFocus($scope.focusLabel);
        };

        $scope.finishEditing = function() {
          $scope.inEditMode = false;
          if ($scope.onFinishEditing) {
            $scope.onFinishEditing({
              newValue: $scope.data.valueBeingEdited
            });
          }
          $scope.data.valueBeingEdited = null;
        };
      }]
    };
  }
]);
