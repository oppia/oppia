// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to manage the conversation flow of the exploration player,
 * controlling behaviours such as adding cards to the stack, or submitting the
 * answer to progress further.
 */

import {StateCard} from 'domain/state_card/state-card.model';
import {EventEmitter, Injectable} from '@angular/core';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {CurrentEngineService} from './current-engine.service';
import {Solution} from 'domain/exploration/SolutionObjectFactory';
import {ExplorationPlayerConstants} from '../current-lesson-player/exploration-player-page.constants';
import {TranslateService} from '@ngx-translate/core';
import {HintsAndSolutionManagerService} from './hints-and-solution-manager.service';
import {PlayerPositionService} from './player-position.service';
import {StatsReportingService} from './stats-reporting.service';
import {PageContextService} from 'services/page-context.service';
import {ConceptCardManagerService} from './concept-card-manager.service';

@Injectable({
  providedIn: 'root',
})
export class ConversationFlowService {
  nextCardIfStuck!: StateCard | null;
  solutionForState: Solution | null = null;
  responseTimeout: NodeJS.Timeout | null = null;
  nextStateCard: StateCard | null = null;
  private _playerStateChangeEventEmitter: EventEmitter<string> =
    new EventEmitter<string>();

  private _oppiaFeedbackAvailableEventEmitter: EventEmitter<void> =
    new EventEmitter();

  private _playerProgressModalShownEventEmitter: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  constructor(
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private playerTranscriptService: PlayerTranscriptService,
    private playerPositionService: PlayerPositionService,
    private pageContextService: PageContextService,
    private conceptCardManagerService: ConceptCardManagerService,
    private currentEngineService: CurrentEngineService,
    private statsReportingService: StatsReportingService,
    private translateService: TranslateService,
    private hintsAndSolutionManagerService: HintsAndSolutionManagerService
  ) {}

  addNewCard(newCard: StateCard): void {
    this.playerTranscriptService.addNewCard(newCard);
    const explorationLanguageCode = this.getLanguageCode();
    const selectedLanguageCode =
      this.contentTranslationLanguageService.getCurrentContentLanguageCode();
    if (explorationLanguageCode !== selectedLanguageCode) {
      this.contentTranslationManagerService.displayTranslations(
        selectedLanguageCode
      );
    }
  }

  isSupplementalCardNonempty(card: StateCard): boolean {
    return !card.isInteractionInline();
  }

  /**
   * Records the addition of a new card in the current engine service.
   */
  recordNewCardAdded(): void {
    let currentEngineService =
      this.currentEngineService.getCurrentEngineService();
    return currentEngineService.recordNewCardAdded();
  }

  /**
   * Retrieves the language code of the exploration from the current engine service.
   *
   * @returns {string} The language code of the exploration.
   */
  getLanguageCode(): string {
    let currentEngineService =
      this.currentEngineService.getCurrentEngineService();
    return currentEngineService.getLanguageCode();
  }

  /**
   * Records that the learner is leaving the current exploration to view
   * a refresher exploration, for analytics and progress tracking purposes.
   *
   * This event is only recorded when the learner is in the learner view,
   * not in the exploration editor preview mode.
   *
   * @param {string} refresherExpId - The ID of the refresher exploration
   *   the learner is navigating to.
   */
  recordLeaveForRefresherExp(refresherExpId: string): void {
    let editorPreviewMode = this.pageContextService.isInExplorationEditorPage();
    if (!editorPreviewMode) {
      this.statsReportingService.recordLeaveForRefresherExp(
        this.playerPositionService.getCurrentStateName(),
        refresherExpId
      );
    }
  }

  /**
   * Triggers the stuck learner logic, based on either a delayed timer
   * (e.g., 150 seconds of inactivity) or immediately if not delayed.
   *
   * This method is responsible for determining whether the "Continue"
   * button should be shown to help the learner move forward if they are stuck.
   *
   * --- Trigger Conditions ---
   * • When a new card is opened:
   *    – Starts a 150-second timer.
   *    – If hints are available but not fully consumed, and the learner
   *      hasn't answered the question, the "Continue" button is shown
   *      after the timeout.
   *
   * • After all hints are consumed:
   *    – Timer is reset and restarted for 150 seconds.
   *    – If the question remains unanswered after timeout, the
   *      "Continue" button is shown.
   *
   * @param {boolean} isDelayed - Whether to wait before performing
   *   the stuck check (typically true for inactivity-based triggers).
   * @param {() => void} onShowContinueToReviseButton - Callback to display
   *   the "Continue" button when the learner is deemed stuck.
   */
  triggerIfLearnerStuckAction(
    isDelayed: boolean,
    onShowContinueToReviseButton: () => void
  ): void {
    if (this.responseTimeout) {
      clearTimeout(this.responseTimeout);
      this.responseTimeout = null;
    }

    if (isDelayed) {
      this.responseTimeout = setTimeout(() => {
        this._performStuckCheck(onShowContinueToReviseButton);
      }, ExplorationPlayerConstants.WAIT_BEFORE_RESPONSE_FOR_STUCK_LEARNER_MSEC);
    } else {
      this._performStuckCheck(onShowContinueToReviseButton);
    }
  }

  /**
   * Performs the stuck check logic. If the learner is stuck on the card and
   * a stuck state card (`nextCardIfStuck`) exists, shows a redirection message
   * and invokes the callback to display the revision button.
   *
   * Alternatively, if the learner has reached the maximum number of incorrect
   * attempts, the solution is revealed (if available).
   *
   * @param {() => void} onShowContinueToReviseButton - Callback to show
   *   the "Continue to revise" button.
   */
  private _performStuckCheck(onShowContinueToReviseButton: () => void): void {
    const numberOfIncorrectSubmissions =
      this.playerTranscriptService.getNumberOfIncorrectSubmissions();

    if (
      this.nextCardIfStuck &&
      this.nextCardIfStuck !== this._getCurrentCard()
    ) {
      this.playerTranscriptService.addNewResponseToExistingFeedback(
        this.translateService.instant('I18N_REDIRECTION_TO_STUCK_STATE_MESSAGE')
      );
      onShowContinueToReviseButton();
    } else if (
      this.solutionForState !== null &&
      numberOfIncorrectSubmissions >=
        ExplorationPlayerConstants.MAX_INCORRECT_ANSWERS_BEFORE_RELEASING_SOLUTION
    ) {
      this.hintsAndSolutionManagerService.releaseSolution();
    }
  }

  /**
   * Returns the currently displayed state card based on the
   * learner's current position in the transcript.
   *
   * @returns {StateCard} The currently displayed exploration card.
   */
  private _getCurrentCard(): StateCard {
    let index = this.playerPositionService.getDisplayedCardIndex();
    let displayedCard = this.playerTranscriptService.getCard(index);
    return displayedCard;
  }

  recordIncorrectAnswer(): void {
    this.playerTranscriptService.incrementNumberOfIncorrectSubmissions();
    this.hintsAndSolutionManagerService.recordWrongAnswer();
    this.conceptCardManagerService.recordWrongAnswer();
  }

  emitHelpCard(helpCardHtml: string, hasContinueButton: boolean): void {
    this.playerPositionService.onHelpCardAvailable.emit({
      helpCardHtml: helpCardHtml,
      hasContinueButton: hasContinueButton,
    });
  }

  get onPlayerStateChange(): EventEmitter<string> {
    return this._playerStateChangeEventEmitter;
  }

  get onOppiaFeedbackAvailable(): EventEmitter<void> {
    return this._oppiaFeedbackAvailableEventEmitter;
  }

  get onShowProgressModal(): EventEmitter<boolean> {
    return this._playerProgressModalShownEventEmitter;
  }

  /**
   * Retrieves the next card to be displayed if the user is stuck.
   * This card will be shown when the user is unable to progress further.
   *
   * @returns {StateCard | null} The next card if stuck, or null if none is set.
   */
  getNextCardIfStuck(): StateCard | null {
    return this.nextCardIfStuck;
  }

  /**
   * Sets the next card to be displayed if the user is stuck.
   * This card will be shown when the user is unable to progress further.
   *
   * @param {StateCard | null} card - The card to set as the next card if stuck.
   */
  setNextCardIfStuck(card: StateCard | null): void {
    this.nextCardIfStuck = card;
  }

  /**
   * Sets the solution for the current state.
   *
   * @param {Solution | null} solution - The solution to set for the current state.
   */
  setSolutionForState(solution: Solution | null): void {
    this.solutionForState = solution;
  }

  /**
   * Retrieves the solution for the current state.
   *
   * @returns {Solution | null} The solution for the current state, or null if none is set.
   */
  getSolutionForState(): Solution | null {
    return this.solutionForState;
  }

  /**
   * Retrieves the next state card to be displayed.
   *
   * @returns {StateCard | null} The next state card, or null if none is set.
   */
  getNextStateCard(): StateCard | null {
    return this.nextStateCard;
  }

  /**
   * Sets the next state card to be displayed.
   *
   * @param {StateCard | null} card - The next state card to set, or null if none.
   */
  setNextStateCard(card: StateCard | null): void {
    this.nextStateCard = card;
  }
}
