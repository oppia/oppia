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

@Injectable({
  providedIn: 'root',
})
export class ConversationFlowService {
  nextCardIfStuck: StateCard | null;
  solutionForState: Solution | null = null;
  responseTimeout: NodeJS.Timeout | null = null;
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
    private currentEngineService: CurrentEngineService,
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

  private _getCurrentCard(): StateCard {
    let index = this.playerPositionService.getDisplayedCardIndex();
    let displayedCard = this.playerTranscriptService.getCard(index);
    return displayedCard;
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
}
