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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { waitForAsync } from '@angular/core/testing';

class MockReaderObject {
  result = null;
  onload = null;
  constructor() {
    this.onload = () => {
      return 'Fake onload executed';
    };
  }
  readAsDataURL(file) {
    this.onload();
    return 'The file is loaded';
  }
}

describe(
  'Questions Opportunities Select Skill And Difficulty Modal Controller',
  function() {
    var $q = null;
    var $scope = null;
    var $uibModalInstance = null;
    var alertsService = null;
    var SkillBackendApiService = null;
    var skillObjectFactory = null;
    var extractImageFilenamesFromModelService = null;
    var assetsBackendApiService = null;

    var skillId = 'skill_1';
    var skill = null;

    beforeEach(angular.mock.module('oppia'));

    importAllAngularServices();

    describe('when fetching skill successfully', function() {
      beforeEach(waitForAsync(() => angular.mock.inject(
        function($injector, $controller) {
          var $rootScope = $injector.get('$rootScope');
          SkillBackendApiService = $injector.get('SkillBackendApiService');
          alertsService = $injector.get('AlertsService');
          skillObjectFactory = $injector.get('SkillObjectFactory');
          var skillDifficulties = $injector.get('SKILL_DIFFICULTIES');
          extractImageFilenamesFromModelService = $injector.get(
            'ExtractImageFilenamesFromModelService');
          assetsBackendApiService = $injector.get('AssetsBackendApiService');

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

          spyOn(SkillBackendApiService, 'fetchSkillAsync').and.returnValue(
            Promise.resolve({
              skill: skillObjectFactory.createFromBackendDict(skill)
            }));
          let mockImageFile = new File(['dummyImg.png'], 'dummyImg.png', {
            type: 'image/png',
          });
          spyOn(
            extractImageFilenamesFromModelService,
            'getImageFilenamesInSkill').and.returnValue(['dummyImg.png']);
          spyOn(assetsBackendApiService, 'fetchFile').and.returnValue(
            Promise.resolve(mockImageFile));
          // This throws "Argument of type 'MockReaderObject' is not assignable
          // to parameter of type 'FileReader'.". We need to suppress this error
          // because 'FileReader' has around 15 more properties. We have only
          // defined the properties we need in 'MockReaderObject'.
          // @ts-expect-error
          spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());

          $scope = $rootScope.$new();
          $controller(
            'QuestionsOpportunitiesSelectSkillAndDifficultyModalController', {
              $scope: $scope,
              AlertsService: alertsService,
              SkillObjectFactory: skillObjectFactory,
              $uibModalInstance: $uibModalInstance,
              skillId: skillId,
            });
          $scope.$apply();
        })));

      it('should initialize $scope properties after controller is' +
        ' initialized', function() {
        expect($scope.skill).toEqual(skillObjectFactory.createFromBackendDict(
          skill));
        expect($scope.linkedSkillsWithDifficulty).toEqual(
          [SkillDifficulty.create(
            skillId, 'Skill 1 description', 0.3)]);
        expect($scope.skillIdToRubricsObject[skillId].length).toBe(1);
      });

      it('should create a question and select its difficulty when closing' +
        ' the modal', function() {
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
        alertsService = $injector.get('AlertsService');
        SkillBackendApiService = $injector.get('SkillBackendApiService');

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        spyOn(SkillBackendApiService, 'fetchSkillAsync').and.returnValue(
          $q.reject('It was not possible to fetch the skill'));

        $scope = $rootScope.$new();
        $controller(
          'QuestionsOpportunitiesSelectSkillAndDifficultyModalController', {
            $scope: $scope,
            AlertsService: alertsService,
            SkillObjectFactory: skillObjectFactory,
            $uibModalInstance: $uibModalInstance,
            skillId: skillId,
          });
      }));

      it('should shows a warning error', function() {
        var addWarningSpy = spyOn(alertsService, 'addWarning');
        $scope.$apply();

        expect(addWarningSpy.calls.allArgs()[0]).toEqual(
          ['Error populating skill: It was not possible to fetch the skill.']);
      });
    });
  });
