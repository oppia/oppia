// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Remove Question Modal.
 */

import { ComponentFixture, fakeAsync, TestBed, waitForAsync, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AssignedSkillBackendDict, AssignedSkill } from 'domain/skill/assigned-skill.model';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { RemoveQuestionSkillLinkModalComponent } from './remove-question-skill-link-modal.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';

describe('Question deletion modal', () => {
  let fixture: ComponentFixture<RemoveQuestionSkillLinkModalComponent>;
  let componentInstance: RemoveQuestionSkillLinkModalComponent;
  let ngbActiveModal: NgbActiveModal;
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
        }
      ]
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveQuestionSkillLinkModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    ngbActiveModal = (ngbActiveModal as unknown) as
      jasmine.SpyObj<NgbActiveModal>;
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
    expect(componentInstance.getTopicEditorUrl('topicID')).toEqual(
      '/topic_editor/topicID#/');
  });

  it(
    'should not be able to remove questions when user have not enough rights',
    fakeAsync(() => {
      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();
      componentInstance.canEditQuestion = false;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionRemovalIsAllowed).toBeFalse();
    }));

  it(
    'should not be able to remove questions when skill is assigned to ' +
    'the diagnostic test and question count is less than equal to 2',
    fakeAsync(() => {
      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();
      componentInstance.canEditQuestion = true;
      componentInstance.numberOfQuestions = 0;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionRemovalIsAllowed).toBeFalse();

      componentInstance.numberOfQuestions = 1;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionRemovalIsAllowed).toBeFalse();

      componentInstance.numberOfQuestions = 2;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionRemovalIsAllowed).toBeFalse();
    }));

  it(
    'should be able to remove questions when skill is assigned to ' +
    'the diagnostic test and question count is greater than 3',
    fakeAsync(() => {
      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();
      componentInstance.canEditQuestion = true;
      componentInstance.numberOfQuestions = 4;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();

      componentInstance.numberOfQuestions = 7;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();

      componentInstance.numberOfQuestions = 10;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();

      componentInstance.numberOfQuestions = 100;
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();
      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();
    }));

  it(
    'should be able to remove questions when skill is not assigned to ' +
    'the diagnostic test',
    fakeAsync(() => {
      componentInstance.canEditQuestion = true;
      componentInstance.numberOfQuestions = 2;

      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();

      // The backend API request is mocked under the describe section, such that
      // the skill is assigned to the diagnostic test and the number of
      // questions in the skill is 2, hence this function call is expected not
      // to allow question removal from the skill.
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();

      expect(componentInstance.questionRemovalIsAllowed).toBeFalse();

      spyOn(
        skillBackendApiService,
        'getTopicNamesWithGivenSkillAssignedForDiagnosticTest'
      ).and.returnValue(Promise.resolve([]));

      // The backend API request is spied such that the skill is not assigned
      // to the diagnostic test, hence this function call is expected to allow
      // question removal from the skill.
      componentInstance.fetchTopicAssignmentsForSkill();
      tick();

      expect(componentInstance.questionRemovalIsAllowed).toBeTrue();
    }));
});
