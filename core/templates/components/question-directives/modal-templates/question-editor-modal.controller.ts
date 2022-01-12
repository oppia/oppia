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

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/image-local-storage.service.ts');
require('services/ngb-modal.service.ts');

import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmQuestionExitModalComponent } from './confirm-question-exit-modal.component';
import { QuestionEditorSaveModalComponent } from './question-editor-save-modal.component';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';

angular.module('oppia').controller('QuestionEditorModalController', [
  '$rootScope', '$scope', '$uibModalInstance', 'AlertsService',
  'ContextService', 'ImageLocalStorageService', 'NgbModal',
  'QuestionUndoRedoService', 'QuestionValidationService',
  'associatedSkillSummaries', 'canEditQuestion',
  'categorizedSkills', 'groupedSkillSummaries', 'misconceptionsBySkill',
  'newQuestionIsBeingCreated', 'question', 'questionId', 'questionStateData',
  'rubric', 'skillName', 'untriagedSkillSummaries', 'MAX_COMMIT_MESSAGE_LENGTH',
  function(
      $rootScope, $scope, $uibModalInstance, AlertsService,
      ContextService, ImageLocalStorageService, NgbModal,
      QuestionUndoRedoService, QuestionValidationService,
      associatedSkillSummaries, canEditQuestion,
      categorizedSkills, groupedSkillSummaries, misconceptionsBySkill,
      newQuestionIsBeingCreated, question, questionId, questionStateData,
      rubric, skillName, untriagedSkillSummaries, MAX_COMMIT_MESSAGE_LENGTH) {
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
    $scope.skillName = skillName;
    $scope.rubric = rubric;
    $scope.MAX_COMMIT_MESSAGE_LENGTH = MAX_COMMIT_MESSAGE_LENGTH;

    $scope.getSkillEditorUrl = function(skillId) {
      return '/skill_editor/' + skillId;
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

    $scope.getSkillLinkageModificationsArray = function() {
      return returnModalObject.skillLinkageModificationsArray;
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
      var allowSkillsFromOtherTopics = true;
      let modalRef: NgbModalRef = NgbModal.open(SelectSkillModalComponent, {
        backdrop: 'static',
        windowClass: 'skill-select-modal',
        size: 'xl'
      });
      modalRef.componentInstance.skillSummaries = sortedSkillSummaries;
      modalRef.componentInstance.skillsInSameTopicCount = (
        skillsInSameTopicCount);
      modalRef.componentInstance.categorizedSkills = categorizedSkills;
      modalRef.componentInstance.allowSkillsFromOtherTopics = (
        allowSkillsFromOtherTopics);
      modalRef.componentInstance.untriagedSkillSummaries = (
        untriagedSkillSummaries);
      modalRef.result.then(function(summary) {
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
          ShortSkillSummary.create(
            summary.id, summary.description));
        returnModalObject.skillLinkageModificationsArray.push({
          id: summary.id,
          task: 'add'
        });
      }, () => {
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
      if (!$scope.isQuestionValid()) {
        return;
      }

      if (QuestionUndoRedoService.hasChanges()) {
        NgbModal.open(QuestionEditorSaveModalComponent, {
          backdrop: 'static'
        }).result.then(function(commitMessage) {
          returnModalObject.commitMessage = commitMessage;
          $uibModalInstance.close(returnModalObject);
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$apply();
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
      return !(
        QuestionUndoRedoService.hasChanges() || (
          returnModalObject.skillLinkageModificationsArray.length) > 0) ||
          !$scope.isQuestionValid();
    };

    $scope.done = function() {
      if (!$scope.isQuestionValid()) {
        return;
      }
      ContextService.resetImageSaveDestination();
      $uibModalInstance.close(returnModalObject);
    };
    // Checking if Question contains all requirement to enable
    // Save and Publish Question.
    $scope.isQuestionValid = function() {
      return QuestionValidationService.isQuestionValid(
        $scope.question, $scope.misconceptionsBySkill);
    };

    $scope.cancel = function() {
      if (QuestionUndoRedoService.hasChanges()) {
        NgbModal.open(ConfirmQuestionExitModalComponent, {
          backdrop: true,
        }).result.then(function() {
          ContextService.resetImageSaveDestination();
          ImageLocalStorageService.flushStoredImagesData();
          $uibModalInstance.dismiss('cancel');
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$apply();
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is
          // clicked. No further action is needed.
        });
      } else {
        ContextService.resetImageSaveDestination();
        ImageLocalStorageService.flushStoredImagesData();
        $uibModalInstance.dismiss('cancel');
      }
    };
  }
]);
