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
 * @fileoverview Controller for questions list select skill and
 * difficulty modal.
 */
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

angular.module('oppia').controller(
  'QuestionsListSelectSkillAndDifficultyModalController', [
    '$controller', '$scope', '$uibModalInstance', 'allSkillSummaries',
    'countOfSkillsToPrioritize', 'currentMode', 'linkedSkillsWithDifficulty',
    'skillIdToRubricsObject', 'DEFAULT_SKILL_DIFFICULTY',
    'MODE_SELECT_DIFFICULTY', 'MODE_SELECT_SKILL',
    function(
        $controller, $scope, $uibModalInstance, allSkillSummaries,
        countOfSkillsToPrioritize, currentMode, linkedSkillsWithDifficulty,
        skillIdToRubricsObject, DEFAULT_SKILL_DIFFICULTY,
        MODE_SELECT_DIFFICULTY, MODE_SELECT_SKILL,) {
      $controller('ConfirmOrCancelModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });

      $scope.countOfSkillsToPrioritize =
          countOfSkillsToPrioritize;
      $scope.instructionMessage = (
        'Select the skill(s) to link the question to:');
      $scope.currentMode = currentMode;
      $scope.linkedSkillsWithDifficulty =
        linkedSkillsWithDifficulty;
      $scope.skillSummaries = allSkillSummaries;
      $scope.skillSummariesInitial = [];
      $scope.skillSummariesFinal = [];
      let selectedSkills = [];
      
      allSkillSummaries.forEach(idx => {
        if (idx < countOfSkillsToPrioritize) {
          $scope.skillSummariesInitial.push(
            allSkillSummaries[idx]);
        } else {
          $scope.skillSummariesFinal.push(
            allSkillSummaries[idx]);
        }        
      });
      $scope.skillIdToRubricsObject = skillIdToRubricsObject;

      $scope.isSkillSelected = function(skillId) {
        return selectedSkills.includes(skillId);
      };

      $scope.selectOrDeselectSkill = function(summary) {
        if (!$scope.isSkillSelected(summary.id)) {
          $scope.linkedSkillsWithDifficulty.push(
            SkillDifficulty.create(
              summary.id, summary.description,
              DEFAULT_SKILL_DIFFICULTY));
          selectedSkills.push(summary.id);
        } else {
          var idIndex = $scope.linkedSkillsWithDifficulty.map(
            function(linkedSkillWithDifficulty) {
              return linkedSkillWithDifficulty.getId();
            }).indexOf(summary.id);
          $scope.linkedSkillsWithDifficulty.splice(idIndex, 1);
          var index = selectedSkills.indexOf(summary.id);
          selectedSkills.splice(index, 1);
        }
      };

      $scope.goToSelectSkillView = function() {
        $scope.currentMode = MODE_SELECT_SKILL;
      };

      $scope.goToNextStep = function() {
        $scope.currentMode = MODE_SELECT_DIFFICULTY;
      };

      $scope.startQuestionCreation = function() {
        $uibModalInstance.close($scope.linkedSkillsWithDifficulty);
      };
    }
  ]);
