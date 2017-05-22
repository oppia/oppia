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
 * @fileoverview Directive for the fallback editor.
 */

oppia.directive('fallbackEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        trigger: '=',
        getOnSaveFn: '&onSave',
        outcome: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/' +
        'fallback_editor_directive.html'),
      controller: [
        '$scope', 'editabilityService', function($scope, editabilityService) {
          $scope.isEditable = editabilityService.isEditable();

          $scope.editFallbackForm = {};
          $scope.triggerEditorIsOpen = false;

          $scope.INT_FORM_SCHEMA = {
            type: 'int',
            ui_config: {},
            validators: [{
              id: 'is_at_least',
              min_value: 1
            }]
          };

          $scope.displayFeedback = true;

          $scope.triggerMemento = null;

          $scope.openTriggerEditor = function() {
            if ($scope.isEditable) {
              $scope.triggerMemento = angular.copy($scope.trigger);
              $scope.triggerEditorIsOpen = true;
            }
          };

          $scope.saveThisTrigger = function() {
            $scope.triggerEditorIsOpen = false;
            $scope.triggerMemento = null;
            $scope.getOnSaveFn()();
          };

          $scope.cancelThisTriggerEdit = function() {
            $scope.trigger = angular.copy($scope.triggerMemento);
            $scope.triggerMemento = null;
            $scope.triggerEditorIsOpen = false;
          };

          $scope.$on('externalSave', function() {
            if ($scope.triggerEditorIsOpen &&
                $scope.editFallbackForm.editTriggerForm.$valid) {
              $scope.saveThisTrigger();
            }
          });
        }
      ]
    };
  }]);
