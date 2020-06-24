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

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/skill/SkillDifficultyObjectFactory.ts');

angular.module('oppia').controller(
  'QuestionsListSelectSkillAndDifficultyModalController', [
    '$controller', '$scope', '$uibModalInstance',
    'SkillDifficultyObjectFactory', 'allSkillSummaries',
    'countOfSkillsToPrioritize', 'currentMode', 'linkedSkillsWithDifficulty',
    'skillIdToRubricsObject', 'DEFAULT_SKILL_DIFFICULTY',
    'MODE_SELECT_DIFFICULTY', 'MODE_SELECT_SKILL',
    function(
        $controller, $scope, $uibModalInstance,
        SkillDifficultyObjectFactory, allSkillSummaries,
        countOfSkillsToPrioritize, currentMode, linkedSkillsWithDifficulty,
        skillIdToRubricsObject, DEFAULT_SKILL_DIFFICULTY,
        MODE_SELECT_DIFFICULTY, MODE_SELECT_SKILL,) {
      $controller('ConfirmOrCancelModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });

      var init = function() {
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

        for (var idx in allSkillSummaries) {
          if (idx < countOfSkillsToPrioritize) {
            $scope.skillSummariesInitial.push(
              allSkillSummaries[idx]);
          } else {
            $scope.skillSummariesFinal.push(
              allSkillSummaries[idx]);
          }
        }
        $scope.skillIdToRubricsObject = skillIdToRubricsObject;
      };

      $scope.selectOrDeselectSkill = function(summary) {
        if (!summary.isSelected) {
          $scope.linkedSkillsWithDifficulty.push(
            SkillDifficultyObjectFactory.create(
              summary.id, summary.description,
              DEFAULT_SKILL_DIFFICULTY));
          summary.isSelected = true;
        } else {
          var idIndex = $scope.linkedSkillsWithDifficulty.map(
            function(linkedSkillWithDifficulty) {
              return linkedSkillWithDifficulty.getId();
            }).indexOf(summary.id);
          $scope.linkedSkillsWithDifficulty.splice(idIndex, 1);
          summary.isSelected = false;
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

      init();
    }
  ]);
