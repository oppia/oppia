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
import { AppConstants } from 'app.constants';
import { MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';
import { Question, QuestionBackendDict, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { State } from 'domain/state/StateObjectFactory';
import { SuggestionBackendDict } from 'domain/suggestion/suggestion.model';
import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { QuestionSuggestionEditorModalComponent } from './question-suggestion-editor-modal.component';
import { ContextService } from 'services/context.service';
import { ContributionOpportunitiesService } from 'pages/contributor-dashboard-page/services/contribution-opportunities.service';
import { ParamDict } from 'services/suggestion-modal.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { ThreadDataBackendApiService } from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';

interface QuestionSuggestionModalValue {
  suggestionId: string;
  suggestion: SuggestionBackendDict;
  reviewable: boolean;
  question: Question;
}

interface SkillRubrics {
  difficulty: string;
  explanations: string[] | string;
}

interface ActiveContributionDetailsDict {
  skill_description: string;
  skill_rubrics: SkillRubrics[];
  'chapter_title': string;
  'story_title': string;
  'topic_name': string;
}

interface SuggestionChangeValue {
  html: string;
}

interface SuggestionChangeDict {
  'skill_difficulty': number;
  'question_dict': QuestionBackendDict;
  'new_value': SuggestionChangeValue;
  'old_value': SuggestionChangeValue;
  'skill_id'?: string;
  'cmd': string;
  'content_html': string | string[];
  'content_id': string;
  'data_format': string;
  'language_code': string;
  'state_name': string;
  'translation_html': string;
}

interface ActiveSuggestionDict {
  'author_name': string;
  'change': SuggestionChangeDict;
  'exploration_content_html': string | string[];
  'language_code': string;
  'last_updated_msecs': number;
  'status': string;
  'suggestion_id': string;
  'suggestion_type': string;
  'target_id': string;
  'target_type': string;
}

interface ActiveContributionDict {
  'details': ActiveContributionDetailsDict | null;
  'suggestion': ActiveSuggestionDict;
}

@Component({
  selector: 'oppia-question-suggestion-review-modal',
  templateUrl: './question-suggestion-review.component.html'
})
export class QuestionSuggestionReviewModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  @Input() reviewable: boolean;
  @Input() suggestionId: string;
  @Input() misconceptionsBySkill: MisconceptionSkillMap;

  @Output() editSuggestionEmitter = (
    new EventEmitter<QuestionSuggestionModalValue>());

  reviewMessage: string;
  questionStateData: State;
  questionId: string;
  canEditQuestion: boolean;
  skillDifficultyLabel: string;
  skillRubricExplanations: string | string[];
  suggestionIsRejected: boolean;
  validationError: unknown;
  allContributions!: Record<string, ActiveContributionDict>;
  suggestion!: ActiveSuggestionDict;
  question!: Question;
  skillDifficulty!: number;
  currentSuggestionId!: string;
  isFirstItem: boolean = true;
  isLastItem: boolean = true;
  remainingContributionIdStack!: string[];
  skippedContributionIds!: string[];
  showQuestion: boolean = true;
  skillRubrics!: SkillRubrics[];
  currentSuggestion: ActiveContributionDict;
  suggestionIdToContribution!: Record<string, ActiveContributionDict>;
  contentHtml!: string;
  questionHeader!: string;
  authorName!: string;

  constructor(
    private contextService: ContextService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private ngbActiveModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private siteAnalyticsService: SiteAnalyticsService,
    private skillBackendApiService: SkillBackendApiService,
    private suggestionModalService: SuggestionModalService,
    private threadDataBackendApiService: ThreadDataBackendApiService,
    private questionObjectFactory: QuestionObjectFactory,
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
      const modalRef = this.ngbModal.open(
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
            suggestion: this.suggestion as SuggestionBackendDict,
            reviewable: this.reviewable,
            question: this.question
          });
      }, () => {
        this.contextService.resetImageSaveDestination();
        this.editSuggestionEmitter.emit({
          suggestionId: this.suggestionId,
          suggestion: this.suggestion as SuggestionBackendDict,
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
      });
  }

  refreshActiveContributionState(): void {
    const nextContribution = this.allContributions[
      this.currentSuggestionId];
    this.suggestion = nextContribution.suggestion;

    this.isLastItem = this.remainingContributionIdStack.length === 0;
    this.isFirstItem = this.skippedContributionIds.length === 0;

    if (!nextContribution.details) {
      this.cancel();
      return;
    }

    this.skillBackendApiService.fetchSkillAsync(
      this.suggestion.change.skill_id
    ).then((skillDict) => {
      let misconceptionsBySkill = {};
      const skill = skillDict.skill;
      misconceptionsBySkill[skill.getId()] = skill.getMisconceptions();
      this.misconceptionsBySkill = misconceptionsBySkill;
      this.refreshContributionState();
    });
  }

  goToNextItem(): void {
    if (this.isLastItem) {
      return;
    }
    this.showQuestion = false;
    this.skippedContributionIds.push(this.currentSuggestionId);

    this.currentSuggestionId = this.remainingContributionIdStack.pop();

    this.refreshActiveContributionState();
  }

  goToPreviousItem(): void {
    if (this.isFirstItem) {
      return;
    }
    this.showQuestion = false;
    this.remainingContributionIdStack.push(this.currentSuggestionId);

    this.currentSuggestionId = this.skippedContributionIds.pop();

    this.refreshActiveContributionState();
  }

  invertMap(originalMap: Object): Object {
    return Object.keys(originalMap).reduce(
      (invertedMap, key) => {
        invertedMap[originalMap[key]] = key;
        return invertedMap;
      },
      {}
    );
  }

  getSkillDifficultyLabel(): string {
    const skillDifficultyFloatToLabel = this.invertMap(
      AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT);
    return skillDifficultyFloatToLabel[this.skillDifficulty];
  }

  getRubricExplanation(skillDifficultyLabel: string): string[] | string {
    for (const rubric of this.skillRubrics) {
      if (rubric.difficulty === skillDifficultyLabel) {
        return rubric.explanations;
      }
    }

    return 'This rubric has not yet been specified.';
  }

  _getThreadMessagesAsync(threadId: string): unknown {
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

  refreshContributionState(): void {
    this.suggestion = (
      this.allContributions[this.currentSuggestionId].suggestion);
    this.question = this.questionObjectFactory.createFromBackendDict(
      this.suggestion.change.question_dict);
    this.authorName = this.suggestion.author_name;
    this.contentHtml = this.question.getStateData().content.html;
    this.questionHeader = (
      this.allContributions[
        this.currentSuggestionId].details.skill_description);
    this.skillRubrics = (
      this.allContributions[
        this.currentSuggestionId].details.skill_rubrics);
    this.questionStateData = this.question.getStateData();
    this.questionId = this.question.getId();
    this.canEditQuestion = false;
    this.skillDifficulty = this.suggestion.change.skill_difficulty;
    this.skillDifficultyLabel = this.getSkillDifficultyLabel();
    this.skillRubricExplanations = this.getRubricExplanation(
      this.skillDifficultyLabel);
    this.suggestionIsRejected = this.suggestion.status === 'rejected';
    if (this.reviewable) {
      this.siteAnalyticsService
        .registerContributorDashboardViewSuggestionForReview('Question');
    } else if (this.suggestionIsRejected) {
      this._getThreadMessagesAsync(this.currentSuggestionId);
    }
    this.showQuestion = true;
  }

  ngOnInit(): void {
    this.currentSuggestionId = this.suggestionId;

    this.currentSuggestion = this.suggestionIdToContribution[this.suggestionId];
    delete this.suggestionIdToContribution[this.suggestionId];
    this.remainingContributionIdStack = Object.keys(
      this.suggestionIdToContribution
    ).reverse();
    this.skippedContributionIds = [];
    this.allContributions = this.suggestionIdToContribution;
    this.allContributions[this.suggestionId] = this.currentSuggestion;

    this.isLastItem = this.remainingContributionIdStack.length === 0;
    this.isFirstItem = this.skippedContributionIds.length === 0;
    this.reviewMessage = '';

    this.refreshContributionState();
  }
}

angular.module('oppia').directive('oppiaQuestionSuggestionReviewModal',
  downgradeComponent({
    component: QuestionSuggestionReviewModalComponent
  }) as angular.IDirectiveFactory);
