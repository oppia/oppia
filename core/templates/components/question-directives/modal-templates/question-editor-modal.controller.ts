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
 * @fileoverview Controller for question editor modal.
 */
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('components/skill-selector/select-skill-modal.controller.ts');

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/skill/SkillSummaryObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').controller('QuestionEditorModalController', [
  '$scope', '$uibModal', '$uibModalInstance', 'AlertsService',
  'QuestionUndoRedoService', 'SkillSummaryObjectFactory', 'StateEditorService',
  'UrlInterpolationService', 'associatedSkillSummaries', 'canEditQuestion',
  'groupedSkillSummaries', 'misconceptionsBySkill',
  'newQuestionIsBeingCreated', 'question', 'questionId', 'questionStateData',
  function(
      $scope, $uibModal, $uibModalInstance, AlertsService,
      QuestionUndoRedoService, SkillSummaryObjectFactory, StateEditorService,
      UrlInterpolationService, associatedSkillSummaries, canEditQuestion,
      groupedSkillSummaries, misconceptionsBySkill,
      newQuestionIsBeingCreated, question, questionId, questionStateData) {
    var returnModalObject = {
      skillLinkageModificationsArray: [],
      commitMessage: ''
    };
    $scope.question = question;
    $scope.questionStateData = questionStateData;
    $scope.associatedSkillSummaries =
      angular.copy(associatedSkillSummaries);
    $scope.questionId = questionId;
    $scope.misconceptionsBySkill = misconceptionsBySkill;
    $scope.canEditQuestion = canEditQuestion;
    $scope.newQuestionIsBeingCreated = newQuestionIsBeingCreated;

    if (!newQuestionIsBeingCreated) {
      $scope.validationError = $scope.question.validate(
        $scope.misconceptionsBySkill);
    }

    $scope.removeErrors = function() {
      $scope.validationError = null;
    };
    $scope.getSkillEditorUrl = function(skillId) {
      return '/skill_editor/' + skillId;
    };
    $scope.questionChanged = function() {
      $scope.removeErrors();
    };
    $scope.removeSkill = function(skillId) {
      if ($scope.associatedSkillSummaries.length === 1) {
        AlertsService.addInfoMessage(
          'A question should be linked to at least one skill.');
        return;
      }
      returnModalObject.skillLinkageModificationsArray.push({
        id: skillId,
        task: 'remove'
      });
      $scope.associatedSkillSummaries =
        $scope.associatedSkillSummaries.filter(function(summary) {
          return summary.getId() !== skillId;
        });
    };
    $scope.undo = function() {
      $scope.associatedSkillSummaries = associatedSkillSummaries;
      returnModalObject.skillLinkageModificationsArray = [];
    };
    $scope.addSkill = function() {
      var skillsInSameTopicCount =
        groupedSkillSummaries.current.length;
      var sortedSkillSummaries =
        groupedSkillSummaries.current.concat(
          groupedSkillSummaries.others);
      $uibModal.open({
        templateUrl:
          UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/skill-selector/' +
            'select-skill-modal.template.html'),
        backdrop: true,
        resolve: {
          skillsInSameTopicCount: () => skillsInSameTopicCount,
          sortedSkillSummaries: () => sortedSkillSummaries,
        },
        controller: 'SelectSkillModalController'
      }).result.then(function(summary) {
        for (var idx in $scope.associatedSkillSummaries) {
          if (
            $scope.associatedSkillSummaries[idx].getId() ===
            summary.id) {
            AlertsService.addInfoMessage(
              'Skill already linked to question');
            return;
          }
        }
        $scope.associatedSkillSummaries.push(
          SkillSummaryObjectFactory.create(
            summary.id, summary.description));
        returnModalObject.skillLinkageModificationsArray.push({
          id: summary.id,
          task: 'add'
        });
      }, function() {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      });
    };

    // The saveAndCommit function is called when the contents of
    // a question is changed or the skill linkages are modified.
    // The user has to enter a commit message if the contents of
    // the question is edited but, if only the skill linkages are
    // modified then no commit message is required from the user
    // as there is already a default commit message present in the
    // backend for modification of skill linkages.
    $scope.saveAndCommit = function() {
      $scope.validationError = $scope.question.validate(
        $scope.misconceptionsBySkill);
      if ($scope.validationError) {
        return;
      }
      if (!StateEditorService.isCurrentSolutionValid()) {
        $scope.validationError =
          'The solution is invalid and does not ' +
          'correspond to a correct answer';
        return;
      }

      if (QuestionUndoRedoService.hasChanges()) {
        $uibModal.open({
          templateUrl:
                 UrlInterpolationService.getDirectiveTemplateUrl(
                   '/components/question-directives' +
                   '/modal-templates/' +
                   'question-editor-save-modal.template.html'),
          backdrop: true,
          controller: 'ConfirmOrCancelModalController'
        }).result.then(function(commitMessage) {
          returnModalObject.commitMessage = commitMessage;
          $uibModalInstance.close(returnModalObject);
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is
          // clicked. No further action is needed.
        });
      } else {
        $uibModalInstance.close(returnModalObject);
      }
    };
    $scope.isSaveAndCommitButtonDisabled = function() {
      return !(QuestionUndoRedoService.hasChanges() ||
          (returnModalObject.skillLinkageModificationsArray.length
          ) > 0);
    };


    $scope.done = function() {
      $scope.validationError = $scope.question.validate(
        $scope.misconceptionsBySkill);
      if ($scope.validationError) {
        return;
      }
      if (!StateEditorService.isCurrentSolutionValid()) {
        $scope.validationError =
          'The solution is invalid and does not ' +
          'correspond to a correct answer';
        return;
      }
      $uibModalInstance.close(returnModalObject);
    };
    // Checking if Question contains all requirement to enable
    // Save and Publish Question
    $scope.isSaveButtonDisabled = function() {
      return $scope.question.validate(
        $scope.misconceptionsBySkill);
    };

    $scope.cancel = function() {
      if (QuestionUndoRedoService.hasChanges()) {
        $uibModal.open({
          templateUrl:
            UrlInterpolationService.getDirectiveTemplateUrl(
              '/components/question-directives/modal-templates/' +
              'confirm-question-modal-exit-modal.directive.html'),
          backdrop: true,
          controller: 'ConfirmOrCancelModalController'
        }).result.then(function() {
          $uibModalInstance.dismiss('cancel');
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is
          // clicked. No further action is needed.
        });
      } else {
        $uibModalInstance.dismiss('cancel');
      }
    };
  }
]);
