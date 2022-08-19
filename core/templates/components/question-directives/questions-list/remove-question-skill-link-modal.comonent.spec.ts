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

import { ComponentFixture, fakeAsync, TestBed, waitForAsync, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AssignedSkillBackendDict, AssignedSkill } from 'domain/skill/assigned-skill.model';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { RemoveQuestionSkillLinkModalComponent } from './remove-question-skill-link-modal.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';

describe('Question deletion modal', () => {
  let fixture: ComponentFixture<RemoveQuestionSkillLinkModalComponent>;
  let componentInstance: RemoveQuestionSkillLinkModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let urlInterpolationService: UrlInterpolationService;
  let skillBackendApiService: SkillBackendApiService;
  let skillBackendDictForAddition: AssignedSkillBackendDict = {
    topic_id: 'test_id_1',
    topic_name: 'Addition',
    topic_version: 1,
    subtopic_id: 2
  };
  let skillBackendDictForFractions: AssignedSkillBackendDict = {
    topic_id: 'test_id_2',
    topic_name: 'Fractions',
    topic_version: 1,
    subtopic_id: 2
  };
  const testSkills: AssignedSkill[] = [
    AssignedSkill.createFromBackendDict(skillBackendDictForAddition),
    AssignedSkill.createFromBackendDict(skillBackendDictForFractions)
  ];
  const topicNames: string[] = ['Fractions'];
  class MockTopicsAndSkillsDashboardBackendApiService {
    fetchTopicAssignmentsForSkillAsync(skillId: string) {
      return {
        then: (callback: (resp: AssignedSkill[]) => void) => {
          callback(testSkills);
        }
      };
    }
  }

  class MockSkillBackendApiService {
    getTopicNamesWithGivenSkillAssignedForDiagnosticTest(skillId: string) {
      return {
        then: (callback: (resp: string[]) => void) => {
          callback(topicNames);
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
        RemoveQuestionSkillLinkModalComponent
      ],
      providers: [
        NgbActiveModal,
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService
        },
        {
          provide: SkillBackendApiService,
          useClass: MockSkillBackendApiService
        },
        UrlInterpolationService
      ]
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveQuestionSkillLinkModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    ngbActiveModal = (ngbActiveModal as unknown) as
      jasmine.SpyObj<NgbActiveModal>;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
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
    componentInstance.close();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should get topic editor url', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and
      .returnValue('test_url');
    expect(componentInstance.getTopicEditorUrl('topicID')).toEqual('test_url');
  });

  it(
    'should not be able to delete questions when user have not enough rights',
    fakeAsync(() => {
      expect(componentInstance.questionDeletionIsAllowed).toBeTrue();
      componentInstance.canEditQuestion = false;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionDeletionIsAllowed).toBeFalse();
    }));

  it(
    'should not be able to delete questions when skill is assigned to ' +
    'the diagnostic test and question count is less than equal to 2',
    fakeAsync(() => {
      expect(componentInstance.questionDeletionIsAllowed).toBeTrue();
      componentInstance.numberOfQuestions = 2;
      componentInstance.canEditQuestion = true;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionDeletionIsAllowed).toBeFalse();
    }));

  it(
    'should be able to delete questions when skill is assigned to ' +
    'the diagnostic test and question count is greater than 2',
    fakeAsync(() => {
      expect(componentInstance.questionDeletionIsAllowed).toBeTrue();
      componentInstance.numberOfQuestions = 3;
      componentInstance.canEditQuestion = true;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionDeletionIsAllowed).toBeTrue();
    }));

  it(
    'should be able to delete questions when skill is not assigned to ' +
    'the diagnostic test',
    fakeAsync(() => {
      spyOn(
        skillBackendApiService,
        'getTopicNamesWithGivenSkillAssignedForDiagnosticTest'
      ).and.returnValue(Promise.resolve([]));
      componentInstance.canEditQuestion = true;
      componentInstance.numberOfQuestions = 3;
      expect(componentInstance.questionDeletionIsAllowed).toBeTrue();
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionDeletionIsAllowed).toBeTrue();
    }));
});
