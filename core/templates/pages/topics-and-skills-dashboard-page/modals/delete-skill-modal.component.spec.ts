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
 * @fileoverview Unit tests for Delete Skill Modal.
 */

import { ComponentFixture, fakeAsync, TestBed, waitForAsync, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AssignedSkill, AssignedSkillBackendDict } from 'domain/skill/assigned-skill.model';
import { TopicsAndSkillsDashboardBackendApiService, TopicIdToDiagnosticTestSkillIdsResponse } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DeleteSkillModalComponent, TopicAssignmentsSummary } from './delete-skill-modal.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe('Delete Skill Modal Component', () => {
  let fixture: ComponentFixture<DeleteSkillModalComponent>;
  let componentInstance: DeleteSkillModalComponent;
  let urlInterpolationService: UrlInterpolationService;
  let skillBackendDict: AssignedSkillBackendDict = {
    topic_id: 'topicId1',
    topic_name: 'topicName',
    topic_version: 1,
    subtopic_id: 2
  };

  const testSkills: AssignedSkill[] = [
    AssignedSkill.createFromBackendDict(skillBackendDict)
  ];

  const testTopicIdToDiagnosticTestSkillIds:
    TopicIdToDiagnosticTestSkillIdsResponse = {
      topicIdToDiagnosticTestSkillIds: {
        topicId1: []
      }
    };

  class MockTopicsAndSkillsDashboardBackendApiService {
    fetchTopicAssignmentsForSkillAsync(skillId: string) {
      return {
        then: (callback: (resp: AssignedSkill[]) => void) => {
          callback(testSkills);
        }
      };
    }

    fetchTopicIdToDiagnosticTestSkillIdsAsync(topicIds: string[]) {
      return {
        then: (callback: (
          resp: TopicIdToDiagnosticTestSkillIdsResponse) => void) => {
          callback(testTopicIdToDiagnosticTestSkillIds);
        }
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatProgressSpinnerModule
      ],
      declarations: [
        DeleteSkillModalComponent
      ],
      providers: [
        NgbActiveModal,
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService
        },
        UrlInterpolationService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteSkillModalComponent);
    componentInstance = fixture.componentInstance;
    componentInstance.topicsAssignments = [];
    componentInstance.skillId = '';
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    spyOn(componentInstance, 'fetchTopicAssignmentsForSkill');
    componentInstance.ngOnInit();
    expect(componentInstance.fetchTopicAssignmentsForSkill).toHaveBeenCalled();
  });

  it('should show topic assignments', () => {
    componentInstance.topicsAssignmentsAreFetched = true;
    componentInstance.topicsAssignments.length = 4;
    expect(componentInstance.showTopicsAssignments()).toBeTrue();
    componentInstance.topicsAssignments.length = 0;
    expect(componentInstance.showTopicsAssignments()).toBeFalse();
    componentInstance.topicsAssignmentsAreFetched = false;
    expect(componentInstance.showTopicsAssignments()).toBeFalse();
  });

  it('should fetch Topic Assignments for Skill', fakeAsync(() => {
    componentInstance.topicsAssignmentsAreFetched = false;
    componentInstance.fetchTopicAssignmentsForSkill();
    tick();
    expect(componentInstance.topicsAssignments).toEqual(testSkills);
    expect(componentInstance.topicsAssignmentsAreFetched).toBeTrue();
  }));

  it('should allow skill deletion', fakeAsync(() => {
    let topicsAndSkillsDashboardBackendApiService = TestBed.inject(
      TopicsAndSkillsDashboardBackendApiService);
    componentInstance.skillId = 'skill_id';
    componentInstance.topicsAssignmentsAreFetched = false;
    spyOn(
      topicsAndSkillsDashboardBackendApiService,
      'fetchTopicIdToDiagnosticTestSkillIdsAsync'
    ).and.returnValue(Promise.resolve({
      topicIdToDiagnosticTestSkillIds: {topicId1: []}
    }));
    componentInstance.fetchTopicAssignmentsForSkill();
    tick(50);
    expect(componentInstance.skillCanBeDeleted).toBeTrue();
  }));

  it(
    'should not be able to delete the skill when the skill is linked to the ' +
    'diagnostic test of any topic',
    fakeAsync(() => {
      let topicsAndSkillsDashboardBackendApiService = TestBed.inject(
        TopicsAndSkillsDashboardBackendApiService);
      componentInstance.skillId = 'skill_id';
      componentInstance.topicsAssignmentsAreFetched = false;

      // The backend API request is spied such that the skill is linked to the
      // diagnostic test of a topic with topic ID topicId1.
      spyOn(
        topicsAndSkillsDashboardBackendApiService,
        'fetchTopicIdToDiagnosticTestSkillIdsAsync'
      ).and.returnValue(Promise.resolve({
        topicIdToDiagnosticTestSkillIds: {
          topicId1: ['skill_id'],
          topicId2: []
        }
      }));

      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.skillCanBeDeleted).toBeFalse();
    }));

  it('should get topic editor url', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and
      .returnValue('test_url');
    let topicsAssignment: TopicAssignmentsSummary = {
      subtopicId: 1,
      topicVersion: 1,
      topicId: 'topicID'
    };
    expect(
      componentInstance.getTopicEditorUrl(topicsAssignment)).toEqual(
      'test_url');
  });
});
