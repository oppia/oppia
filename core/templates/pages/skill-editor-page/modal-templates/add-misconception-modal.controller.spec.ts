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
 * @fileoverview Unit tests for AddMisconceptionModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

describe('Add Misconception Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var MisconceptionObjectFactory = null;
  var SkillEditorStateService = null;
  var SkillObjectFactory = null;

  var skillObject = null;

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
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
    var misconceptionDict2 = {
      id: '3',
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
    skillObject = SkillObjectFactory.createFromBackendDict({
      id: 'skill1',
      description: 'test description 1',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: '3',
      prerequisite_skill_ids: ['skill_1']
    });

    spyOn(SkillEditorStateService, 'getSkill').and.returnValue(skillObject);

    $scope = $rootScope.$new();
    $controller('AddMisconceptionModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.skill).toEqual(skillObject);
      expect($scope.misconceptionName).toBe('');
      expect($scope.misconceptionNotes).toBe('');
      expect($scope.misconceptionFeedback).toBe('');
      expect($scope.misconceptionMustBeAddressed).toBe(true);
    });

  it('should save misconception when closing the modal', function() {
    $scope.saveMisconception();
    expect($uibModalInstance.close).toHaveBeenCalledWith({
      misconception: MisconceptionObjectFactory.create(
        '3', '', '', '', true)
    });
  });
});
