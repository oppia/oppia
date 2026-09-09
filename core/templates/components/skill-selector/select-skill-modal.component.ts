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
import {Component, Optional, Inject} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA,
} from '@angular/material/bottom-sheet';

import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {SkillSummaryBackendDict} from 'domain/skill/skill-summary.model';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';

import {CategorizedSkills} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

import {GroupedSkillSummaries} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {SkillSummary} from 'domain/skill/skill-summary.model';
import './select-skill-modal.component.css';
export {CategorizedSkills};

interface SelectSkillModalData {
  categorizedSkills: CategorizedSkills;
  skillsInSameTopicCount: number;
  skillSummaries: SkillSummaryBackendDict[];
  untriagedSkillSummaries: SkillSummaryBackendDict[];
  allowSkillsFromOtherTopics: boolean;
  associatedSkillSummaries?: ShortSkillSummary[];
}

@Component({
  selector: 'oppia-select-skill',
  templateUrl: './select-skill-modal.component.html',
  styleUrls: ['./select-skill-modal.component.css'],
})
export class SelectSkillModalComponent extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  categorizedSkills!: CategorizedSkills;
  skillsInSameTopicCount!: number;
  skillSummaries!: SkillSummaryBackendDict[];
  untriagedSkillSummaries!: SkillSummaryBackendDict[];
  selectedSkillId!: string;
  allowSkillsFromOtherTopics: boolean = false;
  associatedSkillSummaries!: ShortSkillSummary[];
  skillIdsToExclude: Set<string> = new Set<string>();
  errorMessage: string =
    'This skill is already linked to the current question.';

  groupedSkillSummaries: GroupedSkillSummaries = {
    current: [],
    others: [],
  };

  private _untriagedSkillSummariesForSelector: SkillSummary[] = [];
  private _lastUntriagedSkillSummaries!: SkillSummaryBackendDict[];

  get untriagedSkillSummariesForSelector(): SkillSummary[] {
    if (!this.untriagedSkillSummaries) {
      if (this._untriagedSkillSummariesForSelector.length > 0) {
        this._untriagedSkillSummariesForSelector = [];
      }
      return this._untriagedSkillSummariesForSelector;
    }
    if (this._lastUntriagedSkillSummaries !== this.untriagedSkillSummaries) {
      this._lastUntriagedSkillSummaries = this.untriagedSkillSummaries;
      this._untriagedSkillSummariesForSelector =
        this.untriagedSkillSummaries.map(dict =>
          SkillSummary.createFromBackendDict(dict)
        );
    }
    return this._untriagedSkillSummariesForSelector;
  }

  constructor(
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional()
    selectSkillBottomSheetRef?: MatBottomSheetRef<SelectSkillModalComponent>,
    @Optional()
    @Inject(MAT_BOTTOM_SHEET_DATA)
    data?: SelectSkillModalData
  ) {
    super(ngbActiveModal, selectSkillBottomSheetRef);
    if (data) {
      this.categorizedSkills = data.categorizedSkills;
      this.skillsInSameTopicCount = data.skillsInSameTopicCount;
      this.skillSummaries = data.skillSummaries;
      this.untriagedSkillSummaries = data.untriagedSkillSummaries;
      this.allowSkillsFromOtherTopics = data.allowSkillsFromOtherTopics;
      if (data.associatedSkillSummaries) {
        this.associatedSkillSummaries = data.associatedSkillSummaries;
      }
    }
  }

  confirm(): void {
    let totalSkills: (SkillSummaryBackendDict | ShortSkillSummary)[] = [];
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
      summary => summary.id === this.selectedSkillId
    );

    super.confirm(summary);
  }

  setSelectedSkillId(skillId: string): void {
    this.selectedSkillId = skillId;
  }

  isDoneButtonDisabled(): boolean {
    return !this.selectedSkillId || !this.isSkillAlreadyLinked();
  }

  isSkillAlreadyLinked(): boolean {
    for (let idx in this.associatedSkillSummaries) {
      if (this.associatedSkillSummaries[idx].getId() === this.selectedSkillId) {
        return false;
      }
    }
    return true;
  }
}
