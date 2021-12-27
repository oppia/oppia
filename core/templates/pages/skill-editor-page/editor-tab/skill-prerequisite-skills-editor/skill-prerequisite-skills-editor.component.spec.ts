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


/**
 * @fileoverview Unit tests for the skill editor main tab component.
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { Skill, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { AlertsService } from 'services/alerts.service';
import { SkillPrerequisiteSkillsEditorComponent } from './skill-prerequisite-skills-editor.component';
import { SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Skill editor main tab component', () => {
  let component: SkillPrerequisiteSkillsEditorComponent;
  let fixture: ComponentFixture<SkillPrerequisiteSkillsEditorComponent>;
  let ngbModal: NgbModal;
  let skillEditorStateService: SkillEditorStateService;
  let skillObjectFactory: SkillObjectFactory;
  let topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService;
  let skillUpdateService: SkillUpdateService;
  let windowDimensionsService: WindowDimensionsService;
  let alertsService: AlertsService;

  let sampleSkill: Skill = null;
  let skillSummaryDict: SkillSummaryBackendDict = null;
  let topicAndSkillsDashboardDataBackendDict = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillPrerequisiteSkillsEditorComponent],
      providers: [
        SkillUpdateService,
        SkillEditorStateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });


  beforeEach(() => {
    fixture = TestBed.createComponent(SkillPrerequisiteSkillsEditorComponent);
    component = fixture.componentInstance;

    skillUpdateService = TestBed.inject(SkillUpdateService);
    ngbModal = TestBed.inject(NgbModal);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    alertsService = TestBed.inject(AlertsService);
    topicsAndSkillsDashboardBackendApiService = TestBed.inject(
      TopicsAndSkillsDashboardBackendApiService);

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
    fixture.detectChanges();
  });

  it('should fetch skill when initialized', () => {
    spyOn(
      skillEditorStateService, 'getGroupedSkillSummaries').and.returnValue({
      current: [],
      others: [skillSummaryDict]
    });
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(topicsAndSkillsDashboardBackendApiService, 'fetchDashboardDataAsync')
      .and.resolveTo(topicAndSkillsDashboardDataBackendDict);
    component.ngOnInit();

    expect(component.skill).toEqual(sampleSkill);
  });

  it('should remove skill id when calling \'removeSkillId\'', () => {
    let deleteSpy = spyOn(skillUpdateService, 'deletePrerequisiteSkill')
      .and.returnValue(null);

    component.removeSkillId('BBB6dzfb5pPt');

    expect(deleteSpy).toHaveBeenCalled();
  });

  it('should return skill editor url when calling ' +
    '\'getSkillEditorUrl\'', () => {
    let result = component.getSkillEditorUrl('skillId');

    expect(result).toBe('/skill_editor/skillId');
  });

  it('should toggle prerequisite skills ' +
    '\'togglePrerequisiteSkills\'', () => {
    component.prerequisiteSkillsAreShown = false;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    component.togglePrerequisiteSkills();
    expect(component.prerequisiteSkillsAreShown).toBe(true);

    component.togglePrerequisiteSkills();
    expect(component.prerequisiteSkillsAreShown).toBe(false);
  });

  describe('while adding a skill', () => {
    it('should show info message if we try ' +
      'to add a prerequisite skill to itself', fakeAsync(() => {
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

      component.skill = sampleSkill;
      component.addSkill();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'A skill cannot be a prerequisite of itself', 5000);
    }));

    it('should show info message if we try to add a prerequisite ' +
      'skill which has already been added', fakeAsync(() => {
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

      component.skill = sampleSkill;
      component.addSkill();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Given skill is already a prerequisite skill', 5000);
    }));

    it('should add skill sucessfully when calling ' +
      '\'addSkill\'', fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: {},
          result: Promise.resolve({
            id: 'skillId'
          })
        }) as NgbModalRef;
      });
      component.skill = sampleSkill;
      component.addSkill();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));
  });
});
