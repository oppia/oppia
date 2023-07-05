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
 * @fileoverview Component for the question misconception editor.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import cloneDeep from 'lodash/cloneDeep';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { Misconception, MisconceptionSkillMap, TaggedMisconception } from 'domain/skill/MisconceptionObjectFactory';
import { ExternalSaveService } from 'services/external-save.service';
import { TagMisconceptionModalComponent } from './tag-misconception-modal-component';
import { SubtitledHtmlBackendDict } from 'domain/exploration/subtitled-html.model';
import { Rule } from 'domain/exploration/rule.model';

export interface MisconceptionUpdatedValues {
  misconception: Misconception;
  skillId: string;
  feedbackIsUsed: boolean;
}

export interface Outcome {
  feedback: SubtitledHtmlBackendDict;
  labelledAsCorrect: boolean;
}

@Component({
  selector: 'oppia-question-misconception-editor',
  templateUrl: './question-misconception-editor.component.html'
})
export class QuestionMisconceptionEditorComponent implements OnInit {
  @Output() saveAnswerGroupFeedback:
    EventEmitter<Outcome> = (new EventEmitter());

  @Output() saveTaggedMisconception:
    EventEmitter<TaggedMisconception> = (new EventEmitter());

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() outcome!: Outcome;
  @Input() isEditable!: boolean;
  @Input() rules!: Rule;
  @Input() taggedSkillMisconceptionId!: string;
  misconceptionName!: string;
  misconceptionsBySkill!: MisconceptionSkillMap;
  selectedMisconception!: Misconception;
  selectedMisconceptionSkillId!: string;
  feedbackIsUsed: boolean = false;
  misconceptionEditorIsOpen: boolean = false;

  constructor(
    private externalSaveService: ExternalSaveService,
    private ngbModal: NgbModal,
    private stateEditorService: StateEditorService
  ) {}

  ngOnInit(): void {
    this.misconceptionsBySkill = (
      this.stateEditorService.getMisconceptionsBySkill());
    this.misconceptionEditorIsOpen = false;
    let skillMisconceptionId = this.taggedSkillMisconceptionId;
    if (skillMisconceptionId) {
      if (typeof skillMisconceptionId === 'string' &&
          skillMisconceptionId.split('-').length === 2) {
        let skillId = skillMisconceptionId.split('-')[0];
        let misconceptionId = skillMisconceptionId.split('-')[1];
        let misconceptions = this.misconceptionsBySkill[skillId];

        for (let i = 0; i < misconceptions.length; i++) {
          if (misconceptions[i].getId().toString() ===
            misconceptionId) {
            this.misconceptionName = misconceptions[i].getName();
            this.selectedMisconception = misconceptions[i];
            this.selectedMisconceptionSkillId = skillId;
          }
        }
      } else {
        throw new Error(
          'Expected skillMisconceptionId to be ' +
              '<skillId>-<misconceptionId>.');
      }
    }
    this.feedbackIsUsed = true;
  }

  containsMisconceptions(): boolean {
    let containsMisconceptions = false;
    Object.keys(this.misconceptionsBySkill).forEach((skillId) => {
      if (this.misconceptionsBySkill[skillId].length > 0) {
        containsMisconceptions = true;
      }
    });
    return containsMisconceptions;
  }

  updateValues(newValues: MisconceptionUpdatedValues): void {
    this.selectedMisconception = (
      newValues.misconception);
    this.selectedMisconceptionSkillId = (
      newValues.skillId);
    this.feedbackIsUsed = (
      newValues.feedbackIsUsed);
  }

  tagAnswerGroupWithMisconception(): void {
    const modalRef: NgbModalRef = this.ngbModal.open(
      TagMisconceptionModalComponent, {
        backdrop: 'static',
        backdropClass: 'forced-modal-backdrop-stack-over',
        windowClass: 'forced-modal-stack-over'
      });
    modalRef.componentInstance.taggedSkillMisconceptionId = (
      this.taggedSkillMisconceptionId);
    modalRef.result.then((returnObject) => {
      this.selectedMisconception = returnObject.misconception;
      this.selectedMisconceptionSkillId = returnObject.misconceptionSkillId;
      this.feedbackIsUsed = returnObject.feedbackIsUsed;
      this.updateMisconception();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  updateMisconception(): void {
    let taggedMisconception = {
      skillId: this.selectedMisconceptionSkillId,
      misconceptionId: this.selectedMisconception.getId()
    };
    this.saveTaggedMisconception.emit(taggedMisconception);
    this.misconceptionName = this.selectedMisconception.getName();
    let outcome = cloneDeep(this.outcome);
    if (this.feedbackIsUsed) {
      outcome.feedback.html = (
        this.selectedMisconception.getFeedback());
      this.saveAnswerGroupFeedback.emit(outcome);
      this.externalSaveService.onExternalSave.emit();
    }
    this.misconceptionEditorIsOpen = false;
  }

  editMisconception(): void {
    this.misconceptionEditorIsOpen = true;
  }
}

angular.module('oppia').directive('oppiaQuestionMisconceptionEditor',
  downgradeComponent({component: QuestionMisconceptionEditorComponent}));
