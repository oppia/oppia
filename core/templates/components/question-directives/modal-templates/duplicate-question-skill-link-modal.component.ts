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
 * @fileoverview Component for Remove Question Modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {AssignedSkill} from 'domain/skill/assigned-skill.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';

export interface TopicNameToTopicId {
  [key: string]: string;
}

@Component({
  selector: 'oppia-duplicate-question-skill-link-modal',
  templateUrl: './duplicate-question-skill-link-modal.component.html',
})
export class DuplicateQuestionSkillLinkModalComponent extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  skillId!: string;
  canEditQuestion!: boolean;
  topicsAssignmentsAreFetched = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService,
    private skillBackendApiService: SkillBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {
    super(ngbActiveModal);
  }

  fetchTopicAssignmentsForSkill(): void {
    this.topicsAndSkillsDashboardBackendApiService
      .fetchTopicAssignmentsForSkillAsync(this.skillId)
      .then(() => {
        this.topicsAssignmentsAreFetched = true;
      });
  }
  
  ngOnInit(): void {
    this.fetchTopicAssignmentsForSkill();
  }

  close(): void {
    this.ngbActiveModal.close();
  }
}
