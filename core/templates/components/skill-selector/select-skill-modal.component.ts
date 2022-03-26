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
 * @fileoverview Component for select skill modal.
 */
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { SkillsCategorizedByTopics } from 'pages/topics-and-skills-dashboard-page/skills-list/skills-list.component';

@Component({
  selector: 'oppia-select-skill',
  templateUrl: './select-skill-modal.component.html',
})
export class SelectSkillModalComponent extends ConfirmOrCancelModal {
  categorizedSkills!: SkillsCategorizedByTopics;
  skillsInSameTopicCount!: number;
  skillSummaries!: SkillSummaryBackendDict[];
  untriagedSkillSummaries!: ShortSkillSummary[];
  allowSkillsFromOtherTopics!: boolean;
  selectedSkillId: string | null = null;

  constructor(
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  confirm(): void {
    let totalSkills:
    (ShortSkillSummary | SkillSummaryBackendDict)[] = [];
    if (this.skillSummaries) {
      totalSkills = [...this.skillSummaries];
    }
    if (this.untriagedSkillSummaries) {
      totalSkills.push(...this.untriagedSkillSummaries);
    }
    for (let topic in this.categorizedSkills) {
      for (let subtopic in this.categorizedSkills[topic]) {
        totalSkills.push(...this.categorizedSkills[topic][subtopic]);
      }
    }

    let summary = totalSkills.find(
      summary => summary.id === this.selectedSkillId);

    this.ngbActiveModal.close(summary);
  }

  setSelectedSkillId(skillId: string): void {
    this.selectedSkillId = skillId;
  }
}
