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
 * @fileoverview Component for question suggestion review modal.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextService } from 'services/context.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';
import { QuestionSuggestionEditorModalComponent } from './question-suggestion-editor-modal.component';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { ContributionOpportunitiesService } from 'pages/contributor-dashboard-page/services/contribution-opportunities.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { ThreadDataBackendApiService } from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';
import { AppConstants } from 'app.constants';
import { ParamDict } from 'services/suggestion-modal.service';
import { MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';
import { Question } from 'domain/question/QuestionObjectFactory';

interface QuestionSuggestionModalValue {
  suggestionId: any;
  suggestion: any;
  reviewable: any;
  question: any;
}

@Component({
  selector: 'oppia-question-suggestion-review-modal',
  templateUrl: './question-suggestion-review.component.html'
})
export class QuestionSuggestionReviewModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  @Input() authorName: any;
  @Input() contentHtml: any;
  @Input() reviewable: boolean;
  @Input() question: Question;
  @Input() questionHeader: any;
  @Input() suggestion: any;
  @Input() skillRubrics: any;
  @Input() suggestionId: any;
  @Input() skillDifficulty: any;
  @Input() misconceptionsBySkill: MisconceptionSkillMap;

  @Output() editSuggestionEmitter = (
    new EventEmitter<QuestionSuggestionModalValue>());

  reviewMessage: string;
  questionStateData: any;
  questionId: any;
  canEditQuestion: any;
  skillDifficultyLabel: any;
  skillRubricExplanations: any;
  suggestionIsRejected: any;
  validationError: any;

  constructor(
    private skillBackendApiService: SkillBackendApiService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private siteAnalyticsService: SiteAnalyticsService,
    private suggestionModalService: SuggestionModalService,
    private threadDataBackendApiService: ThreadDataBackendApiService,
    private contextService: ContextService,
    private ngbActiveModal: NgbActiveModal,
    private ngbModal: NgbModal,
  ) {
    super(ngbActiveModal);
  }

  cancel(): void {
    this.suggestionModalService.cancelSuggestion(this.ngbActiveModal);
  }

  edit(): void {
    this.ngbActiveModal.dismiss();
    this.skillBackendApiService.fetchSkillAsync(
      this.suggestion.change.skill_id).then((skillDict) => {
      let modalRef = this.ngbModal.open(
        QuestionSuggestionEditorModalComponent, {
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
        });

      modalRef.componentInstance.suggestionId = this.suggestionId;
      modalRef.componentInstance.question = this.question;
      modalRef.componentInstance.questionId = '';
      modalRef.componentInstance.questionStateData = (
        this.question.getStateData());
      modalRef.componentInstance.skill = skillDict.skill;
      modalRef.componentInstance.skillDifficulty = this.skillDifficulty;

      modalRef.result.then(() => {
        this.editSuggestionEmitter.emit(
          {
            suggestionId: this.suggestionId,
            suggestion: this.suggestion,
            reviewable: this.reviewable,
            question: this.question
          });
      }, () => {
        this.contextService.resetImageSaveDestination();
        this.editSuggestionEmitter.emit({
          suggestionId: this.suggestionId,
          suggestion: this.suggestion,
          reviewable: this.reviewable,
          question: undefined
        });
      });
    });
  }

  reject(): void {
    this.contributionOpportunitiesService.removeOpportunitiesEventEmitter.emit(
      [this.suggestionId]);
    this.siteAnalyticsService.registerContributorDashboardRejectSuggestion(
      'Question');
    this.suggestionModalService.rejectSuggestion(
      this.ngbActiveModal, {
        action: AppConstants.ACTION_REJECT_SUGGESTION,
        reviewMessage: this.reviewMessage
      } as ParamDict);
  }

  accept(): void {
    this.contributionOpportunitiesService.removeOpportunitiesEventEmitter.emit(
      [this.suggestionId]);
    this.siteAnalyticsService.registerContributorDashboardAcceptSuggestion(
      'Question');
    this.suggestionModalService.acceptSuggestion(
      this.ngbActiveModal, {
        action: AppConstants.ACTION_ACCEPT_SUGGESTION,
        reviewMessage: this.reviewMessage,
        skillDifficulty: this.skillDifficulty
      } as unknown as any);
  }

  init(): void {
    if (this.reviewable) {
      this.siteAnalyticsService
        .registerContributorDashboardViewSuggestionForReview('Question');
    } else if (this.suggestionIsRejected) {
      this._getThreadMessagesAsync(this.suggestionId);
    }
  }

  invertMap(originalMap: any): any {
    return Object.keys(originalMap).reduce(
      (invertedMap, key) => {
        invertedMap[originalMap[key]] = key;
        return invertedMap;
      },
      {}
    );
  }

  getSkillDifficultyLabel(): any {
    const skillDifficultyFloatToLabel = this.invertMap(
      AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT);
    return skillDifficultyFloatToLabel[this.skillDifficulty];
  }

  getRubricExplanation(skillDifficultyLabel: any): string {
    for (const rubric of this.skillRubrics) {
      if (rubric.difficulty === skillDifficultyLabel) {
        return rubric.explanations;
      }
    }

    return 'This rubric has not yet been specified.';
  }

  _getThreadMessagesAsync(threadId: string): any {
    return this.threadDataBackendApiService.fetchMessagesAsync(
      threadId).then((response) => {
      const threadMessageBackendDicts = response.messages;
      this.reviewMessage = threadMessageBackendDicts.map(
        m => ThreadMessage.createFromBackendDict(m))[1].text;
    });
  }

  questionChanged(): void {
    this.validationError = null;
  }

  ngOnInit(): void {
    this.reviewMessage = '';

    this.questionStateData = this.question.getStateData();
    this.questionId = this.question.getId();
    this.canEditQuestion = false;
    this.skillDifficultyLabel = this.getSkillDifficultyLabel();
    this.skillRubricExplanations = this.getRubricExplanation(
      this.skillDifficultyLabel);
    this.reviewMessage = '';
    this.suggestionIsRejected = this.suggestion.status === 'rejected';
    this.init();
  }
}

angular.module('oppia').directive('oppiaQuestionSuggestionReviewModal',
  downgradeComponent({
    component: QuestionSuggestionReviewModalComponent
  }) as angular.IDirectiveFactory);
