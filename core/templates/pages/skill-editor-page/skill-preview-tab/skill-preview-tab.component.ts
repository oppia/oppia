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
 * @fileoverview Component for the skill preview tab.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {QuestionBackendDict, Question} from 'domain/question/question.model';
import {Skill} from 'domain/skill/skill.model.ts';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExplorationPlayerConstants} from 'pages/exploration-player-page/current-lesson-player/exploration-player-page.constants';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {QuestionPlayerEngineService} from 'pages/exploration-player-page/services/question-player-engine.service';
import {Subscription} from 'rxjs';
import {PageContextService} from 'services/page-context.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {SkillEditorStateService} from '../services/skill-editor-state.service';
import {AlertsService} from 'services/alerts.service';

@Component({
  selector: 'oppia-skill-preview-tab',
  templateUrl: './skill-preview-tab.component.html',
})
export class SkillPreviewTabComponent implements OnInit, OnDestroy {
  constructor(
    private urlService: UrlService,
    private skillEditorStateService: SkillEditorStateService,
    private questionBackendApiService: QuestionBackendApiService,
    private pageContextService: PageContextService,
    private currentInteractionService: CurrentInteractionService,
    private conversationFlowService: ConversationFlowService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private windowDimensionsService: WindowDimensionsService,
    private alertsService: AlertsService
  ) {}

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  displayedCard!: StateCard;
  skillId!: string;
  questionTextFilter!: string;
  interactionFilter!: string;
  questionsFetched!: boolean;
  skill!: Skill;
  htmlData!: string;
  questionDicts!: QuestionBackendDict[];
  displayedQuestions!: QuestionBackendDict[];
  displayCardIsInitialized: boolean = false;
  ALLOWED_QUESTION_INTERACTIONS: string[] = [];
  QUESTION_COUNT: number = 20;
  page: number = 1;
  totalQuestionCount: number = 0;
  INTERACTION_TYPES = {
    ALL: 'All',
    TEXT_INPUT: 'Text Input',
    MULTIPLE_CHOICE: 'Multiple Choice',
    NUMERIC_INPUT: 'Numeric Input',
    ITEM_SELECTION: 'Item Selection',
  };

  directiveSubscriptions = new Subscription();

  ngOnInit(): void {
    const that = this;
    this.skillId = this.urlService.getSkillIdFromUrl();
    this.questionTextFilter = '';
    this.interactionFilter = this.INTERACTION_TYPES.ALL;
    this.questionsFetched = false;
    for (let interaction in this.INTERACTION_TYPES) {
      this.ALLOWED_QUESTION_INTERACTIONS.push(
        this.INTERACTION_TYPES[
          interaction as keyof typeof that.INTERACTION_TYPES
        ]
      );
    }
    this.skill = this.skillEditorStateService.getSkill();
    this.htmlData = this.skill
      ? this.skill.getConceptCard().getExplanation().html
      : 'loading review material';

    this.loadTotalQuestionCountAndPage();
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(() => {})
    );
    this.currentInteractionService.setOnSubmitFn(() => {
      this.conversationFlowService.onOppiaFeedbackAvailable.emit();
    });
  }

  /**
   * Fetches the total number of questions linked to this skill, then loads
   * page 1. The total count drives ngb-pagination's page-number display
   * (see #23453 - this replaced an earlier version that auto-fetched and
   * concatenated every page, since the maintainers asked for visible
   * Next/Previous page controls matching the Blog page's pagination UI
   * instead).
   */
  loadTotalQuestionCountAndPage(): void {
    this.questionBackendApiService
      .fetchTotalQuestionCountForSkillIdsAsync([this.skillId])
      .then(
        totalCount => {
          this.totalQuestionCount = totalCount;
          this.loadPage(this.page);
        },
        errorResponse => {
          this.alertsService.addWarning(
            'Failed to fetch the total question count for this skill.'
          );
        }
      );
  }

  /**
   * Loads a single page (QUESTION_COUNT questions) of the skill's linked
   * questions, using the deterministic paginated backend endpoint.
   */
  loadPage(page: number): void {
    this.questionsFetched = false;
    const offset = (page - 1) * this.QUESTION_COUNT;
    this.questionBackendApiService
      .fetchQuestionsForSkillPreviewPageAsync(
        this.skillId,
        this.QUESTION_COUNT,
        offset
      )
      .then(
        response => {
          this.questionsFetched = true;
          this.questionDicts = response.questionDicts;
          this.applyFilters();
          if (this.displayedQuestions.length) {
            this.selectQuestionToPreview(0);
          }
        },
        errorResponse => {
          this.questionsFetched = true;
          this.alertsService.addWarning(
            'Failed to fetch questions for this page. Please try again.'
          );
        }
      );
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadPage(page);
  }

  get firstQuestionOnPageNum(): number {
    if (this.totalQuestionCount === 0) {
      return 0;
    }
    return (this.page - 1) * this.QUESTION_COUNT + 1;
  }

  get lastQuestionOnPageNum(): number {
    return Math.min(this.page * this.QUESTION_COUNT, this.totalQuestionCount);
  }

  initializeQuestionCard(card: StateCard): void {
    this.displayCardIsInitialized = true;
    this.displayedCard = card;
  }

  applyFilters(): void {
    this.displayedQuestions = this.questionDicts.filter(questionDict => {
      var contentData = questionDict.question_state_data.content.html;
      var interactionType = questionDict.question_state_data.interaction.id;
      var htmlContentIsMatching = Boolean(
        contentData
          .toLowerCase()
          .includes(this.questionTextFilter.toLowerCase())
      );
      if (this.interactionFilter === this.INTERACTION_TYPES.ALL) {
        return htmlContentIsMatching;
      } else if (
        this.interactionFilter === this.INTERACTION_TYPES.TEXT_INPUT &&
        interactionType !== 'TextInput'
      ) {
        return false;
      } else if (
        this.interactionFilter === this.INTERACTION_TYPES.MULTIPLE_CHOICE &&
        interactionType !== 'MultipleChoiceInput'
      ) {
        return false;
      } else if (
        this.interactionFilter === this.INTERACTION_TYPES.ITEM_SELECTION &&
        interactionType !== 'ItemSelectionInput'
      ) {
        return false;
      } else if (
        this.interactionFilter === this.INTERACTION_TYPES.NUMERIC_INPUT &&
        interactionType !== 'NumericInput'
      ) {
        return false;
      }
      return htmlContentIsMatching;
    });
  }

  canWindowShowTwoCards(): boolean {
    return (
      this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX
    );
  }

  isCurrentSupplementalCardNonEmpty(): boolean {
    return this.displayedCard && !this.displayedCard.isInteractionInline();
  }

  selectQuestionToPreview(index: number): void {
    this.questionPlayerEngineService.clearQuestions();
    this.displayCardIsInitialized = false;
    this.questionPlayerEngineService.init(
      [Question.createFromBackendDict(this.displayedQuestions[index])],
      this.initializeQuestionCard.bind(this),
      () => {}
    );
  }

  ngOnDestroy(): void {
    this.pageContextService.clearQuestionPlayerIsOpen();
  }
}
