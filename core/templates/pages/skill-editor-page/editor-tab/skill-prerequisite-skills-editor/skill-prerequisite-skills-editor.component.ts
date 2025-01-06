// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the skill prerequisite skills editor.
 */

import {CategorizedSkills} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {GroupedSkillSummaries} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {SkillSummary} from 'domain/skill/skill-summary.model';
import {SelectSkillModalComponent} from 'components/skill-selector/select-skill-modal.component';
import {NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {SkillUpdateService} from 'domain/skill/skill-update.service';
import {SkillEditorStateService} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {AlertsService} from 'services/alerts.service';
import {
  TopicsAndSkillsDashboardBackendApiService,
  TopicsAndSkillDashboardData,
} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Component, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';

@Component({
  selector: 'oppia-skill-prerequisite-skills-editor',
  templateUrl: './skill-prerequisite-skills-editor.component.html',
})
export class SkillPrerequisiteSkillsEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  categorizedSkills!: CategorizedSkills;
  untriagedSkillSummaries!: SkillSummary[];
  groupedSkillSummaries!: GroupedSkillSummaries;
  skillIdToSummaryMap!: Record<string, string>;
  skill!: Skill;
  prerequisiteSkillsAreShown: boolean = false;
  skillEditorCardIsShown: boolean = false;
  allAvailableSkills: SkillSummary[] = [];
  directiveSubscriptions = new Subscription();
  windowIsNarrow!: boolean;

  constructor(
    private skillUpdateService: SkillUpdateService,
    private skillEditorStateService: SkillEditorStateService,
    private alertsService: AlertsService,
    private topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService,
    private windowDimensionsService: WindowDimensionsService,
    private ngbModal: NgbModal
  ) {}

  removeSkillId(skillId: string): void {
    this.skillUpdateService.deletePrerequisiteSkill(this.skill, skillId);
  }

  getSkillEditorUrl(skillId: string): string {
    return '/skill_editor/' + skillId;
  }

  addSkill(): void {
    // This contains the summaries of skill in the same topic as
    // the current skill as the initial entries followed by the others.
    const skillsInSameTopicCount = this.groupedSkillSummaries.current.length;
    const sortedSkillSummaries = this.groupedSkillSummaries.current.concat(
      this.groupedSkillSummaries.others
    );
    const allowSkillsFromOtherTopics = true;

    const modalRef: NgbModalRef = this.ngbModal.open(
      SelectSkillModalComponent,
      {
        backdrop: 'static',
        windowClass: 'skill-select-modal',
        size: 'xl',
      }
    );

    modalRef.componentInstance.skillSummaries = sortedSkillSummaries;
    modalRef.componentInstance.skillsInSameTopicCount = skillsInSameTopicCount;
    modalRef.componentInstance.categorizedSkills = this.categorizedSkills;
    modalRef.componentInstance.allowSkillsFromOtherTopics =
      allowSkillsFromOtherTopics;
    modalRef.componentInstance.untriagedSkillSummaries =
      this.untriagedSkillSummaries;

    const whenResolved = (summary: SkillSummary): void => {
      let skillId = summary.id;
      if (skillId === this.skill.getId()) {
        this.alertsService.addInfoMessage(
          'A skill cannot be a prerequisite of itself',
          5000
        );
        return;
      }
      for (let idx in this.skill.getPrerequisiteSkillIds()) {
        if (this.skill.getPrerequisiteSkillIds()[idx] === skillId) {
          this.alertsService.addInfoMessage(
            'Given skill is already a prerequisite skill',
            5000
          );
          return;
        }
      }
      this.skillUpdateService.addPrerequisiteSkill(this.skill, skillId);
    };

    modalRef.result.then(
      function (summary) {
        whenResolved(summary);
      },
      function () {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  togglePrerequisiteSkills(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.prerequisiteSkillsAreShown = !this.prerequisiteSkillsAreShown;
    }
  }

  toggleSkillEditorCard(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.skillEditorCardIsShown = !this.skillEditorCardIsShown;
    }
  }

  // Return null if the skill is not found.
  getSkillDescription(skillIdUpdate: string): string | null {
    for (let skill of this.allAvailableSkills) {
      if (skill.id === skillIdUpdate) {
        return skill.description;
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.skillEditorCardIsShown = true;
    this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
        this.prerequisiteSkillsAreShown =
          !this.windowDimensionsService.isWindowNarrow();
      })
    );

    this.groupedSkillSummaries =
      this.skillEditorStateService.getGroupedSkillSummaries();

    this.topicsAndSkillsDashboardBackendApiService
      .fetchDashboardDataAsync()
      .then((response: TopicsAndSkillDashboardData) => {
        this.categorizedSkills = response.categorizedSkillsDict;
        this.untriagedSkillSummaries = response.untriagedSkillSummaries;
        this.allAvailableSkills = response.mergeableSkillSummaries.concat(
          response.untriagedSkillSummaries
        );
      });

    this.skill = this.skillEditorStateService.getSkill();
    this.prerequisiteSkillsAreShown =
      !this.windowDimensionsService.isWindowNarrow();
    this.skillIdToSummaryMap = {};

    for (let name in this.groupedSkillSummaries) {
      let skillSummaries =
        this.groupedSkillSummaries[name as keyof GroupedSkillSummaries];
      for (let idx in skillSummaries) {
        this.skillIdToSummaryMap[skillSummaries[idx].id] =
          skillSummaries[idx].description;
      }
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
