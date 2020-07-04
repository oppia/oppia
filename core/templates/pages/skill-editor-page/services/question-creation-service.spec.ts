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
 * @fileoverview Unit tests for QuestionCreationService.
 */


// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Question Creation Service', function() {
  var $rootScope = null;
  var qcs = null;
  var SkillEditorStateService = null;
  var $httpBackend = null;
  var SkillDifficultyObjectFactory = null;
  var QuestionObjectFactory = null;
  var EditableQuestionBackendApiService = null;
  var SkillBackendApiService = null;
  var $uibModal = null;

  var SkillObjectFactory = null;
  var $location = null;
  var skillSummaryDict = {
    id: 'skillId1',
    description: 'description1',
    language_code: 'en',
    version: 1,
    misconception_count: 3,
    worked_examples_count: 3,
    skill_model_created_on: 1593138898626.193,
    skill_model_last_updated: 1593138898626.193
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    qcs = $injector.get('QuestionCreationService');
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    SkillDifficultyObjectFactory = $injector.get(
      'SkillDifficultyObjectFactory');
    SkillBackendApiService = $injector.get('SkillBackendApiService');
    EditableQuestionBackendApiService = $injector.get(
      'EditableQuestionBackendApiService');
    $uibModal = $injector.get('$uibModal');
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

    spyOn(SkillBackendApiService, 'fetchSkill').and.returnValue({
      skill: skillBackendDict,
      topicName: 'topic1',
      subtopicName: 'subtopic2',
    });
    spyOn(SkillBackendApiService, 'fetchMultiSkills').and.returnValue(
      Promise.resolve([skillBackendDict]));
    spyOn(SkillEditorStateService, 'getGroupedSkillSummaries').and.returnValue({
      current: [],
      others: [skillSummaryDict]
    });

    $httpBackend = $injector.get('$httpBackend');
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');

    $rootScope = $injector.get('$rootScope');
    $location = $injector.get('$location');
  }));

  it('should create question', function() {
    var skillDiff = SkillDifficultyObjectFactory.create(
      'skillId1', 'description', 'Easy');
    var modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: Promise.resolve([skillDiff])});
    qcs.createQuestion();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should return difficulty strings', function() {
    expect(qcs.getDifficultyString(0.3)).toEqual('Easy');
    expect(qcs.getDifficultyString(0.6)).toEqual('Medium');
    expect(qcs.getDifficultyString(1)).toEqual('Hard');
  });

  it('should open question editor modal', function() {
    qcs.createQuestion();
    qcs.initializeNewQuestionCreation();

    var modalSpy = spyOn($uibModal, 'open').and.returnValue({
      result: Promise.resolve()});
    qcs.openQuestionEditor(0.3);
    expect(modalSpy).toHaveBeenCalled();
  });
});
