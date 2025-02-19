// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for keeping track of the learner's position.
 */

import {EventEmitter, Injectable} from '@angular/core';

import {PlayerTranscriptService} from 'pages/exploration-player-page/services/player-transcript.service';
import {StateCard} from 'domain/state_card/state-card.model';

export interface HelpCardEventResponse {
  helpCardHtml: string;
  hasContinueButton: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PlayerPositionService {
  constructor(private playerTranscriptService: PlayerTranscriptService) {}

  private _activeCardChangedEventEmitter = new EventEmitter<void>();
  private _currentQuestionChangedEventEmitter = new EventEmitter<number>();
  private _newCardAvailableEventEmitter = new EventEmitter<void>();
  private _helpCardAvailableEventEmitter =
    new EventEmitter<HelpCardEventResponse>();

  private _newCardOpenedEventEmitter = new EventEmitter<StateCard>();
  private _loadedMostRecentCheckpointEmitter = new EventEmitter<void>();

  // The following property is initialized using the class methods.
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  displayedCardIndex!: number;
  onChangeCallback!: Function;
  learnerJustSubmittedAnAnswer = false;

  init(callback: Function): void {
    this.displayedCardIndex = -1;
    this.onChangeCallback = callback;
  }

  /**
   * This function is used to find the name of the current state.
   * @return {string} a string that shows the name of current state.
   */
  getCurrentStateName(): string {
    return this.playerTranscriptService
      .getCard(this.displayedCardIndex)
      .getStateName();
  }

  /**
   * This function is used to set the index of the displayed card.
   * @param {number} index - The new index of the card.
   */
  setDisplayedCardIndex(index: number): void {
    let oldIndex = this.displayedCardIndex;
    this.displayedCardIndex = index;

    if (oldIndex !== this.displayedCardIndex) {
      if (!this.onChangeCallback) {
        throw new Error('The callback function has not been initialized');
      }
      this.onChangeCallback();
    }
  }

  /**
   * This function is used to find the index of the displayed card.
   * @return {number} The index of the displayed card.
   */
  getDisplayedCardIndex(): number {
    return this.displayedCardIndex;
  }

  /**
   * This function is used to record that the user has submitted an answer.
   */
  recordAnswerSubmission(): void {
    this.learnerJustSubmittedAnAnswer = true;
  }

  /**
   * This function is used to record that the user has clicked
   * on the navigation button.
   */
  recordNavigationButtonClick(): void {
    this.learnerJustSubmittedAnAnswer = false;
  }

  /**
   * This function is used to get whether the learner has just
   * submitted an answer.
   * @return {boolean} Whether the learner has just submitted an answer.
   */
  hasLearnerJustSubmittedAnAnswer(): boolean {
    return this.learnerJustSubmittedAnAnswer;
  }

  get onNewCardAvailable(): EventEmitter<void> {
    return this._newCardAvailableEventEmitter;
  }

  get onHelpCardAvailable(): EventEmitter<HelpCardEventResponse> {
    return this._helpCardAvailableEventEmitter;
  }

  get onNewCardOpened(): EventEmitter<StateCard> {
    return this._newCardOpenedEventEmitter;
  }

  get onLoadedMostRecentCheckpoint(): EventEmitter<void> {
    return this._loadedMostRecentCheckpointEmitter;
  }

  changeCurrentQuestion(index: number): void {
    this._currentQuestionChangedEventEmitter.emit(index);
  }

  get onActiveCardChanged(): EventEmitter<void> {
    return this._activeCardChangedEventEmitter;
  }

  get onCurrentQuestionChange(): EventEmitter<number> {
    return this._currentQuestionChangedEventEmitter;
  }
}
