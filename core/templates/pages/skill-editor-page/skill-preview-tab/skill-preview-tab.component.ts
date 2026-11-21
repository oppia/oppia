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

@Component({
  selector: 'oppia-skill-preview-tab',
  templateUrl: './skill-preview-tab.component.html',
  styleUrls: ['./skill-preview-tab.component.css'],
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
    private windowDimensionsService: WindowDimensionsService
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
  questionDicts: QuestionBackendDict[] = [];
  totalPageCount: number = 0;
  currentPage: number = 0;
  // The page whose questions are currently displayed. It is only updated when
  // a fetch response actually replaces questionDicts, so a failed request can
  // be rolled back to the page whose questions are still shown.
  appliedPage: number = 0;
  // Whether totalPageCount reflects the real number of pages. It stays false
  // when the count request fails, in which case the end of the list is
  // detected from a page response that is shorter than a full page.
  totalPageCountIsKnown: boolean = false;
  displayedQuestions!: QuestionBackendDict[];
  displayCardIsInitialized: boolean = false;
  ALLOWED_QUESTION_INTERACTIONS: string[] = [];
  QUESTION_COUNT: number = 20;
  INTERACTION_TYPES = {
    ALL: 'All',
    TEXT_INPUT: 'Text Input',
    MULTIPLE_CHOICE: 'Multiple Choice',
    NUMERIC_INPUT: 'Numeric Input',
    ITEM_SELECTION: 'Item Selection',
  };

  directiveSubscriptions = new Subscription();
  // Incrementing id assigned to each question fetch. A response is only
  // applied when its id still matches the most recent request, so stale
  // responses are ignored even when an earlier and a newer request target
  // the same page.
  latestFetchRequestId: number = 0;

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
    this.fetchQuestionsForPage(this.currentPage);
    this.questionBackendApiService
      .fetchTotalQuestionCountForSkillIdsAsync([this.skillId])
      .then(response => {
        this.totalPageCount = Math.ceil(response / this.QUESTION_COUNT);
        this.totalPageCountIsKnown = true;
      })
      .catch(() => {
        // A failed count request must not lock pagination. Leave
        // totalPageCountIsKnown unchanged so a page response that already
        // established the last page is not undone; while the count is still
        // unknown, the end of the list is detected from a page response that
        // is shorter than a full page.
      });
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(() => {})
    );
    this.currentInteractionService.setOnSubmitFn(() => {
      this.conversationFlowService.onOppiaFeedbackAvailable.emit();
    });
  }

  private fetchQuestionsForPage(page: number): void {
    const requestId = ++this.latestFetchRequestId;
    this.questionBackendApiService
      .fetchQuestionsAsync([this.skillId], this.QUESTION_COUNT, false, page)
      .then(response => {
        // Ignore the response if a newer fetch has been started since this
        // one, even when both target the same page.
        if (requestId !== this.latestFetchRequestId) {
          return;
        }
        // When the total page count is unknown, a response with fewer
        // questions than requested marks the end of the list. An empty
        // response means the requested page does not exist, so keep showing
        // the last applied page and clamp the page count to exclude it.
        if (
          !this.totalPageCountIsKnown &&
          response.length < this.QUESTION_COUNT
        ) {
          this.totalPageCountIsKnown = true;
          if (response.length === 0) {
            this.totalPageCount = page;
            this.currentPage = this.appliedPage;
            // The request completed, so stop showing the loading state even
            // though the requested page has no questions. The empty response
            // is not assigned to questionDicts, so questions from the last
            // applied page stay displayed.
            this.questionsFetched = true;
            return;
          }
          this.totalPageCount = page + 1;
        }
        this.questionsFetched = true;
        this.questionDicts = response;
        // Remember the page whose questions are now shown, so a later failed
        // request rolls back here instead of to a page whose fetch never
        // completed.
        this.appliedPage = page;
        // Re-apply the active text and interaction filters to the newly
        // fetched page before selecting a question to preview, so the filters
        // stay applied on every page.
        this.applyFilters();
        if (this.displayedQuestions.length) {
          this.selectQuestionToPreview(0);
        }
      })
      .catch(() => {
        if (requestId !== this.latestFetchRequestId) {
          return;
        }
        // Restore the page whose questions are still displayed rather than
        // the page the failed request started from, which may itself be a
        // pending request that never applied its response.
        this.currentPage = this.appliedPage;
        // The request has completed (with an error), so clear the loading
        // state even when no page has been applied yet.
        this.questionsFetched = true;
      });
  }

  previousPage(): void {
    if (0 < this.currentPage) {
      this.currentPage -= 1;
      this.fetchQuestionsForPage(this.currentPage);
    }
  }

  nextPage(): void {
    // Paging forward stays available while the total page count is unknown,
    // so a failed count request does not block the user from viewing more
    // questions.
    if (
      !this.totalPageCountIsKnown ||
      this.currentPage < this.totalPageCount - 1
    ) {
      this.currentPage += 1;
      this.fetchQuestionsForPage(this.currentPage);
    }
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
