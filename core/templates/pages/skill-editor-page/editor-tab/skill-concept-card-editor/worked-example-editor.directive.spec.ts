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
 * @fileoverview Unit tests for the skill concept card editor directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { EventEmitter } from '@angular/core';

describe('Skill concept card editor directive', function() {
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  var $uibModal = null;
  var directive = null;
  var QuestionCreationService = null;
  var SkillUpdateService = null;
  var $q = null;
  var SkillEditorStateService = null;
  var WindowDimensionsService = null;
  var SkillObjectFactory = null;
  var misconceptionDict = {
    feedback: 'feedback',
    id: 'id1',
    must_be_addressed: false,
    name: 'name1',
    notes: 'notes1'
  };
  var rubricDict = {
    difficulty: 'Easy',
    explanations: ['Easy']
  };

  var conceptCardDict = {
    explanation: {content_id: 'content',
      html: 'html_data'},
    worked_examples: [],
    recorded_voiceovers: {
      voiceovers_mapping: {
        explanation: {},
        worked_example_1: {},
        worked_example_2: {}
      }
    } };
  var skillBackendDict = {
    all_questions_merged: true,
    description: 'description1',
    id: 'skillId1',
    language_code: 'en',
    misconceptions: [misconceptionDict],
    next_misconception_id: '2',
    prerequisite_skill_ids: [],
    rubrics: [rubricDict],
    skill_contents: conceptCardDict,
    superseding_skill_id: 'skillId2',
    version: 2,
  };
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $scope = $rootScope.$new();
    directive = $injector.get('workedExampleEditorDirective')[0];
    QuestionCreationService = $injector.get('QuestionCreationService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    SkillUpdateService = $injector.get('SkillUpdateService');
    SkillEditorStateService = $injector.get('SkillEditorStateService');

    var skillObject = SkillObjectFactory.createFromBackendDict(
      skillBackendDict);
    let skillChangeEventEmitter = new EventEmitter();

    spyOn(
      SkillEditorStateService, 'getSkill').and.callFake(function() {
      skillChangeEventEmitter.emit();
      return skillObject;
    });
    spyOnProperty(
      SkillEditorStateService, 'onSkillChange').and.returnValue(
      skillChangeEventEmitter);
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  it('should initialize the variables', function() {
    expect($scope.skillEditorCardIsShown).toEqual(true);
    expect($scope.isEditable()).toEqual(true);
    expect($scope.getStaticImageUrl('/test.png')).toBe(
      '/assets/images/test.png');
  });
});
