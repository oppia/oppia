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
 * @fileoverview Controller for questions opportunities select skill and
 * difficulty modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/skill/skill-backend-api.service.ts');
require('domain/skill/SkillDifficultyObjectFactory.ts');
require('domain/skill/SkillObjectFactory.ts');
require('services/alerts.service.ts');

angular.module('oppia').controller(
  'QuestionsOpportunitiesSelectSkillAndDifficultyModalController', [
    '$controller', '$scope', '$uibModalInstance', 'AlertsService',
    'SkillBackendApiService', 'SkillDifficultyObjectFactory',
    'SkillObjectFactory', 'skillId', 'DEFAULT_SKILL_DIFFICULTY',
    'MODE_SELECT_DIFFICULTY',
    function($controller, $scope, $uibModalInstance, AlertsService,
        SkillBackendApiService, SkillDifficultyObjectFactory,
        SkillObjectFactory, skillId, DEFAULT_SKILL_DIFFICULTY,
        MODE_SELECT_DIFFICULTY) {
      $controller('ConfirmOrCancelModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
      const init = function() {
        $scope.instructionMessage = (
          'Select the skill(s) to link the question to:');
        $scope.currentMode = MODE_SELECT_DIFFICULTY;
        SkillBackendApiService.fetchSkill(skillId)
          .then(function(backendSkillObject) {
            $scope.skill =
              SkillObjectFactory.createFromBackendDict(
                backendSkillObject.skill);
            $scope.linkedSkillsWithDifficulty = [
              SkillDifficultyObjectFactory.create(
                skillId, $scope.skill.getDescription(),
                DEFAULT_SKILL_DIFFICULTY)
            ];
            $scope.skillIdToRubricsObject = {};
            $scope.skillIdToRubricsObject[skillId] =
              $scope.skill.getRubrics();
          }, function(error) {
            AlertsService.addWarning(
              `Error populating skill: ${error}.`);
          });
      };

      $scope.startQuestionCreation = function() {
        const result = {
          skill: $scope.skill,
          skillDifficulty:
            parseFloat(
              $scope.linkedSkillsWithDifficulty[0].getDifficulty())
        };
        $uibModalInstance.close(result);
      };

      init();
    }
  ]);
