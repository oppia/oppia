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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AssignedSkill, AssignedSkillBackendDict } from 'domain/skill/assigned-skill.model';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { DeleteSkillModalComponent } from './delete-skill-modal.component';

describe('Assign Skill to Topic Modal Component', () => {
  let fixture: ComponentFixture<DeleteSkillModalComponent>;
  let componentInstance: DeleteSkillModalComponent;
  let skillBackendDict: AssignedSkillBackendDict = {
    topic_id: 'test_id',
    topic_name: 'topic_name',
    topic_version: 1,
    subtopic_id: 2
  };
  const testSkills: AssignedSkill[] = [AssignedSkill
    .createFromBackendDict(skillBackendDict)];

  class MockTopicsAndSkillsDashboardBackendApiService {
    fetchTopicAssignmentsForSkillAsync(skillId: string) {
      return {
        then: (callback: (resp) => void) => {
          callback(testSkills);
        }
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DeleteSkillModalComponent
      ],
      providers: [
        NgbActiveModal,
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteSkillModalComponent);
    componentInstance = fixture.componentInstance;
    componentInstance.topicsAssignments = [];
    componentInstance.skillId = '';
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

  it('should fetch Topic Assignments for Skill', () => {
    componentInstance.topicsAssignmentsAreFetched = false;
    componentInstance.fetchTopicAssignmentsForSkill();
    expect(componentInstance.topicsAssignments).toEqual(testSkills);
    expect(componentInstance.topicsAssignmentsAreFetched).toBeTrue();
  });
});
