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
 * @fileoverview Service for the learner view transcript.
 */

// A service that maintains the transcript of the playthrough (i.e., what cards
// are shown, what answers have been given, etc. Note that this service does
// not maintain the currently-active card -- it's more like a log of what the
// learner has 'discovered' so far.

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { LoggerService } from 'services/contextual/logger.service';
import { StateCard } from 'domain/state_card/state-card.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerTranscriptService {
  constructor(private log: LoggerService) {}
  // Each element of this array represents a 'StateCard' domain object.
  //
  // Note that every card in this transcript is visible on the screen. The
  // 'card.getDestStateName()' field is intended to identify transcripts where
  // there is a card 'in reserve', but the learner has not yet navigated to it
  // -- this happens if the current card offers feedback to the learner before
  // they carry on.
  transcript: StateCard[] = [];
  numAnswersSubmitted = 0;

  restore(oldTranscript: StateCard[]): void {
    this.transcript = cloneDeep(oldTranscript);
  }

  restoreImmutably(oldTranscript: StateCard[]): void {
    for (let i = 0; i < this.transcript.length; i++) {
      // Immutably restore the cards so that Angular can detect changes.
      this.transcript[i].restoreImmutable(oldTranscript[i]);
    }
  }

  init(): void {
    this.transcript = [];
    this.numAnswersSubmitted = 0;
  }

  hasEncounteredStateBefore(stateName: string): boolean {
    return this.transcript.some(transcriptItem => {
      return transcriptItem.getStateName() === stateName;
    });
  }

  addNewCard(newCard: StateCard): void {
    this.transcript.push(newCard);
    this.numAnswersSubmitted = 0;
  }

  addPreviousCard(): void {
    if (this.transcript.length === 1) {
      throw new Error(
        'Exploration player is on the first card and hence no previous ' +
          'card exists.');
    }
    // TODO(aks681): Once worked examples are introduced, modify the below
    // line to take into account the number of worked examples displayed.
    let copyOfPreviousCard =
        cloneDeep(this.transcript[this.transcript.length - 2]);
    copyOfPreviousCard.markAsNotCompleted();
    this.transcript.push(copyOfPreviousCard);
  }

  addNewInput(input: string, isHint: boolean): void {
    let card = this.getLastCard();
    let pairs = card.getInputResponsePairs();
    if (pairs.length > 0 && card.getLastOppiaResponse() === null) {
      throw new Error(
        'Trying to add an input before the response for the previous ' +
          'input has been received.'
      );
    }
    if (!isHint) {
      this.numAnswersSubmitted += 1;
    }
    this.transcript[this.transcript.length - 1].addInputResponsePair({
      learnerInput: input,
      oppiaResponse: null,
      isHint: isHint
    });
  }

  addNewResponse(response: string): void {
    let card = this.getLastCard();
    card.setLastOppiaResponse(response);
  }

  addNewResponseToExistingFeedback(response: string): void {
    let card = this.getLastCard();
    card.addToExistingFeedback(response);
  }

  getNumCards(): number {
    return this.transcript.length;
  }

  getCard(index: number): StateCard {
    if (index !== null && (index < 0 || index >= this.transcript.length)) {
      this.log.error(
        'Requested card with index ' + index +
          ', but transcript only has length ' +
          this.transcript.length + ' cards.');
    }
    return this.transcript[index];
  }

  getLastAnswerOnDisplayedCard(
      displayedCardIndex: number
  ): { answerDetails: string } | string | null {
    if (
      this.isLastCard(displayedCardIndex) ||
        this.transcript[displayedCardIndex].getStateName() === null ||
        this.transcript[displayedCardIndex].getInputResponsePairs().length ===
        0) {
      return null;
    } else {
      return this.transcript[displayedCardIndex].
        getInputResponsePairs().slice(-1)[0].learnerInput;
    }
  }

  isLastCard(index: number): boolean {
    return index === this.transcript.length - 1;
  }

  getLastCard(): StateCard {
    return this.getCard(this.transcript.length - 1);
  }

  getNumSubmitsForLastCard(): number {
    return this.numAnswersSubmitted;
  }

  updateLatestInteractionHtml(newInteractionHtml: string): void {
    this.getLastCard().setInteractionHtml(newInteractionHtml);
  }

  getLastStateName(): string {
    return this.getLastCard().getStateName();
  }

  findIndexOfLatestStateWithName(name: string): number | null {
    for (let i = this.transcript.length - 1; i >= 0; i--) {
      if (this.transcript[i].getStateName() === name) {
        return i;
      }
    }
    return null;
  }
}

angular.module('oppia').factory(
  'PlayerTranscriptService',
  downgradeInjectable(PlayerTranscriptService));
