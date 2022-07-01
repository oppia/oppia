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
 * @fileoverview Component for question editor modal.
 */
import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmQuestionExitModalComponent } from './confirm-question-exit-modal.component';
import { QuestionEditorSaveModalComponent } from './question-editor-save-modal.component';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextService } from 'services/context.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { AlertsService } from 'services/alerts.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { QuestionValidationService } from 'services/question-validation.service';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';

interface SkillLinkageModificationsArray {
  id: string;
  task: string;
}
interface ReturnModalObject {
  skillLinkageModificationsArray: SkillLinkageModificationsArray[];
  commitMessage: string;
}
@Component({
  selector: 'question-editor-modal',
  templateUrl: './question-editor-modal.component.html'
})

export class QuestionEditorModalComponent
  extends ConfirmOrCancelModal {
  @Input() question;
  @Input() questionId;
  @Input() questionStateData;
  @Input() rubric;
  @Input() skillName;
  @Input() associatedSkillSummaries;
  @Input() untriagedSkillSummaries;
  @Input() canEditQuestion;
  @Input() categorizedSkills;
  @Input() groupedSkillSummaries;
  @Input() misconceptionsBySkill;
  @Input() newQuestionIsBeingCreated;

  returnModalObject: ReturnModalObject = {
    skillLinkageModificationsArray: [],
    commitMessage: ''
  };

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private alertsService: AlertsService,
    private ngbModal: NgbModal,
    private questionUndoRedoService: QuestionUndoRedoService,
    private contextService: ContextService,
    private questionValidationService: QuestionValidationService,
    private imageLocalStorageService: ImageLocalStorageService,
  ) {
    super(ngbActiveModal);
  }

  getSkillEditorUrl(skillId: string): string {
    return '/skill_editor/' + skillId;
  }

  removeSkill(skillId: string): void {
    if (this.associatedSkillSummaries.length === 1) {
      this.alertsService.addInfoMessage(
        'A question should be linked to at least one skill.');
      return;
    }

    this.returnModalObject.skillLinkageModificationsArray.push({
      id: skillId,
      task: 'remove'
    });

    this.associatedSkillSummaries =
      this.associatedSkillSummaries.filter((summary) => {
        return (summary.getId() !== skillId);
      });
  }

  getSkillLinkageModificationsArray(): SkillLinkageModificationsArray[] {
    return this.returnModalObject.skillLinkageModificationsArray;
  }

  undo(): void {
    this.returnModalObject.skillLinkageModificationsArray = [];
  }

  addSkill(): void {
    let skillsInSameTopicCount =
      this.groupedSkillSummaries.current.length;
    let sortedSkillSummaries =
      this.groupedSkillSummaries.current.concat(
        this.groupedSkillSummaries.others);
    let allowSkillsFromOtherTopics = true;
    let modalRef: NgbModalRef = this.ngbModal.open(SelectSkillModalComponent, {
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
      for (let idx in this.associatedSkillSummaries) {
        if (
          this.associatedSkillSummaries[idx].getId() ===
          summary.id) {
          this.alertsService.addInfoMessage(
            'Skill already linked to question');
          return;
        }
      }
      this.associatedSkillSummaries.push(
        ShortSkillSummary.create(
          summary.id, summary.description));
      this.returnModalObject.skillLinkageModificationsArray.push({
        id: summary.id,
        task: 'add'
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  // The saveAndCommit function is called when the contents of
  // a question is changed or the skill linkages are modified.
  // The user has to enter a commit message if the contents of
  // the question is edited but, if only the skill linkages are
  // modified then no commit message is required from the user
  // as there is already a default commit message present in the
  // backend for modification of skill linkages.
  saveAndCommit(): boolean | null {
    if (!this.isQuestionValid()) {
      return;
    }

    if (this.questionUndoRedoService.hasChanges()) {
      this.ngbModal.open(QuestionEditorSaveModalComponent, {
        backdrop: 'static'
      }).result.then((commitMessage) => {
        this.returnModalObject.commitMessage = commitMessage;
        this.ngbActiveModal.close(this.returnModalObject);
        // TODO(#8521): Remove the use of $rootScope.$apply()
        // once the controller is migrated to angular.
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      });
    } else {
      this.ngbActiveModal.close(this.returnModalObject);
    }
  }

  isSaveAndCommitButtonDisabled(): boolean {
    return !(
      this.questionUndoRedoService.hasChanges() || (
        this.returnModalObject.skillLinkageModificationsArray.length) > 0) ||
      !this.isQuestionValid();
  }

  done(): void {
    if (!this.isQuestionValid()) {
      return;
    }

    this.contextService.resetImageSaveDestination();
    this.ngbActiveModal.close(this.returnModalObject);
  }

  // Checking if Question contains all requirement to enable
  // Save and Publish Question.
  isQuestionValid(): boolean {
    return this.questionValidationService.isQuestionValid(
      this.question, this.misconceptionsBySkill);
  }

  cancel(): void {
    if (this.questionUndoRedoService.hasChanges()) {
      this.ngbModal.open(ConfirmQuestionExitModalComponent, {
        backdrop: true,
      }).result.then(() => {
        this.contextService.resetImageSaveDestination();
        this.imageLocalStorageService.flushStoredImagesData();
        this.ngbActiveModal.dismiss('cancel');
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      });
    } else {
      this.contextService.resetImageSaveDestination();
      this.imageLocalStorageService.flushStoredImagesData();
      this.ngbActiveModal.dismiss('cancel');
    }
  }
}

angular.module('oppia').directive('questionEditorModal',
  downgradeComponent({
    component: QuestionEditorModalComponent
  }) as angular.IDirectiveFactory);
