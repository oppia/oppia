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
 * @fileoverview Unit tests for
 * QuestionsListSelectSkillAndDifficultyModalController.
 */

import { ShortSkillSummary } from
  'domain/skill/short-skill-summary.model';
import { SkillDifficulty } from
  'domain/skill/skill-difficulty.model';

describe('Questions List Select Skill And Difficulty Modal Controller',
  function() {
    var $scope = null;
    var $uibModalInstance = null;

    var allSkillSummaries = [{
      id: '1',
      description: 'Skill 1 description'
    }, {
      id: '2',
      description: 'Skill 2 description'
    }, {
      id: '3',
      description: 'Skill 3 description'
    }];
    var countOfSkillsToPrioritize = 2;
    var currentMode = null;
    var linkedSkillsWithDifficulty = [];
    var skillIdToRubricsObject = {};

    beforeEach(angular.mock.module('oppia'));

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      allSkillSummaries.map(summary => (
        ShortSkillSummary.create(summary.id, summary.description)));

      $scope = $rootScope.$new();
      $controller('QuestionsListSelectSkillAndDifficultyModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        allSkillSummaries: allSkillSummaries,
        countOfSkillsToPrioritize: countOfSkillsToPrioritize,
        currentMode: currentMode,
        linkedSkillsWithDifficulty: linkedSkillsWithDifficulty,
        skillIdToRubricsObject: skillIdToRubricsObject
      });
    }));

    it('should initialize $scope properties after controller' +
      ' is initialized', function() {
      expect($scope.countOfSkillsToPrioritize).toBe(countOfSkillsToPrioritize);
      expect($scope.instructionMessage).toBe(
        'Select the skill(s) to link the question to:');
      expect($scope.currentMode).toBe(currentMode);
      expect($scope.linkedSkillsWithDifficulty).toEqual(
        linkedSkillsWithDifficulty);
      expect($scope.skillSummaries).toEqual(allSkillSummaries);
      expect($scope.skillSummariesInitial.length).toBe(2);
      expect($scope.skillSummariesFinal.length).toBe(1);
      expect($scope.skillIdToRubricsObject).toEqual(skillIdToRubricsObject);
    });

    it('should toggle skill selection when clicking on it', function() {
      expect($scope.linkedSkillsWithDifficulty.length).toBe(0);
      var summary = allSkillSummaries[0];
      $scope.selectOrDeselectSkill(summary);

      expect($scope.isSkillSelected(summary.id)).toBe(true);
      expect($scope.linkedSkillsWithDifficulty.length).toBe(1);

      $scope.selectOrDeselectSkill(summary);
      expect($scope.isSkillSelected(summary.id)).toBe(false);
      expect($scope.linkedSkillsWithDifficulty.length).toBe(0);
    });

    it('should change view mode to select skill when changing view',
      function() {
        expect($scope.currentMode).toBe(currentMode);

        $scope.goToSelectSkillView();
        expect($scope.currentMode).toBe('MODE_SELECT_SKILL');
      });

    it('should change view mode to select difficulty after selecting a skill',
      function() {
        expect($scope.currentMode).toBe(currentMode);

        $scope.goToNextStep();
        expect($scope.currentMode).toBe('MODE_SELECT_DIFFICULTY');
      });

    it('should select skill and its difficulty proerly when closing the modal',
      function() {
        var summary = allSkillSummaries[1];
        $scope.selectOrDeselectSkill(summary);

        $scope.startQuestionCreation();

        expect($uibModalInstance.close).toHaveBeenCalledWith([
          SkillDifficulty.create(
            allSkillSummaries[1].id, allSkillSummaries[1].description, 0.3)
        ]);

        // Remove summary to not affect other specs.
        $scope.selectOrDeselectSkill(summary);
      });
  });
