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

import { TestBed } from '@angular/core/testing';
import { ShortSkillSummaryObjectFactory } from
  'domain/skill/ShortSkillSummaryObjectFactory';
import { SkillDifficultyObjectFactory } from
  'domain/skill/SkillDifficultyObjectFactory';

describe('Questions List Select Skill And Difficulty Modal Controller',
  function() {
    var $scope = null;
    var $uibModalInstance = null;
    var skillDifficultyObjectFactory = null;
    var skillSummaryObjectFactory = null;

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

    beforeEach(function() {
      TestBed.configureTestingModule({
        providers: [
          SkillDifficultyObjectFactory,
          ShortSkillSummaryObjectFactory
        ]
      });

      skillDifficultyObjectFactory = TestBed.get(SkillDifficultyObjectFactory);
      skillSummaryObjectFactory = TestBed.get(ShortSkillSummaryObjectFactory);
    });

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      allSkillSummaries.map(summary => (
        skillSummaryObjectFactory.create(summary.id, summary.description)));

      $scope = $rootScope.$new();
      $controller('QuestionsListSelectSkillAndDifficultyModalController', {
        $scope: $scope,
        SkillDifficultyObjectFactory: skillDifficultyObjectFactory,
        $uibModalInstance: $uibModalInstance,
        allSkillSummaries: allSkillSummaries,
        countOfSkillsToPrioritize: countOfSkillsToPrioritize,
        currentMode: currentMode,
        linkedSkillsWithDifficulty: linkedSkillsWithDifficulty,
        skillIdToRubricsObject: skillIdToRubricsObject
      });
    }));

    it('should evaluate initialized properties', function() {
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

    it('should select and deselect a skill', function() {
      expect($scope.linkedSkillsWithDifficulty.length).toBe(0);
      var summary = allSkillSummaries[0];
      $scope.selectOrDeselectSkill(summary);

      // @ts-ignore isSelected is not a property from SkillSummaryObjectFactory.
      expect(summary.isSelected).toBe(true);
      expect($scope.linkedSkillsWithDifficulty.length).toBe(1);

      $scope.selectOrDeselectSkill(summary);
      // @ts-ignore isSelected is not a property from SkillSummaryObjectFactory.
      expect(summary.isSelected).toBe(false);
      expect($scope.linkedSkillsWithDifficulty.length).toBe(0);
    });

    it('should change current mode when changing views', function() {
      expect($scope.currentMode).toBe(currentMode);

      $scope.goToSelectSkillView();
      expect($scope.currentMode).toBe('MODE_SELECT_SKILL');

      $scope.goToNextStep();
      expect($scope.currentMode).toBe('MODE_SELECT_DIFFICULTY');
    });

    it('should close modal when starting to create question', function() {
      var summary = allSkillSummaries[1];
      $scope.selectOrDeselectSkill(summary);

      $scope.startQuestionCreation();

      expect($uibModalInstance.close).toHaveBeenCalledWith([
        skillDifficultyObjectFactory.create(
          allSkillSummaries[1].id, allSkillSummaries[1].description, 0.3)
      ]);

      // Remove summary to not affect other specs.
      $scope.selectOrDeselectSkill(summary);
    });
  });
