// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { EventEmitter } from '@angular/core';
import { Rubric } from 'domain/skill/rubric.model';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { SkillBackendDict, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

/**
 * @fileoverview Unit tests for the skill rubric editor.
 */

describe('skillRubricsEditor', function() {
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  let skillEditorStateService: SkillEditorStateService = null;
  let skillObjectFactory: SkillObjectFactory = null;
  let skillUpdateService: SkillUpdateService = null;
  let windowDimensionsService: WindowDimensionsService = null;
  let mockEventEmitter = new EventEmitter();
  let skillBackendDict: SkillBackendDict;


  let sampleSkill = null;

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    skillEditorStateService = $injector.get('SkillEditorStateService');
    skillObjectFactory = $injector.get('SkillObjectFactory');
    skillUpdateService = $injector.get('SkillUpdateService');
    windowDimensionsService = $injector.get('WindowDimensionsService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    const skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {}
        }
      }
    };

    skillBackendDict = {
      id: '1',
      description: 'test description',
      misconceptions: [],
      rubrics: [],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: 6,
      superseding_skill_id: '2',
      all_questions_merged: false,
      prerequisite_skill_ids: ['skill_1']
    };
    sampleSkill = skillObjectFactory.createFromBackendDict(skillBackendDict);

    ctrl = $componentController('skillRubricsEditor', {
      $scope: $scope
    });
  }));

  afterEach(function() {
    // eslint-disable-next-line oppia/disallow-angularjs-properties
    $rootScope.$broadcast('$destroy');
  });

  describe('when user\'s window is narrow', () => {
    beforeEach(() => {
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
      spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
      spyOnProperty(skillEditorStateService, 'onSkillChange')
        .and.returnValue(mockEventEmitter);

      ctrl.$onInit();
    });

    it('should initialise component when user open skill rubrics editor',
      () => {
        expect($scope.skill).toEqual(sampleSkill);
        expect($scope.rubricsListIsShown).toBeFalse();
      });

    it('should fetch rubrics when skill changes', () => {
      $scope.skill._rubrics = [Rubric.createFromBackendDict({
        difficulty: 'Easy',
        explanations: ['explanation'],
      })];

      expect($scope.rubrics).toBeUndefined();

      mockEventEmitter.emit();

      expect($scope.rubrics).toEqual([Rubric.createFromBackendDict({
        difficulty: 'Easy',
        explanations: ['explanation'],
      })]);
    });

    it('should show toggle rubrics list when user\'s window is narrow', () => {
      expect($scope.rubricsListIsShown).toBeFalse();

      $scope.toggleRubricsList();

      expect($scope.rubricsListIsShown).toBeTrue();

      $scope.toggleRubricsList();

      expect($scope.rubricsListIsShown).toBeFalse();
    });

    it('should update skill rubrics when user saves', () => {
      spyOn(skillUpdateService, 'updateRubricForDifficulty');

      $scope.onSaveRubric('Easy', [
        'new explanation 1',
        'new explanation 2',
      ]);

      expect(skillUpdateService.updateRubricForDifficulty).toHaveBeenCalledWith(
        sampleSkill, 'Easy', [
          'new explanation 1',
          'new explanation 2',
        ]);
    });
  });

  describe('when user\'s window is not narrow', () => {
    beforeEach(() => {
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
      spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);

      ctrl.$onInit();
    });

    it('should display rubrics list when editor loads', () => {
      expect($scope.skill).toEqual(sampleSkill);
      expect($scope.rubricsListIsShown).toBeTrue();
    });

    it('should not display toggle option when user has a wide screen', () => {
      expect($scope.rubricsListIsShown).toBeTrue();

      $scope.toggleRubricsList();

      expect($scope.rubricsListIsShown).toBeTrue();
    });
  });
});
