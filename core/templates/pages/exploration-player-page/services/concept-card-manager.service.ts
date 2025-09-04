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
 * @fileoverview Utility service for Concept Card in the learner's view.
 */

import {EventEmitter, Injectable} from '@angular/core';
import {StateCard} from 'domain/state_card/state-card.model';

import {ExplorationPlayerConstants} from 'pages/exploration-player-page/current-lesson-player/exploration-player-page.constants';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {ConceptCard} from 'domain/skill/concept-card.model';
import {PlayerTranscriptService} from './player-transcript.service';
import {OppiaNoninteractiveSkillreviewConceptCardModalComponent} from '../../../../../extensions/rich_text_components/Skillreview/directives/oppia-noninteractive-skillreview-concept-card-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root',
})
export class ConceptCardManagerService {
  // The following are set to null when the timeouts are cleared
  // or when the service is reset.
  timeout: NodeJS.Timeout | null = null;
  tooltipTimeout: NodeJS.Timeout | null = null;
  hintsAvailable: number = 0;

  WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC: number = 500;

  // Emitter to show that the learner is really stuck.
  _learnerReallyStuckEventEmitter = new EventEmitter();

  private _timeoutElapsedEventEmitter = new EventEmitter();
  onTimeoutElapsed$ = this._timeoutElapsedEventEmitter.asObservable();

  conceptCardReleased: boolean = false;
  conceptCardConsumed: boolean = false;
  wrongAnswersSinceConceptCardConsumed: number = 0;
  learnerIsReallyStuck: boolean = false;
  conceptCard!: ConceptCard;

  // Variable tooltipIsOpen is a flag which says that the tooltip is currently
  // visible to the learner.
  tooltipIsOpen: boolean = false;
  // This is set to true as soon as the concept card icon is clicked or when
  // the tooltip has been triggered.
  conceptCardDiscovered: boolean = false;

  constructor(
    private playerPositionService: PlayerPositionService,
    private explorationEngineService: ExplorationEngineService,
    private ngbModal: NgbModal,
    private playerTranscriptService: PlayerTranscriptService
  ) {
    // TODO(#10904): Refactor to move subscriptions into components.

    this.playerPositionService.onNewCardOpened.subscribe(
      (displayedCard: StateCard) => {
        this.hintsAvailable = displayedCard.getHints().length;
      }
    );
  }

  // This replaces any timeouts that are already queued.
  enqueueTimeout(func: () => void, timeToWaitMsec: number): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(func.bind(this), timeToWaitMsec);
  }

  showTooltip(): void {
    this.tooltipIsOpen = true;
    this.conceptCardDiscovered = true;
    this._timeoutElapsedEventEmitter.emit();
  }

  openConceptCardModal(linkedSkillId: string): void {
    const modalRef = this.ngbModal.open(
      OppiaNoninteractiveSkillreviewConceptCardModalComponent,
      {backdrop: true}
    );
    this.consumeConceptCard();
    modalRef.componentInstance.skillId = linkedSkillId;
  }

  releaseConceptCard(): void {
    this.conceptCardReleased = true;
    if (!this.conceptCardDiscovered && !this.tooltipTimeout) {
      this.tooltipTimeout = setTimeout(
        this.showTooltip.bind(this),
        this.WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC
      );
    }
    this._timeoutElapsedEventEmitter.emit();
  }

  emitLearnerStuckedness(): void {
    if (!this.learnerIsReallyStuck) {
      this.learnerIsReallyStuck = true;
      this._learnerReallyStuckEventEmitter.emit();
    }
  }

  consumeConceptCard(): void {
    this.conceptCardDiscovered = true;
    this.tooltipIsOpen = false;
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
    this.conceptCardConsumed = true;
    this.wrongAnswersSinceConceptCardConsumed = 0;
    this.enqueueTimeout(
      this.emitLearnerStuckedness,
      ExplorationPlayerConstants.WAIT_BEFORE_REALLY_STUCK_MSEC
    );
  }

  reset(newCard: StateCard): void {
    this.conceptCardReleased = false;
    this.conceptCardConsumed = false;
    this.wrongAnswersSinceConceptCardConsumed = 0;
    if (this.hintsAvailable) {
      return;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }

    if (this.conceptCardForStateExists(newCard)) {
      this.enqueueTimeout(
        this.releaseConceptCard,
        ExplorationPlayerConstants.WAIT_FOR_CONCEPT_CARD_MSEC
      );
    }
  }

  conceptCardForStateExists(newCard: StateCard): boolean {
    let state = this.explorationEngineService.getStateFromStateName(
      newCard.getStateName()
    );
    return state.linkedSkillId !== null;
  }

  isConceptCardTooltipOpen(): boolean {
    return this.tooltipIsOpen;
  }

  isConceptCardViewable(): boolean {
    return this.conceptCardReleased;
  }

  isConceptCardConsumed(): boolean {
    return this.conceptCardConsumed;
  }

  returnToExplorationAfterConceptCard(): void {
    this.playerTranscriptService.addPreviousCard();
    let numCards = this.playerTranscriptService.getNumCards();
    this.playerPositionService.setDisplayedCardIndex(numCards - 1);
  }

  recordWrongAnswer(): void {
    if (this.isConceptCardViewable()) {
      this.wrongAnswersSinceConceptCardConsumed++;
    }
    if (
      this.wrongAnswersSinceConceptCardConsumed >
      ExplorationPlayerConstants.MAX_INCORRECT_ANSWERS_BEFORE_REALLY_STUCK
    ) {
      // Learner is really stuck.
      this.emitLearnerStuckedness();
    }
  }

  setConceptCard(conceptCard: ConceptCard): void {
    this.conceptCard = conceptCard;
  }

  getConceptCard(): ConceptCard {
    return this.conceptCard;
  }

  get onLearnerGetsReallyStuck(): EventEmitter<string> {
    return this._learnerReallyStuckEventEmitter;
  }
}
