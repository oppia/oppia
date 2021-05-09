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
 * @fileoverview Component for Unassign Skill Modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { AssignedSkill } from 'domain/skill/assigned-skill.model';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

export interface TopicAssignmentsSummary {
  subtopicId: number,
  topicVersion: number,
  topicId: string
}

interface TopicAssignments {
  [key: string]: TopicAssignmentsSummary
}

@Component({
  selector: 'oppia-unassign-skill-from-topics-modal',
  templateUrl: './unassign-skill-from-topics-modal.component.html'
})
export class UnassignSkillFromTopicsModalComponent
  extends ConfirmOrCancelModal {
  skillId: string;
  topicsAssignments: TopicAssignments;
  topicsAssignmentsAreFetched: boolean = false;
  selectedTopicNames: string[] = [];
  selectedTopics: TopicAssignmentsSummary[];

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService
  ) {
    super(ngbActiveModal);
  }

  fetchTopicAssignmentsForSkill(): void {
    this.topicsAndSkillsDashboardBackendApiService
      .fetchTopicAssignmentsForSkillAsync(
        this.skillId).then((response: AssignedSkill[]) => {
        this.topicsAssignments = {};
        response.map((topic) => {
          this.topicsAssignments[topic.topicName] = {
            subtopicId: topic.subtopicId,
            topicVersion: topic.topicVersion,
            topicId: topic.topicId,
          };
        });
        this.topicsAssignmentsAreFetched = true;
      });
  }

  ngOnInit(): void {
    this.fetchTopicAssignmentsForSkill();
  }

  selectedTopicToUnassign(topicId: string): void {
    let index: number = this.selectedTopicNames.indexOf(topicId);
    if (index !== -1) {
      this.selectedTopicNames.splice(index, 1);
    } else {
      this.selectedTopicNames.push(topicId);
    }
  }
  close(): void {
    this.selectedTopics = [];
    for (let index in this.selectedTopicNames) {
      this.selectedTopics.push(
        this.topicsAssignments[this.selectedTopicNames[index]]);
    }
    this.ngbActiveModal.close(this.selectedTopics);
  }
}
