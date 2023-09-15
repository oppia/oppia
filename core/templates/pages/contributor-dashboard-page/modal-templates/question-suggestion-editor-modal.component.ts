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
 * @fileoverview component for question suggestion editor modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { AppConstants } from 'app.constants';
import { MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';
import { Question } from 'domain/question/QuestionObjectFactory';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ConfirmQuestionExitModalComponent } from 'components/question-directives/modal-templates/confirm-question-exit-modal.component';
import { QuestionsOpportunitiesSelectDifficultyModalComponent } from 'pages/topic-editor-page/modal-templates/questions-opportunities-select-difficulty-modal.component';
import { ContextService } from 'services/context.service';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { QuestionSuggestionBackendApiService } from 'pages/contributor-dashboard-page/services/question-suggestion-backend-api.service';
import { QuestionValidationService } from 'services/question-validation.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';

@Component({
  selector: 'oppia-question-suggestion-editor-modal',
  templateUrl: './question-suggestion-editor-modal.component.html'
})
export class QuestionSuggestionEditorModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() question!: Question;
  @Input() questionStateData!: State;
  @Input() questionId!: string;
  @Input() skill!: Skill;
  @Input() skillDifficulty!: number;
  @Input() suggestionId!: string;

  canEditQuestion!: boolean;
  newQuestionIsBeingCreated!: boolean;
  isEditing!: boolean;
  misconceptionsBySkill!: MisconceptionSkillMap;
  skillId!: string;
  skillDifficultyString!: string;

  constructor(
    private questionUndoRedoService: QuestionUndoRedoService,
    private questionSuggestionBackendApiService:
      QuestionSuggestionBackendApiService,
    private alertsService: AlertsService,
    private contextService: ContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private siteAnalyticsService: SiteAnalyticsService,
    private ngbModal: NgbModal,
    private ngbActiveModal: NgbActiveModal,
    private questionValidationService: QuestionValidationService,
    private contributionAndReviewService: ContributionAndReviewService,
  ) {
    super(ngbActiveModal);
  }

  cancel(): void {
    if (this.questionUndoRedoService.hasChanges()) {
      this.ngbModal.open(ConfirmQuestionExitModalComponent, {
        backdrop: true,
      }).result.then(() => {
        this.ngbActiveModal.dismiss('cancel');
        this.imageLocalStorageService.flushStoredImagesData();
        this.contextService.resetImageSaveDestination();
      }, () => {
        // Note to developers:
        // This callback is triggered when the cancel button is clicked.
        // No further action is needed.
      });
    } else {
      this.imageLocalStorageService.flushStoredImagesData();
      this.contextService.resetImageSaveDestination();
      this.ngbActiveModal.dismiss('cancel');
    }
  }

  onClickChangeDifficulty(): void {
    const modalRef: NgbModalRef = this.ngbModal.open(
      QuestionsOpportunitiesSelectDifficultyModalComponent, {
        backdrop: true,
      });

    modalRef.componentInstance.skillId = this.skillId;
    modalRef.result.then((result) => {
      if (this.alertsService.warnings.length === 0) {
        this.skillDifficulty = result.skillDifficulty;
        this.setDifficultyString(this.skillDifficulty);
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  // Checking if Question contains all requirements to enable
  // Save and Publish Question.
  isQuestionValid(): boolean {
    return this.questionValidationService.isQuestionValid(
      this.question, this.misconceptionsBySkill);
  }

  getQuestionValidationErrorMessage(): string | null {
    return this.questionValidationService.getValidationErrorMessage(
      this.question);
  }

  done(): void {
    if (!this.isQuestionValid()) {
      return;
    }
    if (!this.questionUndoRedoService.hasChanges()) {
      this.alertsService.addInfoMessage(
        'No changes detected.', 5000);
      return;
    }
    this.siteAnalyticsService.registerContributorDashboardSubmitSuggestionEvent(
      'Question');
    const imagesData = this.imageLocalStorageService.getStoredImagesData();
    this.imageLocalStorageService.flushStoredImagesData();
    this.contextService.resetImageSaveDestination();
    if (this.isEditing) {
      const questionDict = this.question.toBackendDict(false);
      this.contributionAndReviewService.updateQuestionSuggestionAsync(
        this.suggestionId,
        this.skillDifficulty,
        questionDict.question_state_data,
        questionDict.next_content_id_index,
        imagesData,
        () => {
          this.alertsService.addSuccessMessage('Updated question.');
        },
        () => {});
      this.ngbActiveModal.close({
        questionDict: questionDict,
        skillDifficulty: this.skillDifficulty
      });
    } else {
      this.questionSuggestionBackendApiService.submitSuggestionAsync(
        this.question, this.skill, this.skillDifficulty,
        imagesData).then(
        () => {
          this.alertsService.addSuccessMessage(
            'Submitted question for review.');
        });
      this.ngbActiveModal.close();
    }
  }

  setDifficultyString(skillDifficulty: number): void {
    // This throws "Object is possibly undefined." The type undefined
    // comes here from Object dependency. We need to suppress this
    // error because of strict type checking.
    // @ts-ignore
    this.skillDifficultyString = Object.entries(
      AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT).find(
      entry => entry[1] === skillDifficulty)[0];
  }

  ngOnInit(): void {
    this.canEditQuestion = true;
    this.newQuestionIsBeingCreated = true;
    this.isEditing = (
      this.suggestionId !== '' ? true : false);
    this.misconceptionsBySkill = {};
    this.misconceptionsBySkill[this.skill.getId()] = (
      this.skill.getMisconceptions());
    this.contextService.setCustomEntityContext(
      AppConstants.IMAGE_CONTEXT.QUESTION_SUGGESTIONS,
      this.skill.getId()
    );

    this.setDifficultyString(this.skillDifficulty);

    this.skillId = this.skill.getId();
  }
}
