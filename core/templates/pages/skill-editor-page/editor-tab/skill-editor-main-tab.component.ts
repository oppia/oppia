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

import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SavePendingChangesModalComponent } from 'components/save-pending-changes/save-pending-changes-modal.component';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { Topic } from 'domain/topic/topic-object.model';
import { PageTitleService } from 'services/page-title.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { SkillEditorRoutingService } from '../services/skill-editor-routing.service';
import { AssignedSkillTopicData, SkillEditorStateService } from '../services/skill-editor-state.service';

@Component({
  selector: 'oppia-skill-editor-main-tab',
  templateUrl: './skill-editor-main-tab.component.html'
})
export class SkillEditorMainTabComponent implements OnInit,
 AfterContentChecked {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  subtopicName!: string;
  topicName!: string;
  // Assigned skill topic data is null when the skill is not assigned to any
  // topic.
  assignedSkillTopicData!: AssignedSkillTopicData | null;
  skill!: Skill;
  selectedTopic!: Topic;
  topicDropdownEnabled: boolean = false;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private focusManagerService: FocusManagerService,
    private ngbModal: NgbModal,
    private pageTitleService: PageTitleService,
    private skillEditorRoutingService: SkillEditorRoutingService,
    private skillEditorStateService: SkillEditorStateService,
    private undoRedoService: UndoRedoService,
  ) {}

  createQuestion(): void {
    // This check is needed because if a skill has unsaved changes to
    // misconceptions, then these will be reflected in the questions
    // created at that time, but if page is refreshed/changes are
    // discarded, the misconceptions won't be saved, but there will be
    // some questions with these now non-existent misconceptions.
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(
        SavePendingChangesModalComponent, {
          backdrop: true
        });

      modalRef.componentInstance.body = (
        'Please save all pending ' +
        'changes before viewing the questions list.');

      modalRef.result.then(null, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    } else {
      this.skillEditorRoutingService.navigateToQuestionsTab();
      this.skillEditorRoutingService.creatingNewQuestion(true);
    }
  }

  getSubtopicName(): string {
    return this.subtopicName;
  }

  getAssignedSkillTopicData(): AssignedSkillTopicData | null {
    if (!this.topicName && this.assignedSkillTopicData) {
      this.topicName = Object.keys(this.assignedSkillTopicData)[0];
      this.changeSelectedTopic(this.topicName);
      return this.assignedSkillTopicData;
    }
    this.assignedSkillTopicData = (
      this.skillEditorStateService.getAssignedSkillTopicData());
    return this.assignedSkillTopicData;
  }

  isTopicDropdownEnabled(): boolean {
    this.topicDropdownEnabled = Boolean(
      this.assignedSkillTopicData &&
        Object.keys(this.assignedSkillTopicData).length);
    return this.topicDropdownEnabled;
  }

  changeSelectedTopic(topicName: string): void {
    let assignedSkillTopicData = this.assignedSkillTopicData;
    if (!assignedSkillTopicData) {
      return;
    }
    this.subtopicName = assignedSkillTopicData[topicName];
  }

  hasLoadedSkill(): boolean {
    this.skill = this.skillEditorStateService.getSkill();
    return this.skillEditorStateService.hasLoadedSkill();
  }

  ngAfterContentChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    this.pageTitleService.setNavbarTitleForMobileView('Skill Editor');
    // To ensure that the focus event function executes only after
    // all the functions in the main thread have executed,
    // $timeout is required.
    setTimeout(() => {
      this.focusManagerService.setFocus('newQuestionBtn');
    }, 0);
  }
}

angular.module('oppia').directive('oppiaSkillEditorMainTab',
  downgradeComponent({
    component: SkillEditorMainTabComponent
  }) as angular.IDirectiveFactory);
