// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Common service for the exploration conversation skin,
 * extracting functionalities from the old skin to utilize in the new skin
 * and minimize duplication of code.
 */

import {StateCard} from 'domain/state_card/state-card.model';
import {EventEmitter, Injectable} from '@angular/core';
import {downgradeInjectable} from '@angular/upgrade/static';
import {AudioPlayerService} from 'services/audio-player.service';
import {ConceptCardBackendApiService} from 'domain/skill/concept-card-backend-api.service';
import {ContentTranslationLanguageService} from '../services/content-translation-language.service';
import {ContentTranslationManagerService} from '../services/content-translation-manager.service';
import {ExplorationPlayerStateService} from '../services/exploration-player-state.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {LearnerParamsService} from '../services/learner-params.service';
import {PlayerPositionService} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {QuestionPlayerEngineService} from '../services/question-player-engine.service';
import {StatsReportingService} from '../services/stats-reporting.service';
import {QuestionPlayerStateService} from 'components/question-directives/question-player/services/question-player-state.service';
import {InteractionRulesService} from '../services/answer-classification.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {AppConstants} from 'app.constants';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {ConceptCard} from 'domain/skill/concept-card.model';
import {CurrentInteractionService} from './current-interaction.service';
import {BindableVoiceovers} from 'domain/exploration/recorded-voiceovers.model';

// Note: This file should be assumed to be in an IIFE, and the constants below
// should only be used within this file.
const TIME_FADEIN_MSEC = 100;
const TIME_NUM_CARDS_CHANGE_MSEC = 500;

@Injectable({
  providedIn: 'root',
})
export class ConversationSkinService {
  // The minimum width, in pixels, needed to be able to show two cards
  // side-by-side.
  TIME_PADDING_MSEC = 250;
  TIME_SCROLL_MSEC = 600;
  MIN_CARD_LOADING_DELAY_MSEC = 950;

  displayedCard!: StateCard;
  nextCard!: StateCard | null;
  nextCardIfStuck!: StateCard | null;
  conceptCard!: ConceptCard;

  isAnimatingToTwoCards!: boolean;
  isAnimatingToOneCard!: boolean;
  pendingCardWasSeenBefore!: boolean;

  // 'completedChaptersCount' is fetched via a HTTP request.
  // Until the response is received, it remains undefined.
  completedChaptersCount!: number | undefined;
  _editorPreviewMode!: boolean;
  _nextFocusLabel!: string | null;
  upcomingInlineInteractionHtml!: string | null;

  moveToExploration!: boolean;
  explorationActuallyStarted!: boolean;
  questionSessionCompleted!: boolean;
  answerIsBeingProcessed: boolean = false;
  answerIsCorrect: boolean = false;

  private _onGiveFeedbackAndStayOnCurrentCard = new EventEmitter<{
    feedbackHtml: string | null;
    missingPrerequisiteSkillId: string | null;
    refreshInteraction: boolean;
    refresherExplorationId: string | null;
  }>();

  private _onMoveToNewCard = new EventEmitter<{
    feedbackHtml: string | null;
    isFinalQuestion: boolean;
    nextCard: StateCard;
  }>();

  private _onShowUpcomingCard = new EventEmitter<void>();
  private _onShowPendingCard = new EventEmitter<void>();

  constructor(
    private audioPlayerService: AudioPlayerService,
    private conceptCardBackendApiService: ConceptCardBackendApiService,
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private focusManagerService: FocusManagerService,
    private learnerParamsService: LearnerParamsService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private questionPlayerStateService: QuestionPlayerStateService,
    private statsReportingService: StatsReportingService,
    private windowDimensionsService: WindowDimensionsService,
    private currentInteractionService: CurrentInteractionService
  ) {}

  handleNewCardAddition(newCard: StateCard): void {
    this.playerTranscriptService.addNewCard(newCard);
    const explorationLanguageCode =
      this.explorationPlayerStateService.getLanguageCode();
    const selectedLanguageCode =
      this.contentTranslationLanguageService.getCurrentContentLanguageCode();
    if (explorationLanguageCode !== selectedLanguageCode) {
      this.contentTranslationManagerService.displayTranslations(
        selectedLanguageCode
      );
    }

    let totalNumCards = this.playerTranscriptService.getNumCards();

    let previousSupplementalCardIsNonempty =
      totalNumCards > 1 &&
      this.isSupplementalCardNonempty(
        this.playerTranscriptService.getCard(totalNumCards - 2)
      );

    let nextSupplementalCardIsNonempty = this.isSupplementalCardNonempty(
      this.playerTranscriptService.getLastCard()
    );

    if (
      totalNumCards > 1 &&
      this.canWindowShowTwoCards() &&
      !previousSupplementalCardIsNonempty &&
      nextSupplementalCardIsNonempty
    ) {
      this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
      this.animateToTwoCards(function () {});
    } else if (
      totalNumCards > 1 &&
      this.canWindowShowTwoCards() &&
      previousSupplementalCardIsNonempty &&
      !nextSupplementalCardIsNonempty
    ) {
      this.animateToOneCard(() => {
        this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
      });
    } else {
      this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
    }
    this.playerPositionService.changeCurrentQuestion(
      this.playerPositionService.getDisplayedCardIndex()
    );
  }

  canSubmitAnswerSafely(): boolean {
    // Safety check to prevent double submissions from occurring.
    if (
      this.answerIsBeingProcessed ||
      !this.isCurrentCardAtEndOfTranscript() ||
      this.displayedCard.isCompleted()
    ) {
      return false;
    }
    return true;
  }

  submitAnswerNavigation(
    answer: string,
    interactionRulesService: InteractionRulesService
  ): void {
    let timeAtServerCall = new Date().getTime();
    this.playerPositionService.recordAnswerSubmission();
    let currentEngineService =
      this.explorationPlayerStateService.getCurrentEngineService();
    this.answerIsCorrect = currentEngineService.submitAnswer(
      answer,
      interactionRulesService,
      (
        nextCard: StateCard,
        refreshInteraction: boolean,
        feedbackHtml: string,
        feedbackAudioTranslations: BindableVoiceovers,
        refresherExplorationId: string,
        missingPrerequisiteSkillId: string,
        remainOnCurrentCard: boolean,
        taggedSkillMisconceptionId: string,
        wasOldStateInitial: boolean,
        isFirstHit: boolean,
        isFinalQuestion: boolean,
        nextCardIfReallyStuck: StateCard | null,
        focusLabel: string
      ) => {
        this.nextCard = nextCard;
        this.nextCardIfStuck = nextCardIfReallyStuck;
        if (
          !this._editorPreviewMode &&
          !this.explorationPlayerStateService.isPresentingIsolatedQuestions()
        ) {
          let oldStateName = this.playerPositionService.getCurrentStateName();
          if (!remainOnCurrentCard) {
            this.statsReportingService.recordStateTransition(
              oldStateName,
              nextCard.getStateName(),
              answer,
              this.learnerParamsService.getAllParams(),
              isFirstHit,
              String(
                this.completedChaptersCount && this.completedChaptersCount + 1
              ),
              String(this.playerTranscriptService.getNumCards()),
              currentEngineService.getLanguageCode()
            );

            this.statsReportingService.recordStateCompleted(oldStateName);
          }
          if (nextCard.isTerminal()) {
            this.statsReportingService.recordStateCompleted(
              nextCard.getStateName()
            );
          }
          if (wasOldStateInitial && !this.explorationActuallyStarted) {
            this.statsReportingService.recordExplorationActuallyStarted(
              oldStateName
            );
            this.explorationActuallyStarted = true;
          }
        }

        if (
          !this.explorationPlayerStateService.isPresentingIsolatedQuestions()
        ) {
          this.explorationPlayerStateService.onPlayerStateChange.emit(
            nextCard.getStateName()
          );
        } else if (
          this.explorationPlayerStateService.isInQuestionPlayerMode()
        ) {
          this.questionPlayerStateService.answerSubmitted(
            this.questionPlayerEngineService.getCurrentQuestion(),
            !remainOnCurrentCard,
            taggedSkillMisconceptionId
          );
        }

        let millisecsLeftToWait: number;
        if (!this.displayedCard.isInteractionInline()) {
          // Do not wait if the interaction is supplemental -- there's
          // already a delay bringing in the help card.
          millisecsLeftToWait = 1.0;
        } else if (
          this.explorationPlayerStateService.isInDiagnosticTestPlayerMode()
        ) {
          // Do not wait if the player mode is the diagnostic test. Since no
          // feedback will be presented after attempting a question so delaying
          // is not required.
          millisecsLeftToWait = 1.0;
        } else {
          millisecsLeftToWait = Math.max(
            this.MIN_CARD_LOADING_DELAY_MSEC -
              (new Date().getTime() - timeAtServerCall),
            1.0
          );
        }

        setTimeout(() => {
          this.explorationPlayerStateService.onOppiaFeedbackAvailable.emit();

          this.audioPlayerService.onAutoplayAudio.emit({
            audioTranslations: feedbackAudioTranslations,
            html: feedbackHtml,
            componentName: AppConstants.COMPONENT_NAME_FEEDBACK,
          });

          if (remainOnCurrentCard) {
            this.onGiveFeedbackAndStayOnCurrentCard.emit({
              feedbackHtml,
              missingPrerequisiteSkillId,
              refreshInteraction,
              refresherExplorationId,
            });
          } else {
            this.onMoveToNewCard.emit({
              feedbackHtml,
              isFinalQuestion,
              nextCard,
            });
          }
          this.answerIsBeingProcessed = false;
        }, millisecsLeftToWait);
      }
    );
  }

  processFeedbackAndPrerequisiteSkills(
    feedbackHtml: string,
    missingPrerequisiteSkillId: string | null
  ): void {
    this.playerTranscriptService.addNewResponse(feedbackHtml);
    let helpCardAvailable = false;
    if (feedbackHtml && !this.displayedCard.isInteractionInline()) {
      helpCardAvailable = true;
    }

    if (helpCardAvailable) {
      this.playerPositionService.onHelpCardAvailable.emit({
        helpCardHtml: feedbackHtml,
        hasContinueButton: false,
      });
    }
    if (missingPrerequisiteSkillId) {
      this.displayedCard.markAsCompleted();
      this.conceptCardBackendApiService
        .loadConceptCardsAsync([missingPrerequisiteSkillId])
        .then(conceptCardObject => {
          this.conceptCard = conceptCardObject[0];
          if (helpCardAvailable) {
            this.playerPositionService.onHelpCardAvailable.emit({
              helpCardHtml: feedbackHtml,
              hasContinueButton: true,
            });
          }
        });
    }
  }

  handleFinalQuestionNavigation(feedbackHtml: string | null): void {
    if (this.explorationPlayerStateService.isInQuestionPlayerMode()) {
      // We will redirect to the results page here.
      this.questionSessionCompleted = true;
    }
    this.moveToExploration = true;
    if (feedbackHtml) {
      this.playerTranscriptService.addNewResponse(feedbackHtml);
      if (!this.displayedCard.isInteractionInline()) {
        this.playerPositionService.onHelpCardAvailable.emit({
          helpCardHtml: feedbackHtml,
          hasContinueButton: true,
        });
      }
    } else {
      this.onShowUpcomingCard.emit();
    }
    this.answerIsBeingProcessed = false;
  }

  handleFeedbackNavigation(
    feedbackHtml: string | null,
    nextCard: StateCard
  ): void {
    let _isNextInteractionInline = this.nextCard?.isInteractionInline();
    this.upcomingInlineInteractionHtml = _isNextInteractionInline
      ? this.nextCard?.getInteractionHtml() ?? ''
      : '';

    if (feedbackHtml) {
      if (
        this.playerTranscriptService.hasEncounteredStateBefore(
          nextCard.getStateName()
        )
      ) {
        this.pendingCardWasSeenBefore = true;
      }
      this.playerTranscriptService.addNewResponse(feedbackHtml);
      if (!this.displayedCard.isInteractionInline()) {
        this.playerPositionService.onHelpCardAvailable.emit({
          helpCardHtml: feedbackHtml,
          hasContinueButton: true,
        });
      }
      this.playerPositionService.onNewCardAvailable.emit();
      this._nextFocusLabel =
        ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL;
      this.focusManagerService.setFocusIfOnDesktop(this._nextFocusLabel);
      this.scrollToBottom();
    } else {
      this.playerTranscriptService.addNewResponse(feedbackHtml as string);
      // If there is no feedback, it immediately moves on
      // to next card. Therefore this.answerIsCorrect needs
      // to be set to false before it proceeds to next card.
      this.answerIsCorrect = false;
      this.onShowPendingCard.emit();
    }
  }

  submitAnswerFromProgressNav(): void {
    this.displayedCard.toggleSubmitClicked(true);
    this.currentInteractionService.submitAnswer();
  }

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return (
      this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX
    );
  }

  animateToTwoCards(doneCallback: () => void): void {
    this.isAnimatingToTwoCards = true;
    setTimeout(
      () => {
        this.isAnimatingToTwoCards = false;
        if (doneCallback) {
          doneCallback();
        }
      },
      TIME_NUM_CARDS_CHANGE_MSEC + TIME_FADEIN_MSEC + this.TIME_PADDING_MSEC
    );
  }

  animateToOneCard(doneCallback: () => void): void {
    this.isAnimatingToOneCard = true;
    setTimeout(() => {
      this.isAnimatingToOneCard = false;
      if (doneCallback) {
        doneCallback();
      }
    }, TIME_NUM_CARDS_CHANGE_MSEC);
  }

  isSupplementalCardNonempty(card: StateCard): boolean {
    return !card.isInteractionInline();
  }

  isCurrentSupplementalCardNonempty(): boolean {
    return (
      this.displayedCard && this.isSupplementalCardNonempty(this.displayedCard)
    );
  }

  isCurrentCardAtEndOfTranscript(): boolean {
    return this.playerTranscriptService.isLastCard(
      this.playerPositionService.getDisplayedCardIndex()
    );
  }

  scrollToBottom(): void {
    setTimeout(() => {
      let tutorCard = $('.conversation-skin-main-tutor-card');

      if (tutorCard && tutorCard.length === 0) {
        return;
      }
      let tutorCardBottom =
        (tutorCard?.offset()?.top ?? 0) + (tutorCard?.outerHeight() ?? 0);
      if (
        ($(window)?.scrollTop() ?? 0) + ($(window)?.height() ?? 0) <
        tutorCardBottom
      ) {
        $('html, body').animate(
          {
            scrollTop: tutorCardBottom - ($(window)?.height() ?? 0) + 12,
          },
          {
            duration: this.TIME_SCROLL_MSEC,
            easing: 'easeOutQuad',
          }
        );
      }
    }, 100);
  }

  get onGiveFeedbackAndStayOnCurrentCard(): EventEmitter<{
    feedbackHtml: string | null;
    missingPrerequisiteSkillId: string | null;
    refreshInteraction: boolean;
    refresherExplorationId: string | null;
  }> {
    return this._onGiveFeedbackAndStayOnCurrentCard;
  }

  get onMoveToNewCard(): EventEmitter<{
    feedbackHtml: string | null;
    isFinalQuestion: boolean;
    nextCard: StateCard;
  }> {
    return this._onMoveToNewCard;
  }

  get onShowPendingCard(): EventEmitter<void> {
    return this._onShowPendingCard;
  }

  get onShowUpcomingCard(): EventEmitter<void> {
    return this._onShowUpcomingCard;
  }
}

angular
  .module('oppia')
  .factory(
    'ConversationSkinService',
    downgradeInjectable(ConversationSkinService)
  );
