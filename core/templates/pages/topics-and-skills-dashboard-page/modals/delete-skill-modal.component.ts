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

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { AssignedSkill } from 'domain/skill/assigned-skill.model';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

@Component({
  selector: 'oppia-delete-skill-modal',
  templateUrl: './delete-skill-modal.component.html'
})
export class DeleteSkillModalComponent extends ConfirmOrCancelModal {
  skillId: string;
  topicsAssignments: AssignedSkill[];
  topicsAssignmentsAreFetched: boolean = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService,
  ) {
    super(ngbActiveModal);
  }

  fetchTopicAssignmentsForSkill(): void {
    this.topicsAndSkillsDashboardBackendApiService
      .fetchTopicAssignmentsForSkillAsync(
        this.skillId).then((response: AssignedSkill[]) => {
        this.topicsAssignments = response;
        this.topicsAssignmentsAreFetched = true;
      });
  }

  ngOnInit(): void {
    this.fetchTopicAssignmentsForSkill();
  }

  showTopicsAssignments(): boolean {
    return Boolean(
      this.topicsAssignmentsAreFetched &&
        this.topicsAssignments.length);
  }
}
