// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for Hints in the learner's view.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { EventEmitter } from '@angular/core';
import { ExplorationPlayerConstants } from 'pages/exploration-player-page/exploration-player-page.constants.ts';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service.ts';

@Injectable({
  providedIn: 'root'
})
export class HintsAndSolutionManagerService {
  timeout = null;
  ACCELERATED_HINT_WAIT_TIME_MSEC = 10000;
  WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC = 60000;
  _solutionViewedEventEmitter = new EventEmitter();

  numHintsReleased = 0;
  numHintsConsumed = 0;
  solutionReleased = false;
  solutionConsumed = false;
  hintsForLatestCard = [];
  solutionForLatestCard = null;
  wrongAnswersSinceLastHintConsumed = 0;
  correctAnswerSubmitted = false;

  _hintConsumedEventEmitter = new EventEmitter();

  // Variable tooltipIsOpen is a flag which says that the tooltip is currently
  // visible to the learner.
  tooltipIsOpen = false;
  // This is set to true as soon as a hint/solution is clicked or when the
  // tooltip has been triggered.
  hintsDiscovered = false;
  tooltipTimeout = null;

  constructor(private playerPositionService: PlayerPositionService) {
    playerPositionService.onNewCardAvailable.subscribe(
      () => {
        this.correctAnswerSubmitted = true;
        this.tooltipIsOpen = false;
      }
    );
  }

  // This replaces any timeouts that are already queued.
  enqueueTimeout(func, timeToWaitMsec) {
    if (timeout) {
      $timeout.cancel(timeout);
    }
    timeout = $timeout(func, timeToWaitMsec);
  }

  showTooltip() {
    this.tooltipIsOpen = true;
    this.hintsDiscovered = true;
  }

  releaseHint() {
    if (!this.correctAnswerSubmitted) {
      this.numHintsReleased++;
      if (!this.hintsDiscovered && !this.tooltipTimeout) {
        this.tooltipTimeout = $timeout(
          this.showTooltip, this.WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);
      }
    }
  }
  releaseSolution() {
    this.solutionReleased = true;
  }
  accelerateHintRelease() {
    this.enqueueTimeout(this.releaseHint, this.ACCELERATED_HINT_WAIT_TIME_MSEC);
  }

  areAllHintsExhausted() {
    return this.numHintsReleased === this.hintsForLatestCard.length;
  }
  isAHintWaitingToBeViewed() {
    return this.numHintsConsumed < this.numHintsReleased;
  }

  consumeHint() {
    this.hintsDiscovered = true;
    this.tooltipIsOpen = false;
    if (this.tooltipTimeout) {
      $timeout.cancel(this.tooltipTimeout);
    }
    this._hintConsumedEventEmitter.emit();
    this.numHintsConsumed++;
    this.wrongAnswersSinceLastHintConsumed = 0;

    var funcToEnqueue = null;
    if (!this.areAllHintsExhausted()) {
      funcToEnqueue = this.releaseHint;
    } else if (!!this.solutionForLatestCard && !this.solutionReleased) {
      funcToEnqueue = this.releaseSolution;
    }
    if (funcToEnqueue) {
      this.enqueueTimeout(funcToEnqueue,
        ExplorationPlayerConstants.WAIT_FOR_SUBSEQUENT_HINTS_MSEC);
    }
  }

  reset(newHints, newSolution): void {
    this.numHintsReleased = 0;
    this.numHintsConsumed = 0;
    this.solutionReleased = false;
    this.solutionConsumed = false;
    this.hintsForLatestCard = newHints;
    this.solutionForLatestCard = newSolution;
    this.wrongAnswersSinceLastHintConsumed = 0;
    this.correctAnswerSubmitted = false;
    if (timeout) {
      $timeout.cancel(timeout);
    }
    if (tooltipTimeout) {
      $timeout.cancel(tooltipTimeout);
    }

    if (this.hintsForLatestCard.length > 0) {
      this.enqueueTimeout(this.releaseHint,
        ExplorationPlayerConstants.WAIT_FOR_FIRST_HINT_MSEC);
    }
  }
  // WARNING: This method has a side-effect. If the retrieved hint is a
  // pending hint that's being viewed, it starts the timer for the next
  // hint.
  displayHint(index) {
    if (index === this.numHintsConsumed &&
      this.numHintsConsumed < this.numHintsReleased) {
      // The latest hint has been consumed. Start the timer.
      this.consumeHint();
    }

    if (index < this.numHintsReleased) {
      return this.hintsForLatestCard[index].hintContent;
    }
    return null;
  }

  displaySolution() {
    this.hintsDiscovered = true;
    this.solutionConsumed = true;
    this._solutionViewedEventEmitter.emit();
    if (this.tooltipTimeout) {
      $timeout.cancel(this.tooltipTimeout);
    }
    return this.solutionForLatestCard;
  }

  getNumHints() {
    return this.hintsForLatestCard.length;
  }

  isHintViewable(index) {
    return index < this.numHintsReleased;
  }

  isHintConsumed(index) {
    return index < this.numHintsConsumed;
  }

  isHintTooltipOpen() {
    return this.tooltipIsOpen;
  }

  isSolutionViewable() {
    return this.solutionReleased;
  }

  isSolutionConsumed() {
    return this.solutionConsumed;
  }

  recordWrongAnswer() {
    if (this.isAHintWaitingToBeViewed()) {
      return;
    }

    this.wrongAnswersSinceLastHintConsumed++;
    if (!this.areAllHintsExhausted()) {
      if (
        this.numHintsReleased === 0 && this.wrongAnswersSinceLastHintConsumed >= 2) {
        this.accelerateHintRelease();
      } else if (
        this.numHintsReleased > 0 && this.wrongAnswersSinceLastHintConsumed >= 1) {
        this.accelerateHintRelease();
      }
    }
  }

  onSolutionViewedEventEmitter() {
    return this._solutionViewedEventEmitter;
  }

  onHintConsumed() {
    return this._hintConsumedEventEmitter;
  }
}

angular.module('oppia').factory(
  'HintsAndSolutionManagerService',
  downgradeInjectable(HintsAndSolutionManagerService));