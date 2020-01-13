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
 * @fileoverview Directive for the misconception editor.
 */

require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

angular.module('oppia').directive('misconceptionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      retrict: 'E',
      scope: {
        misconception: '=',
        getIndex: '&index',
        isEditable: '&isEditable'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-misconceptions-editor/' +
        'misconception-editor.directive.html'),
      controller: [
        '$scope', 'SkillUpdateService', 'SkillEditorStateService',
        'MISCONCEPTION_NAME_CHAR_LIMIT',
        function(
            $scope, SkillUpdateService, SkillEditorStateService,
            MISCONCEPTION_NAME_CHAR_LIMIT) {
          var ctrl = this;
          var nameMemento = null;
          var notesMemento = null;
          var feedbackMemento = null;

          $scope.openNameEditor = function() {
            if ($scope.isEditable()) {
              nameMemento = angular.copy(
                $scope.container.misconceptionName);
              $scope.nameEditorIsOpen = true;
            }
          };

          $scope.openNotesEditor = function() {
            if ($scope.isEditable()) {
              notesMemento = angular.copy(
                $scope.container.misconceptionNotes);
              $scope.notesEditorIsOpen = true;
            }
          };

          $scope.openFeedbackEditor = function() {
            if ($scope.isEditable()) {
              feedbackMemento = angular.copy(
                $scope.container.misconceptionFeedback);
              $scope.feedbackEditorIsOpen = true;
            }
          };

          $scope.saveName = function() {
            $scope.nameEditorIsOpen = false;
            var nameHasChanged = (
              nameMemento !==
              $scope.container.misconceptionName);

            if (nameHasChanged) {
              SkillUpdateService.updateMisconceptionName(
                $scope.skill,
                $scope.misconception.getId(),
                nameMemento,
                $scope.container.misconceptionName);
              nameMemento = null;
            }
          };

          $scope.saveNotes = function() {
            $scope.notesEditorIsOpen = false;
            var notesHasChanged = (
              notesMemento !==
              $scope.container.misconceptionNotes);

            if (notesHasChanged) {
              SkillUpdateService.updateMisconceptionNotes(
                $scope.skill,
                $scope.misconception.getId(),
                notesMemento,
                $scope.container.misconceptionNotes);
              notesMemento = null;
            }
          };

          $scope.updateMustBeAddressed = function() {
            SkillUpdateService.updateMisconceptionMustBeAddressed(
              $scope.skill,
              $scope.misconception.getId(),
              !$scope.container.misconceptionMustBeAddressed,
              $scope.container.misconceptionMustBeAddressed);
          };

          $scope.saveFeedback = function() {
            $scope.feedbackEditorIsOpen = false;
            var feedbackHasChanged = (
              feedbackMemento !==
              $scope.container.misconceptionFeedback);

            if (feedbackHasChanged) {
              SkillUpdateService.updateMisconceptionFeedback(
                $scope.skill,
                $scope.misconception.getId(),
                feedbackMemento,
                $scope.container.misconceptionFeedback);
              feedbackMemento = null;
            }
          };

          $scope.cancelEditName = function() {
            $scope.container.misconceptionName = nameMemento;
            nameMemento = null;
            $scope.nameEditorIsOpen = false;
          };

          $scope.cancelEditNotes = function() {
            $scope.container.misconceptionNotes = notesMemento;
            notesMemento = null;
            $scope.notesEditorIsOpen = false;
          };

          $scope.cancelEditFeedback = function() {
            $scope.container.misconceptionFeedback = feedbackMemento;
            feedbackMemento = null;
            $scope.feedbackEditorIsOpen = false;
          };

          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.MISCONCEPTION_NAME_CHAR_LIMIT = (
              MISCONCEPTION_NAME_CHAR_LIMIT);
            $scope.nameEditorIsOpen = false;
            $scope.notesEditorIsOpen = false;
            $scope.feedbackEditorIsOpen = false;

            $scope.container = {
              misconceptionName: $scope.misconception.getName(),
              misconceptionNotes: $scope.misconception.getNotes(),
              misconceptionFeedback: $scope.misconception.getFeedback(),
              misconceptionMustBeAddressed: $scope.misconception.isMandatory()
            };

            $scope.NOTES_FORM_SCHEMA = {
              type: 'html',
              ui_config: {}
            };

            $scope.FEEDBACK_FORM_SCHEMA = {
              type: 'html',
              ui_config: {
                hide_complex_extensions: 'true'
              }
            };
          };
        }]
    };
  }
]);
