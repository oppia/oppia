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
 * @fileoverview Directive for the correct editor.
 */

// This directive controls an editor for selecting whether the answers
// which fall under this answer group are correct or not. It also includes
// 'Cancel' and 'Save' buttons which call respective 'onCancelCorrectEdit'
// and 'onSaveRule' callbacks when called.
oppia.directive('correctEditor', [
  '$log', 'UrlInterpolationService', function($log, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isEditable: '&isEditable',
        onSaveCorrect: '&',
        labelledAsCorrect: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/' +
        'correct_editor_directive.html'),
      controller: [
        '$scope', 'ResponsesService', 'stateInteractionIdService', function(
            $scope, ResponsesService, stateInteractionIdService) {
          $scope.savedCorrect = angular.copy($scope.labelledAsCorrect);
          $scope.correctEditorIsOpen = false;
          $scope.currentInteractionId = stateInteractionIdService.savedMemento;
          
          var onExternalSave = function() {
            // The reason for this guard is because, when the editor page for an
            // exploration is first opened, the 'initializeAnswerGroups' event
            // (which fires an 'externalSave' event) only fires after the
            // $scope.savedCorrect is set above. Until then, $scope.savedOutcome
            // is undefined.
            if ($scope.savedCorrect === undefined) {
              $scope.savedCorrect = angular.copy($scope.labelledAsCorrect);
            }

            if ($scope.correctEditorIsOpen) {
              if ($scope.editCorrectForm.$valid) {
                $scope.saveThisCorrect($scope.labelledAsCorrect);
              } else {
                $scope.cancelThisCorrect();
              }
            }
          };

          $scope.$on('externalSave', function() {
            onExternalSave();
          });

          $scope.$on('onInteractionIdChanged', function() {
            onExternalSave();
          });
          
          $scope.openCorrectEditor = function() {
            if ($scope.isEditable()) {
              $scope.correctEditorIsOpen = true;
            }
          };
          $scope.cancelThisCorrect = function() {
            $scope.labelledAsCorrect = angular.copy(
              $scope.savedCorrect);
            $scope.correctEditorIsOpen = false;
            $scope.onCancelCorrectEdit();
          };

          $scope.saveThisCorrect = function(tempCorrect) {
            $scope.correctEditorIsOpen = false;
            $scope.savedCorrect = angular.copy(
              tempCorrect);
            $scope.onSaveCorrect()($scope.savedCorrect);
          };

          $scope.init = function() {
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
