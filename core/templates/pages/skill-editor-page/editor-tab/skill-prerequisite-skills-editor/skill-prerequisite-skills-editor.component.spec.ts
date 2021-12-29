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
 * @fileoverview Unit tests for the skill editor main tab directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { AlertsService } from 'services/alerts.service';
// ^^^ This block is to be removed.

describe('Skill editor main tab directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let ngbModal: NgbModal = null;
  let skillEditorStateService: SkillEditorStateService = null;
  let skillObjectFactory: SkillObjectFactory = null;
  let topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService = null;
  let skillUpdateService: SkillUpdateService = null;
  let alertsService: AlertsService = null;

  let sampleSkill = null;
  let skillSummaryDict = null;
  let topicAndSkillsDashboardDataBackendDict = null;
  let windowDimensionsService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });


  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ngbModal = TestBed.inject(NgbModal);

    skillEditorStateService = $injector.get('SkillEditorStateService');
    skillObjectFactory = $injector.get('SkillObjectFactory');
    topicsAndSkillsDashboardBackendApiService = $injector.get(
      'TopicsAndSkillsDashboardBackendApiService');
    skillUpdateService = $injector.get('SkillUpdateService');
    windowDimensionsService = $injector.get(
      'WindowDimensionsService');
    alertsService = $injector.get('AlertsService');

    let misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    let rubricDict = {
      difficulty: 'medium',
      explanations: ['explanation']
    };

    let skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {}
      }
    };

    sampleSkill = skillObjectFactory.createFromBackendDict({
      id: 'skill1',
      description: 'test description 1',
      misconceptions: [misconceptionDict1],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: 3,
      prerequisite_skill_ids: ['skill_1'],
      superseding_skill_id: 'skill0',
      all_questions_merged: true
    });

    skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      worked_examples_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193
    };

    topicAndSkillsDashboardDataBackendDict = {
      all_classroom_names: [
        'math'
      ],
      categorized_skills_dict: {
        'Empty Topic': {
          uncategorized: []
        },
        'Dummy Topic 1': {
          uncategorized: [
            {
              skill_id: 'BBB6dzfb5pPt',
              skill_description: 'Dummy Skill 1'
            }
          ],
          'Dummy Subtopic Title': [
            {
              skill_id: 'D1FdmljJNXdt',
              skill_description: 'Dummy Skill 2'
            }
          ]
        }
      },
      topic_summary_dicts: [
        {
          version: 1,
          url_fragment: 'empty-topic',
          language_code: 'en',
          description: 'description',
          uncategorized_skill_count: 0,
          total_published_node_count: 0,
          can_edit_topic: true,
          is_published: false,
          id: 'HLEn0XQiV9XE',
          topic_model_created_on: 1623851496406.576,
          subtopic_count: 0,
          thumbnail_bg_color: '#FFFFFF',
          canonical_story_count: 0,
          name: 'Empty Topic',
          classroom: 'math',
          total_skill_count: 0,
          additional_story_count: 0,
          topic_model_last_updated: 1623851496406.582,
          thumbnail_filename: 'thumbnail_filename'
        },
        {
          version: 3,
          url_fragment: 'dummy-topic-one',
          language_code: 'en',
          description: 'description',
          uncategorized_skill_count: 1,
          total_published_node_count: 3,
          can_edit_topic: true,
          is_published: false,
          id: 'JS7lmbdZRoPc',
          topic_model_created_on: 1623851496107.91,
          subtopic_count: 1,
          thumbnail_bg_color: '#FFFFFF',
          canonical_story_count: 1,
          name: 'Dummy Topic 1',
          classroom: 'math',
          total_skill_count: 2,
          additional_story_count: 0,
          topic_model_last_updated: 1623851737518.369,
          thumbnail_filename: 'thumbnail_filename'
        }
      ],
      can_delete_skill: true,
      untriaged_skill_summary_dicts: [
        {
          version: 1,
          language_code: 'en',
          description: 'Dummy Skill 3',
          skill_model_created_on: 1623851495022.93,
          skill_model_last_updated: 1623851495022.942,
          worked_examples_count: 0,
          id: '4P77sLaU14DE',
          misconception_count: 0
        }
      ],
      total_skill_count: 3,
      can_create_topic: true,
      can_create_skill: true,
      mergeable_skill_summary_dicts: [
        {
          version: 1,
          language_code: 'en',
          description: 'Dummy Skill 1',
          skill_model_created_on: 1623851493737.796,
          skill_model_last_updated: 1623851493737.808,
          worked_examples_count: 0,
          id: 'BBB6dzfb5pPt',
          misconception_count: 0
        },
        {
          version: 1,
          language_code: 'en',
          description: 'Dummy Skill 2',
          skill_model_created_on: 1623851494780.516,
          skill_model_last_updated: 1623851494780.529,
          worked_examples_count: 0,
          id: 'D1FdmljJNXdt',
          misconception_count: 0
        }
      ],
      can_delete_topic: true,
    };

    ctrl = $componentController('skillPrerequisiteSkillsEditor', {
      $rootScope: $scope,
      $scope: $scope,
      NgbModal: ngbModal
    });
    ctrl.$onInit();
  }));

  it('should fetch skill when initialized', function() {
    spyOn(
      skillEditorStateService, 'getGroupedSkillSummaries').and.returnValue({
      current: [],
      others: [skillSummaryDict]
    });
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(topicsAndSkillsDashboardBackendApiService, 'fetchDashboardDataAsync')
      .and.resolveTo(topicAndSkillsDashboardDataBackendDict);
    ctrl.$onInit();

    expect($scope.skill).toEqual(sampleSkill);
  });

  it('should remove skill id when calling \'removeSkillId\'', function() {
    let deleteSpy = spyOn(skillUpdateService, 'deletePrerequisiteSkill')
      .and.returnValue(null);

    $scope.removeSkillId();

    expect(deleteSpy).toHaveBeenCalled();
  });

  it('should return skill editor url when calling ' +
    '\'getSkillEditorUrl\'', function() {
    let result = $scope.getSkillEditorUrl('skillId');

    expect(result).toBe('/skill_editor/skillId');
  });

  it('should toggle prerequisite skills ' +
    '\'togglePrerequisiteSkills\'', function() {
    $scope.prerequisiteSkillsAreShown = false;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    $scope.togglePrerequisiteSkills();
    expect($scope.prerequisiteSkillsAreShown).toBe(true);

    $scope.togglePrerequisiteSkills();
    expect($scope.prerequisiteSkillsAreShown).toBe(false);
  });

  describe('while adding a skill', function() {
    it('should show info message if we try ' +
      'to add a prerequisite skill to itself', fakeAsync(function() {
      spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: {},
          result: Promise.resolve({
            id: 'skill1'
          })
        }) as NgbModalRef;
      });
      let alertsSpy = spyOn(alertsService, 'addInfoMessage')
        .and.returnValue(null);

      $scope.skill = sampleSkill;
      $scope.addSkill();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'A skill cannot be a prerequisite of itself', 5000);
    }));

    it('should show info message if we try to add a prerequisite ' +
      'skill which has already been added', fakeAsync(function() {
      spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: {},
          result: Promise.resolve({
            id: 'skill_1'
          })
        }) as NgbModalRef;
      });
      let alertsSpy = spyOn(alertsService, 'addInfoMessage')
        .and.returnValue(null);

      $scope.skill = sampleSkill;
      $scope.addSkill();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Given skill is already a prerequisite skill', 5000);
    }));

    it('should add skill sucessfully when calling ' +
      '\'addSkill\'', fakeAsync(function() {
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: {},
          result: Promise.resolve({
            id: 'skillId'
          })
        }) as NgbModalRef;
      });
      $scope.skill = sampleSkill;
      $scope.addSkill();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));
  });
});
