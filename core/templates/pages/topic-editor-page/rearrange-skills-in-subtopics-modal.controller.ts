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
    '$controller', '$scope', '$uibModalInstance', 'TopicEditorStateService',
    'TopicUpdateService', 'UrlInterpolationService',
    'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
    function(
        $controller, $scope, $uibModalInstance, TopicEditorStateService,
        TopicUpdateService, UrlInterpolationService,
        EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED) {
      $controller('ConfirmOrCancelModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
      var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';
      var _initEditor = function() {
        $scope.topic = TopicEditorStateService.getTopic();
        $scope.subtopics = $scope.topic.getSubtopics();
        $scope.uncategorizedSkillSummaries = (
          $scope.topic.getUncategorizedSkillSummaries());
      };

      $scope.getSkillEditorUrl = function(skillId) {
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
      $scope.onMoveSkillStart = function(oldSubtopicId, skillSummary) {
        $scope.skillSummaryToMove = skillSummary;
        $scope.oldSubtopicId = oldSubtopicId ? oldSubtopicId : null;
      };

      /**
       * @param {string|null} newSubtopicId - The subtopic to which the
       *    skill is to be moved, or null if the destination is the
       *    uncategorized section.
       */
      $scope.onMoveSkillEnd = function(newSubtopicId) {
        if (newSubtopicId === $scope.oldSubtopicId) {
          return;
        }

        if (newSubtopicId === null) {
          TopicUpdateService.removeSkillFromSubtopic(
            $scope.topic, $scope.oldSubtopicId, $scope.skillSummaryToMove);
        } else {
          TopicUpdateService.moveSkillToSubtopic(
            $scope.topic, $scope.oldSubtopicId, newSubtopicId,
            $scope.skillSummaryToMove);
        }
        _initEditor();
      };

      $scope.init = function() {
        $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
        $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);
        _initEditor();
      };
      $scope.init();
    }
  ]
);
