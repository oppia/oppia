// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the skill misconceptions editor.
 */


require(
  'pages/skill-editor-page/editor-tab/skill-misconceptions-editor/' +
  'misconception-editor.directive.ts');
require(
  'pages/skill-editor-page/modal-templates/' +
  'add-misconception-modal.controller.ts');
require(
  'pages/skill-editor-page/modal-templates/' +
  'delete-misconception-modal.controller.ts');

require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');
require('services/contextual/window-dimensions.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('skillMisconceptionsEditor', [
  'SkillEditorStateService', 'SkillUpdateService', 'UrlInterpolationService',
  function(
      SkillEditorStateService, SkillUpdateService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-misconceptions-editor/' +
        'skill-misconceptions-editor.directive.html'),
      controller: [
        '$scope', '$uibModal', 'WindowDimensionsService',
        function(
            $scope, $uibModal, WindowDimensionsService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          $scope.isEditable = function() {
            return true;
          };

          $scope.changeActiveMisconceptionIndex = function(idx) {
            if (idx === $scope.activeMisconceptionIndex) {
              $scope.activeMisconceptionIndex = null;
            } else {
              $scope.activeMisconceptionIndex = idx;
            }
          };

          $scope.getMisconceptionSummary = function(misconception) {
            return misconception.getName();
          };

          $scope.openDeleteMisconceptionModal = function(index, evt) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill-editor-page/modal-templates/' +
                'delete-misconception-modal.directive.html'),
              backdrop: 'static',
              resolve: {
                index: () => index
              },
              controller: 'DeleteMisconceptionModalController'
            }).result.then(function(result) {
              SkillUpdateService.deleteMisconception($scope.skill, result.id);
              $scope.misconceptions = $scope.skill.getMisconceptions();
              $scope.activeMisconceptionIndex = null;
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.openAddMisconceptionModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill-editor-page/modal-templates/' +
                'add-misconception-modal.directive.html'),
              backdrop: 'static',
              controller: 'AddMisconceptionModalController'
            }).result.then(function(result) {
              SkillUpdateService.addMisconception(
                $scope.skill, result.misconception);
              $scope.misconceptions = $scope.skill.getMisconceptions();
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.toggleMisconceptionLists = function() {
            if (WindowDimensionsService.isWindowNarrow()) {
              $scope.misconceptionsListIsShown = (
                !$scope.misconceptionsListIsShown);
            }
          };

          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.misconceptionsListIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            $scope.misconceptions = $scope.skill.getMisconceptions();
            ctrl.directiveSubscriptions.add(
              SkillEditorStateService.onSkillChange.subscribe(
                () => $scope.misconceptions = $scope.skill.getMisconceptions())
            );
          };

          $scope.$on('$destroy', function() {
            ctrl.directiveSubscriptions.unsubscribe();
          });
        }]
    };
  }
]);
