// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the hint editor.
 */

oppia.directive('hintEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        hint: '=',
        getIndex: '&index',
        getOnSaveFn: '&onSave'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/hint_editor_directive.html'),
      controller: [
        '$scope', 'editabilityService', function($scope, editabilityService) {
          $scope.isEditable = editabilityService.isEditable();

          $scope.editHintForm = {};
          $scope.hintEditorIsOpen = false;

          $scope.HINT_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          $scope.hintMemento = null;

          $scope.openHintEditor = function() {
            if ($scope.isEditable) {
              $scope.hintMemento = angular.copy($scope.hint);
              $scope.hintEditorIsOpen = true;
            }
          };

          $scope.saveThisHint = function() {
            $scope.hintEditorIsOpen = false;
            $scope.hintMemento = null;
            $scope.getOnSaveFn()();
          };

          $scope.cancelThisHintEdit = function() {
            $scope.hint = angular.copy($scope.hintMemento);
            $scope.hintMemento = null;
            $scope.hintEditorIsOpen = false;
          };

          $scope.$on('externalSave', function() {
            if ($scope.hintEditorIsOpen &&
                $scope.editHintForm.$valid) {
              $scope.saveThisHint();
            }
          });
        }
      ]
    };
  }]);
