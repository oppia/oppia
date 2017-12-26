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
 * @fileoverview Directive for the correctness label editor for answer groups.
 */

// This directive controls an editor for selecting whether the answers
// which fall under this answer group are correct or not. It also includes
// 'Cancel' and 'Save' buttons. The 'Save' button calls 'onSaveCallback'  
// when clicked.
oppia.directive('correctnessLabelEditor', [
  '$log', 'UrlInterpolationService', function($log, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isEditable: '&isEditable',
        onSaveCorrectnessLabel: '&',
        labelledAsCorrect: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/' + 'correct_editor_directive.html'),
      controller: [
        '$scope', 'ResponsesService', function(
            $scope, ResponsesService) {
          var onExternalSave = function() {
            // The reason for this guard is because, when the editor page for an
            // exploration is first opened, the 'initializeAnswerGroups' event
            // (which fires an 'externalSave' event) only fires after the
            // $scope.savedCorrectnessLabel is set above. Until then, 
            // $scope.savedCorrectnessLabel is undefined.
            if ($scope.savedCorrectnessLabel === undefined) {
              $scope.savedCorrectnessLabel = angular.copy(
                $scope.labelledAsCorrect);
            }

            if ($scope.correctnessLabelEditorIsOpen) {
              if ($scope.editCorrectnessLabelForm.form.$valid) {
                $scope.saveCorrectnessLabel($scope.labelledAsCorrect);
              } else {
                $scope.cancelEdit();
              }
            }
          };

          $scope.$on('externalSave', function() {
            onExternalSave();
          });

          $scope.$on('onInteractionIdChanged', function() {
            onExternalSave();
          });
          
          $scope.openCorrectnessLabelEditor = function() {
            if ($scope.isEditable()) {
              $scope.correctnessLabelEditorIsOpen = true;
            }
          };
          $scope.cancelEdit = function() {
            $scope.labelledAsCorrect = angular.copy(
              $scope.savedCorrectnessLabel);
            $scope.correctnessLabelEditorIsOpen = false;
          };

          $scope.saveCorrectnessLabel = function(tempCorrect) {
            $scope.correctnessLabelEditorIsOpen = false;
            $scope.savedCorrectnessLabel = angular.copy(
              tempCorrect);
            $scope.onSaveCorrectnessLabel()($scope.savedCorrectnessLabel);
          };

          $scope.init = function() {
            $scope.savedCorrectnessLabel = angular.copy(
              $scope.labelledAsCorrect);
            $scope.correctnessLabelEditorIsOpen = false;
            $scope.editCorrectnessLabelForm = {};
            
            // Select a default correct value, if one isn't already there.
            if ($scope.labelledAsCorrect === null) {
              $scope.labelledAsCorrect = false;
            }
          };

          $scope.init();
        }
      ]
    };
  }]);
