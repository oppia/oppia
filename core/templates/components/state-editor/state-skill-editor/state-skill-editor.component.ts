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
 * @fileoverview Component for the skill editor section in the state editor.
*/

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SkillSummaryBackendDict } from 'core/templates/domain/skill/skill-summary.model';
import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { DeleteStateSkillModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-state-skill-modal.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TopicsAndSkillsDashboardBackendApiService, CategorizedAndUntriagedSkillsData } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { AlertsService } from 'services/alerts.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { StateLinkedSkillIdService } from '../state-editor-properties-services/state-skill.service';
import { SkillsCategorizedByTopics } from 'pages/topics-and-skills-dashboard-page/skills-list/skills-list.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { downgradeComponent } from '@angular/upgrade/static';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { UserService } from 'services/user.service';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';

@Component({
  selector: 'state-skill-editor',
  templateUrl: './state-skill-editor.component.html'
})
export class StateSkillEditorComponent implements OnInit {
  @Output() onSaveLinkedSkillId: EventEmitter<string | null> = (
    new EventEmitter<string | null>());

  @Output() onSaveStateContent: EventEmitter<string> = (
    new EventEmitter<string>());

  categorizedSkills!: SkillsCategorizedByTopics;
  untriagedSkillSummaries!: ShortSkillSummary[];
  skillName!: string;
  skillEditorIsShown: boolean = true;
  userCanEditSkills: boolean = false;

  constructor(
    private topicsAndSkillsDashboardBackendApiService:
      TopicsAndSkillsDashboardBackendApiService,
    private storyEditorStateService: StoryEditorStateService,
    private alertsService: AlertsService,
    private windowDimensionsService: WindowDimensionsService,
    public stateLinkedSkillIdService: StateLinkedSkillIdService,
    private urlInterpolationService: UrlInterpolationService,
    private ngbModal: NgbModal,
    private skillBackendApiService: SkillBackendApiService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.skillEditorIsShown = (!this.windowDimensionsService.isWindowNarrow());
    this.topicsAndSkillsDashboardBackendApiService
      .fetchCategorizedAndUntriagedSkillsDataAsync()
      .then((response: CategorizedAndUntriagedSkillsData) => {
        this.categorizedSkills = response.categorizedSkillsDict;
        this.untriagedSkillSummaries = response.untriagedSkillSummaries;
      });
    this.userService.canUserAccessTopicsAndSkillsDashboard()
      .then((canUserAccessTopicsAndSkillsDashboard) => {
        this.userCanEditSkills = canUserAccessTopicsAndSkillsDashboard;
      });
    this.stateLinkedSkillIdService.onStateLinkedSkillIdInitialized.subscribe(
      () => {
        if (this.stateLinkedSkillIdService.displayed) {
          this.skillBackendApiService.fetchSkillAsync(
            this.stateLinkedSkillIdService.displayed
          ).then((skill) => {
            this.skillName = skill.skill.getDescription();
          });
        }
      });
  }

  addSkill(): void {
    let sortedSkillSummaries = (
      this.storyEditorStateService.getSkillSummaries()
    ) as SkillSummaryBackendDict[];
    let allowSkillsFromOtherTopics = true;
    let skillsInSameTopicCount = 0;
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
    modalRef.result.then((result) => {
      this.skillName = result.description;
      this.stateLinkedSkillIdService.displayed = result.id;
      this.stateLinkedSkillIdService.saveDisplayedValue();
      this.onSaveLinkedSkillId.emit(result.id);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  deleteSkill(): void {
    this.alertsService.clearWarnings();
    this.ngbModal.open(
      DeleteStateSkillModalComponent, {
        backdrop: true,
      }).result.then(() => {
      this.stateLinkedSkillIdService.displayed = null;
      this.stateLinkedSkillIdService.saveDisplayedValue();
      this.onSaveLinkedSkillId.emit(this.stateLinkedSkillIdService.displayed);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  getSkillEditorUrl(): string {
    if (this.stateLinkedSkillIdService.displayed) {
      return this.urlInterpolationService.interpolateUrl(
        '/skill_editor/<skill_id>', {
          skill_id: this.stateLinkedSkillIdService.displayed
        });
    }
    throw new Error('Expected a skill id to be displayed');
  }

  toggleSkillEditor(): void {
    this.skillEditorIsShown = !this.skillEditorIsShown;
  }
}

angular.module('oppia').directive(
  'stateSkillEditor', downgradeComponent(
    {component: StateSkillEditorComponent}));
