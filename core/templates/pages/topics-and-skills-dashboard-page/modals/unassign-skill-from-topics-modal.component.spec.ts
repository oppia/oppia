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
 * @fileoverview Unit tests for Unassign Skill Modal.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  AssignedSkillBackendDict,
  AssignedSkill,
} from 'domain/skill/assigned-skill.model';
import {
  TopicsAndSkillsDashboardBackendApiService,
  TopicIdToDiagnosticTestSkillIdsResponse,
} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {
  TopicNameToTopicAssignments,
  UnassignSkillFromTopicsModalComponent,
  TopicAssignmentsSummary,
} from './unassign-skill-from-topics-modal.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

describe('Skill unassignment modal', () => {
  let fixture: ComponentFixture<UnassignSkillFromTopicsModalComponent>;
  let componentInstance: UnassignSkillFromTopicsModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let urlInterpolationService: UrlInterpolationService;
  let skillBackendDictForAddition: AssignedSkillBackendDict = {
    topic_id: 'test_id_1',
    topic_name: 'Addition',
    topic_version: 1,
    subtopic_id: 2,
  };
  let skillBackendDictForFractions: AssignedSkillBackendDict = {
    topic_id: 'test_id_2',
    topic_name: 'Fractions',
    topic_version: 1,
    subtopic_id: 2,
  };
  const testSkills: AssignedSkill[] = [
    AssignedSkill.createFromBackendDict(skillBackendDictForAddition),
    AssignedSkill.createFromBackendDict(skillBackendDictForFractions),
  ];

  const testTopicIdToDiagnosticTestSkillIds: TopicIdToDiagnosticTestSkillIdsResponse =
    {
      topicIdToDiagnosticTestSkillIds: {
        test_id_1: [],
        test_id_2: ['skill_id'],
      },
    };

  class MockTopicsAndSkillsDashboardBackendApiService {
    fetchTopicAssignmentsForSkillAsync(skillId: string) {
      return {
        then: (callback: (resp: AssignedSkill[]) => void) => {
          callback(testSkills);
        },
      };
    }

    fetchTopicIdToDiagnosticTestSkillIdsAsync(topicIds: string[]) {
      return {
        then: (
          callback: (resp: TopicIdToDiagnosticTestSkillIdsResponse) => void
        ) => {
          callback(testTopicIdToDiagnosticTestSkillIds);
        },
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatProgressSpinnerModule],
      declarations: [UnassignSkillFromTopicsModalComponent],
      providers: [
        NgbActiveModal,
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService,
        },
        UrlInterpolationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnassignSkillFromTopicsModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    ngbActiveModal = ngbActiveModal as jasmine.SpyObj<NgbActiveModal>;
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

  it('should close', () => {
    spyOn(ngbActiveModal, 'close');
    componentInstance.selectedTopicNames = ['Topic 1'];
    componentInstance.eligibleTopicNameToTopicAssignments = {
      'Topic 1': {
        subtopicId: 0,
        topicVersion: 0,
        topicId: '',
      },
    };
    componentInstance.close();
    expect(ngbActiveModal.close).toHaveBeenCalledWith(
      componentInstance.selectedTopics
    );
  });

  it('should select topic to unassign', () => {
    componentInstance.selectedTopicToUnassign('abc');
    expect(componentInstance.selectedTopicNames.indexOf('abc')).toBeGreaterThan(
      -1
    );
    componentInstance.selectedTopicToUnassign('abc');
    expect(componentInstance.selectedTopicNames.indexOf('abc')).toEqual(-1);
  });

  it('should fetch topic assignments for skill', () => {
    componentInstance.skillId = 'skill_id';
    componentInstance.fetchTopicAssignmentsForSkill();
    let assignments: TopicNameToTopicAssignments = {};
    assignments[skillBackendDictForAddition.topic_name] = {
      subtopicId: skillBackendDictForAddition.subtopic_id,
      topicVersion: skillBackendDictForAddition.topic_version,
      topicId: skillBackendDictForAddition.topic_id,
    };
    expect(componentInstance.eligibleTopicNameToTopicAssignments).toEqual(
      assignments
    );
    expect(componentInstance.topicsAssignmentsAreFetched).toBeTrue();
  });

  it('should get topic editor url', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      'test_url'
    );
    let topicsAssignment: TopicAssignmentsSummary = {
      subtopicId: 1,
      topicVersion: 1,
      topicId: 'topicID',
    };
    expect(componentInstance.getTopicEditorUrl(topicsAssignment)).toEqual(
      'test_url'
    );
  });
});
