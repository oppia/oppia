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
 * @fileoverview Component for Delete Skill Modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {AssignedSkill} from 'domain/skill/assigned-skill.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  TopicsAndSkillsDashboardBackendApiService,
  TopicIdToDiagnosticTestSkillIdsResponse,
} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

export interface TopicAssignmentsSummary {
  subtopicId: number;
  topicVersion: number;
  topicId: string;
}

export interface TopicNameToTopicAssignments {
  [key: string]: TopicAssignmentsSummary;
}

@Component({
  selector: 'oppia-delete-skill-modal',
  templateUrl: './delete-skill-modal.component.html',
})
export class DeleteSkillModalComponent extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  skillId!: string;
  ineligibleTopicNameToTopicAssignments: TopicNameToTopicAssignments = {};
  ineligibleTopicsCount: number = 0;
  topicsAssignments: AssignedSkill[] = [];
  topicsAssignmentsAreFetched: boolean = false;
  skillCanBeDeleted: boolean = true;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {
    super(ngbActiveModal);
  }

  fetchTopicIdToDiagnosticTestSkillIds(
    topicAssignments: AssignedSkill[]
  ): void {
    let allTopicIds = [];
    for (let topic of topicAssignments) {
      allTopicIds.push(topic.topicId);
    }
    this.ineligibleTopicNameToTopicAssignments = {};
    this.topicsAndSkillsDashboardBackendApiService
      .fetchTopicIdToDiagnosticTestSkillIdsAsync(allTopicIds)
      .then((responseDict: TopicIdToDiagnosticTestSkillIdsResponse) => {
        for (let topic of topicAssignments) {
          let diagnosticTestSkillIds =
            responseDict.topicIdToDiagnosticTestSkillIds[topic.topicId];

          if (
            diagnosticTestSkillIds.length === 1 &&
            diagnosticTestSkillIds.indexOf(this.skillId) !== -1
          ) {
            this.ineligibleTopicNameToTopicAssignments[topic.topicName] = {
              topicId: topic.topicId,
              subtopicId: topic.subtopicId,
              topicVersion: topic.topicVersion,
            };
            this.skillCanBeDeleted = false;
          }
        }
        this.ineligibleTopicsCount = Object.keys(
          this.ineligibleTopicNameToTopicAssignments
        ).length;
        this.topicsAssignments = topicAssignments;
      });
  }

  fetchTopicAssignmentsForSkill(): void {
    this.topicsAndSkillsDashboardBackendApiService
      .fetchTopicAssignmentsForSkillAsync(this.skillId)
      .then((response: AssignedSkill[]) => {
        this.fetchTopicIdToDiagnosticTestSkillIds(response);
        this.topicsAssignmentsAreFetched = true;
      });
  }

  getTopicEditorUrl(topicAssignment: TopicAssignmentsSummary): string {
    let topicId = topicAssignment.topicId;
    const TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topic_id>#/';
    return this.urlInterpolationService.interpolateUrl(
      TOPIC_EDITOR_URL_TEMPLATE,
      {
        topic_id: topicId,
      }
    );
  }

  ngOnInit(): void {
    this.fetchTopicAssignmentsForSkill();
  }

  showTopicsAssignments(): boolean {
    return Boolean(
      this.topicsAssignmentsAreFetched && this.topicsAssignments.length
    );
  }
}
