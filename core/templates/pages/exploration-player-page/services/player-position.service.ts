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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ContextService } from 'services/context.service';
import { PlayerTranscriptService } from
  'pages/exploration-player-page/services/player-transcript.service';


@Injectable({
  providedIn: 'root'
})
export class PlayerPositionService {
  constructor(private contextService: ContextService,
              private playerTranscriptService: PlayerTranscriptService) {}

  displayedCardIndex = null;
  onChangeCallback = null;
  learnerJustSubmittedAnAnswer = false;

  init(callback: Function): void {
    this.displayedCardIndex = null;
    this.onChangeCallback = callback;
  }

  getCurrentStateName(): string {
    try {
      return (
        this.playerTranscriptService.getCard(
          this.displayedCardIndex).getStateName());
    } catch (e) {
      let additionalInfo = ('\nUndefined card error debug logs:' +
          '\nRequested card index: ' + this.displayedCardIndex +
          '\nExploration ID: ' + this.contextService.getExplorationId() +
          '\nTotal cards: ' + this.playerTranscriptService.getNumCards() +
          '\nLast state name: ' +
          this.playerTranscriptService.getLastStateName()
      );
      e.message += additionalInfo;
      throw e;
    }
  }

  setDisplayedCardIndex(index: number): void {
    let oldIndex = this.displayedCardIndex;
    this.displayedCardIndex = index;

    if (oldIndex !== this.displayedCardIndex) {
      this.onChangeCallback();
    }
  }

  getDisplayedCardIndex(): number {
    return this.displayedCardIndex;
  }

  recordAnswerSubmission(): void {
    this.learnerJustSubmittedAnAnswer = true;
  }

  recordNavigationButtonClick(): void {
    this.learnerJustSubmittedAnAnswer = false;
  }

  hasLearnerJustSubmittedAnAnswer(): boolean {
    return this.learnerJustSubmittedAnAnswer;
  }
}

angular.module('oppia').factory(
  'PlayerPositionService',
  downgradeInjectable(PlayerPositionService));
