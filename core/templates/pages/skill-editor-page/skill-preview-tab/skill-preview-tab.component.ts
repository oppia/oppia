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
import {
  QuestionBackendDict,
  QuestionObjectFactory,
} from 'domain/question/QuestionObjectFactory';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExplorationPlayerConstants} from 'pages/exploration-player-page/exploration-player-page.constants';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {ExplorationPlayerStateService} from 'pages/exploration-player-page/services/exploration-player-state.service';
import {QuestionPlayerEngineService} from 'pages/exploration-player-page/services/question-player-engine.service';
import {Subscription} from 'rxjs';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {SkillEditorStateService} from '../services/skill-editor-state.service';

@Component({
  selector: 'oppia-skill-preview-tab',
  templateUrl: './skill-preview-tab.component.html',
})
export class SkillPreviewTabComponent implements OnInit, OnDestroy {
  constructor(
    private urlService: UrlService,
    private skillEditorStateService: SkillEditorStateService,
    private questionBackendApiService: QuestionBackendApiService,
    private contextService: ContextService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private currentInteractionService: CurrentInteractionService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private questionObjectFactory: QuestionObjectFactory,
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
  questionDicts!: QuestionBackendDict[];
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

    this.questionBackendApiService
      .fetchQuestionsAsync([this.skillId], this.QUESTION_COUNT, false)
      .then(response => {
        this.questionsFetched = true;
        this.questionDicts = response;
        this.displayedQuestions = response;
        if (this.questionDicts.length) {
          this.selectQuestionToPreview(0);
        }
      });
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(() => {})
    );
    this.currentInteractionService.setOnSubmitFn(() => {
      this.explorationPlayerStateService.onOppiaFeedbackAvailable.emit();
    });
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
      [
        this.questionObjectFactory.createFromBackendDict(
          this.displayedQuestions[index]
        ),
      ],
      this.initializeQuestionCard.bind(this),
      () => {}
    );
  }

  ngOnDestroy(): void {
    this.contextService.clearQuestionPlayerIsOpen();
  }
}
