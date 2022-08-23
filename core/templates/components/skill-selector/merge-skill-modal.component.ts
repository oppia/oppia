// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for merge skill modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { AugmentedSkillSummary } from 'domain/skill/augmented-skill-summary.model';
import { SkillSummary } from 'domain/skill/skill-summary.model';
import { SkillsCategorizedByTopics } from 'pages/topics-and-skills-dashboard-page/skills-list/skills-list.component';

@Component({
  selector: 'oppia-merge-skill',
  templateUrl: './merge-skill-modal.component.html'
})
export class MergeSkillModalComponent extends ConfirmOrCancelModal {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  categorizedSkills!: SkillsCategorizedByTopics;
  skill!: AugmentedSkillSummary;
  skillSummaries!: AugmentedSkillSummary[];
  untriagedSkillSummaries!: SkillSummary[];
  selectedSkillId!: string;
  allowSkillsFromOtherTopics: boolean = true;

  constructor(
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  confirm(): void {
    this.ngbActiveModal.close({
      skill: this.skill,
      supersedingSkillId: this.selectedSkillId
    });
  }

  setSelectedSkillId(skillId: string): void {
    this.selectedSkillId = skillId;
  }
}
