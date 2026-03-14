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
 * @fileoverview Component for the main tab of the skill editor.
 */

import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {SavePendingChangesModalComponent} from 'components/save-pending-changes/save-pending-changes-modal.component';
import {BackendChangeObject} from 'domain/editor/undo_redo/change.model';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {Skill} from 'domain/skill/skill.model.ts';
import {EditableTopicBackendApiService} from 'domain/topic/editable-topic-backend-api.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {PageTitleService} from 'services/page-title.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';

import {SkillEditorRoutingService} from '../services/skill-editor-routing.service';
import {
  AssignedSkillTopicData,
  SkillEditorStateService,
} from '../services/skill-editor-state.service';

@Component({
  selector: 'oppia-skill-editor-main-tab',
  templateUrl: './skill-editor-main-tab.component.html',
})
export class SkillEditorMainTabComponent
  implements OnInit, AfterContentChecked
{
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  subtopicName!: string;
  topicName!: string;
  // Assigned skill topic data is null when the skill is not assigned to any
  // topic.
  assignedSkillTopicData!: AssignedSkillTopicData | null;
  skill!: Skill;

  // Stores editable topics used to populate the topic dropdown.
  editableTopicSummaries: CreatorTopicSummary[] = [];

  constructor(
    private alertsService: AlertsService,
    private changeDetectorRef: ChangeDetectorRef,
    private editableTopicBackendApiService: EditableTopicBackendApiService,
    private focusManagerService: FocusManagerService,
    private ngbModal: NgbModal,
    private pageTitleService: PageTitleService,
    private skillEditorRoutingService: SkillEditorRoutingService,
    private skillEditorStateService: SkillEditorStateService,
    private topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService,
    private undoRedoService: UndoRedoService
  ) {}

  createQuestion(): void {
    // This check is needed because if a skill has unsaved changes to
    // misconceptions, then these will be reflected in the questions
    // created at that time, but if page is refreshed/changes are
    // discarded, the misconceptions won't be saved, but there will be
    // some questions with these now non-existent misconceptions.
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(SavePendingChangesModalComponent, {
        backdrop: true,
      });

      modalRef.componentInstance.body =
        'Please save all pending ' +
        'changes before viewing the questions list.';

      modalRef.result.then(null, () => {});
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    } else {
      this.skillEditorRoutingService.navigateToQuestionsTab();
      this.skillEditorRoutingService.creatingNewQuestion(true);
    }
  }

  getSubtopicName(): string {
    return this.subtopicName;
  }

  getAssignedSkillTopicData(): AssignedSkillTopicData | null {
    this.assignedSkillTopicData =
      this.skillEditorStateService.getAssignedSkillTopicData();

    if (!this.topicName && this.assignedSkillTopicData) {
      this.topicName = Object.keys(this.assignedSkillTopicData)[0];
      this.updateSubtopicForTopic(this.topicName);
    }

    return this.assignedSkillTopicData;
  }

  getEditableTopicNames(): string[] {
    return this.editableTopicSummaries.map(topicSummary => topicSummary.name);
  }

  isTopicDropdownEnabled(): boolean {
    return this.editableTopicSummaries.length > 0;
  }

  // Clears the subtopic label when the selected topic has no existing
  // skill-to-subtopic assignment.
  updateSubtopicForTopic(topicName: string): void {
    const assignedSkillTopicData = this.assignedSkillTopicData;
    if (!assignedSkillTopicData || !assignedSkillTopicData[topicName]) {
      this.subtopicName = '';
      return;
    }
    this.subtopicName = assignedSkillTopicData[topicName];
  }

  // Reuses the current assignment when the selected topic is already linked
  // to the skill. Otherwise, it assigns the skill to that topic.
  handleTopicSelectionChange(topicName: string): void {
    this.topicName = topicName;
    this.assignedSkillTopicData =
      this.skillEditorStateService.getAssignedSkillTopicData();

    if (
      this.assignedSkillTopicData &&
      Object.keys(this.assignedSkillTopicData).includes(topicName)
    ) {
      this.updateSubtopicForTopic(topicName);
      return;
    }

    this.assignSkillToTopic(topicName);
  }

  assignSkillToTopic(topicName: string): void {
    if (!topicName.trim()) {
      this.alertsService.addWarning('Please select a valid topic.');
      return;
    }

    const skillId = this.skill.getId();
    const topicSummary = this.editableTopicSummaries.find(
      topic => topic.name === topicName
    );

    if (!topicSummary) {
      this.alertsService.addWarning('Could not find the selected topic.');
      return;
    }

    const changeList: BackendChangeObject[] = [
      {
        cmd: 'add_uncategorized_skill_id',
        new_uncategorized_skill_id: skillId,
      },
    ];

    this.editableTopicBackendApiService
      .updateTopicAsync(
        topicSummary.id,
        topicSummary.version,
        'Added skill with id ' + skillId + ' to topic.',
        changeList
      )
      .then(() => {
        this.skillEditorStateService.loadSkill(skillId);
        this.subtopicName = '';
        this.alertsService.addSuccessMessage(
          'The skill has been assigned to the topic.'
        );
      })
      .catch((error: string) => {
        this.alertsService.addWarning(error);
      });
  }

  hasLoadedSkill(): boolean {
    this.skill = this.skillEditorStateService.getSkill();
    return this.skillEditorStateService.hasLoadedSkill();
  }

  ngAfterContentChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    // To avoid ExpressionChangedAfterItHasBeenCheckedError
    // $timeout is required.
    setTimeout(() => {
      this.pageTitleService.setNavbarTitleForMobileView('Skill Editor');
    });
    // To ensure that the focus event function executes only after
    // all the functions in the main thread have executed,
    // $timeout is required.

    setTimeout(() => {
      this.focusManagerService.setFocus('newQuestionBtn');
    }, 0);

    this.topicsAndSkillsDashboardBackendApiService
      .fetchDashboardDataAsync()
      .then(response => {
        this.editableTopicSummaries = response.topicSummaries.filter(
          summary => summary.canEditTopic === true
        );
      })
      .catch((error: Error) => {
        this.alertsService.addWarning(error.message);
      });
  }
}
