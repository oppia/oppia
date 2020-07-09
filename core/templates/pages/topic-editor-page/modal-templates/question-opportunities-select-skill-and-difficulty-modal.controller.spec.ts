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
 * QuestionsOpportunitiesSelectSkillAndDifficultyModalController.
 */

import { TestBed } from '@angular/core/testing';
import { AlertsService } from 'services/alerts.service';
import { SkillDifficultyObjectFactory } from
  'domain/skill/SkillDifficultyObjectFactory';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';

describe(
  'Questions Opportunities Select Skill And Difficulty Modal Controller',
  function() {
    var $q = null;
    var $scope = null;
    var $uibModalInstance = null;
    var alertsService = null;
    var SkillBackendApiService = null;
    var skillDifficultyObjectFactory = null;
    var skillObjectFactory = null;

    var skillId = 'skill_1';
    var skill = null;

    beforeEach(angular.mock.module('oppia'));

    beforeEach(function() {
      alertsService = TestBed.get(AlertsService);
      skillDifficultyObjectFactory = TestBed.get(SkillDifficultyObjectFactory);
      skillObjectFactory = TestBed.get(SkillObjectFactory);
    });

    describe('when fetching skill successfully', function() {
      beforeEach(angular.mock.inject(function($injector, $controller) {
        $q = $injector.get('$q');
        var $rootScope = $injector.get('$rootScope');
        SkillBackendApiService = $injector.get('SkillBackendApiService');
        var skillDifficulties = $injector.get('SKILL_DIFFICULTIES');

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        var misconceptionDict1 = {
          id: '2',
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true
        };
        var rubricDict = {
          difficulty: skillDifficulties[0],
          explanations: ['explanation']
        };
        var skillContentsDict = {
          explanation: {
            html: 'test explanation',
            content_id: 'explanation',
          },
          worked_examples: [],
          recorded_voiceovers: {
            voiceovers_mapping: {}
          }
        };
        skill = {
          id: skillId,
          description: 'Skill 1 description',
          misconceptions: [misconceptionDict1],
          rubrics: [rubricDict],
          skill_contents: skillContentsDict,
          language_code: 'en',
          version: 1,
          next_misconception_id: 3,
          prerequisite_skill_ids: []
        };

        spyOn(SkillBackendApiService, 'fetchSkill').and.returnValue(
          $q.resolve({ skill: skill}));

        $scope = $rootScope.$new();
        $controller(
          'QuestionsOpportunitiesSelectSkillAndDifficultyModalController', {
            $scope: $scope,
            AlertsService: alertsService,
            SkillDifficultyObjectFactory: skillDifficultyObjectFactory,
            SkillObjectFactory: skillObjectFactory,
            $uibModalInstance: $uibModalInstance,
            skillId: skillId,
          });
        $scope.$apply();
      }));

      it('should evaluate initialized properties', function() {
        expect($scope.skill).toEqual(skillObjectFactory.createFromBackendDict(
          skill));
        expect($scope.linkedSkillsWithDifficulty).toEqual(
          [skillDifficultyObjectFactory.create(
            skillId, 'Skill 1 description', 0.3)]);
        expect($scope.skillIdToRubricsObject[skillId].length).toBe(1);
      });

      it('should close modal on creating a question', function() {
        $scope.startQuestionCreation();

        expect($uibModalInstance.close).toHaveBeenCalledWith({
          skill: skillObjectFactory.createFromBackendDict(skill),
          skillDifficulty: 0.3
        });
      });
    });

    describe('when fetching skill fails', function() {
      beforeEach(angular.mock.inject(function($injector, $controller) {
        $q = $injector.get('$q');
        var $rootScope = $injector.get('$rootScope');
        SkillBackendApiService = $injector.get('SkillBackendApiService');

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        spyOn(SkillBackendApiService, 'fetchSkill').and.returnValue(
          $q.reject('It was not possible to fetch the skill'));

        $scope = $rootScope.$new();
        $controller(
          'QuestionsOpportunitiesSelectSkillAndDifficultyModalController', {
            $scope: $scope,
            AlertsService: alertsService,
            SkillDifficultyObjectFactory: skillDifficultyObjectFactory,
            SkillObjectFactory: skillObjectFactory,
            $uibModalInstance: $uibModalInstance,
            skillId: skillId,
          });
      }));

      it('should add a warning message', function() {
        var addWarningSpy = spyOn(alertsService, 'addWarning');
        $scope.$apply();

        expect(<any>addWarningSpy.calls.allArgs()[0]).toEqual(
          ['Error populating skill: It was not possible to fetch the skill.']);
      });
    });
  });
