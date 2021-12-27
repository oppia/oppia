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
 * @fileoverview Component for the skill prerequisite skills editor.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { AlertsService } from 'services/alerts.service';

@Component({
  selector: 'oppia-skill-prerequisite-skills-editor',
  templateUrl: './skill-prerequisite-skills-editor.component.html'
})
export class SkillPrerequisiteSkillsEditorComponent
  implements OnInit {
  categorizedSkills;
  untriagedSkillSummaries;
  groupedSkillSummaries;
  prerequisiteSkillsAreShown: boolean;
  skill;
  skillIdToSummaryMap;

  constructor(
    private alertsService: AlertsService,
    private ngbModal: NgbModal,
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService,
    private topicsAndSkillsDashboardBackendApiService:
      TopicsAndSkillsDashboardBackendApiService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  ngOnInit(): void {
    this.groupedSkillSummaries = this.skillEditorStateService
      .getGroupedSkillSummaries();
    this.topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
      .then((response) => {
        this.categorizedSkills = response.categorizedSkillsDict;
        this.untriagedSkillSummaries = response.untriagedSkillSummaries;
      });
    this.skill = this.skillEditorStateService.getSkill();
    this.prerequisiteSkillsAreShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.skillIdToSummaryMap = {};
    for (let name in this.groupedSkillSummaries) {
      let skillSummaries = this.groupedSkillSummaries[name];
      for (let idx in skillSummaries) {
       this.skillIdToSummaryMap[skillSummaries[idx].id] =
        skillSummaries[idx].description;
      }
    }
  }

  removeSkillId(skillId: string): void {
    this.skillUpdateService.deletePrerequisiteSkill(this.skill, skillId);
  }

  getSkillEditorUrl(skillId: string): string {
    return '/skill_editor/' + skillId;
  }

  addSkill(): void {
    // This contains the summaries of skill in the same topic as
    // the current skill as the initial entries followed by the others.
    let skillsInSameTopicCount =
      this.groupedSkillSummaries.current.length;
    let sortedSkillSummaries = this.groupedSkillSummaries.current.concat(
      this.groupedSkillSummaries.others);
    let allowSkillsFromOtherTopics = true;
    let modalRef: NgbModalRef = this.ngbModal.open(
      SelectSkillModalComponent, {
        backdrop: 'static',
        windowClass: 'skill-select-modal',
        size: 'xl'
      });
    modalRef.componentInstance.skillSummaries = sortedSkillSummaries;
    modalRef.componentInstance.skillsInSameTopicCount = (
      skillsInSameTopicCount);
    modalRef.componentInstance.categorizedSkills = this.categorizedSkills;
    modalRef.componentInstance.allowSkillsFromOtherTopics = (
      allowSkillsFromOtherTopics);
    modalRef.componentInstance.untriagedSkillSummaries = (
      this.untriagedSkillSummaries);
    modalRef.result.then((summary) => {
      let skillId = summary.id;
      if (skillId ===this.skill.getId()) {
        this.alertsService.addInfoMessage(
          'A skill cannot be a prerequisite of itself', 5000);
        return;
      }
      for (let idx in this.skill.getPrerequisiteSkillIds()) {
        if (this.skill.getPrerequisiteSkillIds()[idx] === skillId) {
          this.alertsService.addInfoMessage(
            'Given skill is already a prerequisite skill', 5000);
          return;
        }
      }
      this.skillUpdateService.addPrerequisiteSkill(this.skill, skillId);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  togglePrerequisiteSkills(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
     this.prerequisiteSkillsAreShown = (
        !this.prerequisiteSkillsAreShown);
    }
  }
}

angular.module('oppia').directive('oppiaSkillPrerequisiteSkillsEditor',
  downgradeComponent({
    component: SkillPrerequisiteSkillsEditorComponent
  }) as angular.IDirectiveFactory);
