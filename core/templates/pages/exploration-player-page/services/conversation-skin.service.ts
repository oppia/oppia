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
import {Injectable} from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class ConversationSkinService {
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
    private statsReportingService: StatsReportingService
  ) {}

  handleNewCardAddition(newCard: StateCard, component: any) {
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
      component.isSupplementalCardNonempty(
        this.playerTranscriptService.getCard(totalNumCards - 2)
      );

    let nextSupplementalCardIsNonempty = component.isSupplementalCardNonempty(
      this.playerTranscriptService.getLastCard()
    );

    if (
      totalNumCards > 1 &&
      component.canWindowShowTwoCards() &&
      !previousSupplementalCardIsNonempty &&
      nextSupplementalCardIsNonempty
    ) {
      this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
      component?.animateToTwoCards(function () {});
    } else if (
      totalNumCards > 1 &&
      component.canWindowShowTwoCards() &&
      previousSupplementalCardIsNonempty &&
      !nextSupplementalCardIsNonempty
    ) {
      component?.animateToOneCard(() => {
        this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
      });
    } else {
      this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
    }
    this.playerPositionService.changeCurrentQuestion(
      this.playerPositionService.getDisplayedCardIndex()
    );
  }

  submitAnswerNavigation(
    answer: string,
    interactionRulesService: InteractionRulesService,
    component: any
  ) {
    let timeAtServerCall = new Date().getTime();
    this.playerPositionService.recordAnswerSubmission();
    let currentEngineService =
      this.explorationPlayerStateService.getCurrentEngineService();
    component.answerIsCorrect = currentEngineService.submitAnswer(
      answer,
      interactionRulesService,
      (
        nextCard,
        refreshInteraction,
        feedbackHtml,
        feedbackAudioTranslations,
        refresherExplorationId,
        missingPrerequisiteSkillId,
        remainOnCurrentCard,
        taggedSkillMisconceptionId,
        wasOldStateInitial,
        isFirstHit,
        isFinalQuestion,
        nextCardIfReallyStuck,
        focusLabel
      ) => {
        component.nextCard = nextCard;
        component.nextCardIfStuck = nextCardIfReallyStuck;
        if (
          !component._editorPreviewMode &&
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
                component.completedChaptersCount &&
                  component.completedChaptersCount + 1
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
          if (wasOldStateInitial && !component.explorationActuallyStarted) {
            this.statsReportingService.recordExplorationActuallyStarted(
              oldStateName
            );
            component.explorationActuallyStarted = true;
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
        if (!component.displayedCard.isInteractionInline()) {
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
            component.MIN_CARD_LOADING_DELAY_MSEC -
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
            component.giveFeedbackAndStayOnCurrentCard(
              feedbackHtml,
              missingPrerequisiteSkillId,
              refreshInteraction,
              refresherExplorationId
            );
          } else {
            component.moveToNewCard(feedbackHtml, isFinalQuestion, nextCard);
          }
          component.answerIsBeingProcessed = false;
        }, millisecsLeftToWait);
      }
    );
  }

  processFeedbackAndPrerequisiteSkills(
    feedbackHtml: string | null,
    missingPrerequisiteSkillId: string | null,
    component: any
  ) {
    this.playerTranscriptService.addNewResponse(feedbackHtml);
    let helpCardAvailable = false;
    if (feedbackHtml && !component.displayedCard.isInteractionInline()) {
      helpCardAvailable = true;
    }

    if (helpCardAvailable) {
      this.playerPositionService.onHelpCardAvailable.emit({
        helpCardHtml: feedbackHtml,
        hasContinueButton: false,
      });
    }
    if (missingPrerequisiteSkillId) {
      component.displayedCard.markAsCompleted();
      this.conceptCardBackendApiService
        .loadConceptCardsAsync([missingPrerequisiteSkillId])
        .then(conceptCardObject => {
          component.conceptCard = conceptCardObject[0];
          if (helpCardAvailable) {
            this.playerPositionService.onHelpCardAvailable.emit({
              helpCardHtml: feedbackHtml,
              hasContinueButton: true,
            });
          }
        });
    }
  }

  handleFinalQuestionNavigation(
    feedbackHtml: string | null,
    isFinalQuestion: boolean,
    component: any
  ) {
    component.displayedCard.markAsCompleted();
    if (isFinalQuestion) {
      if (this.explorationPlayerStateService.isInQuestionPlayerMode()) {
        // We will redirect to the results page here.
        component.questionSessionCompleted = true;
      }
      component.moveToExploration = true;
      if (feedbackHtml) {
        this.playerTranscriptService.addNewResponse(feedbackHtml);
        if (!component.displayedCard.isInteractionInline()) {
          this.playerPositionService.onHelpCardAvailable.emit({
            helpCardHtml: feedbackHtml,
            hasContinueButton: true,
          });
        }
      } else {
        component.showUpcomingCard();
      }
      component.answerIsBeingProcessed = false;
      return;
    }
  }

  handleFeedbackNavigation(
    feedbackHtml: string | null,
    nextCard: StateCard,
    component: any
  ) {
    let _isNextInteractionInline = component.nextCard.isInteractionInline();
    component.upcomingInlineInteractionHtml = _isNextInteractionInline
      ? component.nextCard.getInteractionHtml()
      : '';

    if (feedbackHtml) {
      if (
        this.playerTranscriptService.hasEncounteredStateBefore(
          nextCard.getStateName()
        )
      ) {
        component.pendingCardWasSeenBefore = true;
      }
      this.playerTranscriptService.addNewResponse(feedbackHtml);
      if (!component.displayedCard.isInteractionInline()) {
        this.playerPositionService.onHelpCardAvailable.emit({
          helpCardHtml: feedbackHtml,
          hasContinueButton: true,
        });
      }
      this.playerPositionService.onNewCardAvailable.emit();
      component._nextFocusLabel =
        ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL;
      this.focusManagerService.setFocusIfOnDesktop(component._nextFocusLabel);
      component?.scrollToBottom();
    } else {
      this.playerTranscriptService.addNewResponse(feedbackHtml);
      // If there is no feedback, it immediately moves on
      // to next card. Therefore this.answerIsCorrect needs
      // to be set to false before it proceeds to next card.
      component.answerIsCorrect = false;
      component.showPendingCard();
    }
  }
}

angular
  .module('oppia')
  .factory(
    'ConversationSkinService',
    downgradeInjectable(ConversationSkinService)
  );
