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

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { PlayerTranscriptService } from
  'pages/exploration-player-page/services/player-transcript.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerPositionService {
  constructor(private playerTranscriptService: PlayerTranscriptService) {}

  private _activeCardChangedEventEmitter = new EventEmitter();
  private _currentQuestionChangedEventEmitter = new EventEmitter<number>();
  private _newCardAvailableEventEmitter = new EventEmitter();
  private _helpCardAvailableEventEmitter = new EventEmitter();
  private _newCardOpenedEventEmitter = new EventEmitter();

  displayedCardIndex = null;
  onChangeCallback = null;
  learnerJustSubmittedAnAnswer = false;

  init(callback: Function): void {
    this.displayedCardIndex = null;
    this.onChangeCallback = callback;
  }

  /**
   * This function is used to find the name of the current state.
   * @return {string} a string that shows the name of current state.
   */
  getCurrentStateName(): string {
    return (
      this.playerTranscriptService.getCard(
        this.displayedCardIndex).getStateName());
  }

  /**
   * This function is used to set the index of the displayed card.
   * @param {number} index - The new index of the card.
   */
  setDisplayedCardIndex(index: number): void {
    let oldIndex = this.displayedCardIndex;
    this.displayedCardIndex = index;

    if (oldIndex !== this.displayedCardIndex) {
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

  get onNewCardAvailable() {
    return this._newCardAvailableEventEmitter;
  }

  get onHelpCardAvailable() {
    return this._helpCardAvailableEventEmitter;
  }

  get onNewCardOpened() {
    return this._newCardOpenedEventEmitter;
  }

  changeCurrentQuestion(index: number) {
    this._currentQuestionChangedEventEmitter.emit(index);
  }

  get onActiveCardChanged() {
    return this._activeCardChangedEventEmitter;
  }

  get onCurrentQuestionChange() {
    return this._currentQuestionChangedEventEmitter;
  }
}

angular.module('oppia').factory(
  'PlayerPositionService',
  downgradeInjectable(PlayerPositionService));
