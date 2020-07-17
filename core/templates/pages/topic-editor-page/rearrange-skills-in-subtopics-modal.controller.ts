// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for RearrangeSkillsInSubtopicsModal.
 */

require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');

require(
  'components/common-layout-directives/common-elements/' +
    'confirm-or-cancel-modal.controller.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');


angular.module('oppia').controller(
  'RearrangeSkillsInSubtopicsModalController', [
    '$controller', '$scope', '$uibModalInstance', 'SubtopicValidationService',
    'TopicEditorStateService',
    'TopicUpdateService', 'UrlInterpolationService',
    'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
    function(
        $controller, $scope, $uibModalInstance, SubtopicValidationService,
        TopicEditorStateService, TopicUpdateService, UrlInterpolationService,
        EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED) {
      $controller('ConfirmOrCancelModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
      var ctrl = this;
      var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';
      var _initEditor = function() {
        ctrl.topic = TopicEditorStateService.getTopic();
        ctrl.subtopics = ctrl.topic.getSubtopics();
        ctrl.uncategorizedSkillSummaries = (
          ctrl.topic.getUncategorizedSkillSummaries());
      };

      ctrl.getSkillEditorUrl = function(skillId) {
        return UrlInterpolationService.interpolateUrl(
          SKILL_EDITOR_URL_TEMPLATE, {
            skillId: skillId
          }
        );
      };

      /**
       * @param {string|null} oldSubtopicId - The id of the subtopic from
       *    which the skill is to be moved, or null if the origin is the
       *    uncategorized section.
       * @param {SkillSummary} skillSummary - The summary of the skill that
       *    is to be moved.
       */
      ctrl.onMoveSkillStart = function(oldSubtopicId, skillSummary) {
        ctrl.skillSummaryToMove = skillSummary;
        ctrl.oldSubtopicId = oldSubtopicId ? oldSubtopicId : null;
      };

      /**
       * @param {string|null} newSubtopicId - The subtopic to which the
       *    skill is to be moved, or null if the destination is the
       *    uncategorized section.
       */
      ctrl.onMoveSkillEnd = function(newSubtopicId) {
        if (newSubtopicId === $scope.oldSubtopicId) {
          return;
        }

        if (newSubtopicId === null) {
          TopicUpdateService.removeSkillFromSubtopic(
            ctrl.topic, ctrl.oldSubtopicId, ctrl.skillSummaryToMove);
        } else {
          TopicUpdateService.moveSkillToSubtopic(
            ctrl.topic, ctrl.oldSubtopicId, newSubtopicId,
            ctrl.skillSummaryToMove);
        }
        _initEditor();
      };


      ctrl.updateSubtopicTitle = function(subtopicId) {
        console.log(ctrl.editableName);
        if (!SubtopicValidationService.checkValidSubtopicName(ctrl.editableName)) {
          ctrl.errorMsg = 'A subtopic with this title already exists';
          return;
        }

        TopicUpdateService.setSubtopicTitle(
          ctrl.topic, subtopicId, ctrl.editableName);
      };

      $scope.dummyChange = function() {
        console.log(ctrl.editableName);
      };

      ctrl.init = function() {
        ctrl.editableName = '3';
        $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
        $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);
        _initEditor();
      };
      ctrl.init();
    }
  ]
);
