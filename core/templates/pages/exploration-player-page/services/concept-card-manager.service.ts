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

 import { EventEmitter, Injectable } from '@angular/core';
 import { downgradeInjectable } from '@angular/upgrade/static';
 
 import { ExplorationPlayerConstants } from 'pages/exploration-player-page/exploration-player-page.constants';
 import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
 
 @Injectable({
   providedIn: 'root'
 })
 export class ConceptCardManagerService {
   // The following are set to null when the timeouts are cleared
   // or when the service is reset.
   timeout: NodeJS.Timeout | null = null;
   tooltipTimeout: NodeJS.Timeout | null = null;
 
   WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC: number = 65000;
 
   // Emitter to show that concept card is used.
   _conceptCardConsumedEventEmitter = new EventEmitter();

   // Emitter to show that the learner is really stuck.
   _learnerReallyStuckEventEmitter = new EventEmitter();
   
   private _timeoutElapsedEventEmitter = new EventEmitter();
   onTimeoutElapsed$ = this._timeoutElapsedEventEmitter.asObservable();
 
   conceptCardForStateExists: boolean = true; //TEMPORARILY.
   conceptCardReleased: boolean = false;
   conceptCardConsumed: boolean = false;
   wrongAnswersSinceConceptCardConsumed: number = 0;
   correctAnswerSubmitted: boolean = false;
   learnerIsReallyStuck: boolean = false;
 
 
   // Variable tooltipIsOpen is a flag which says that the tooltip is currently
   // visible to the learner.
   tooltipIsOpen: boolean = false;
   // This is set to true as soon as the concept card icon is clicked or when
   // the tooltip has been triggered.
   conceptCardDiscovered: boolean = false;
 
   constructor(private playerPositionService: PlayerPositionService) {
     // TODO(#10904): Refactor to move subscriptions into components.
     playerPositionService.onNewCardAvailable.subscribe(
       () => {
         this.correctAnswerSubmitted = true;
         this.tooltipIsOpen = false;
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
 
   releaseConceptCard(): void {
     if (!this.correctAnswerSubmitted) {
       this.conceptCardReleased = true;
       if (!this.conceptCardDiscovered && !this.tooltipTimeout) {
         this.tooltipTimeout = setTimeout(
           this.showTooltip.bind(this), this.WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);
       }
     }
     this._timeoutElapsedEventEmitter.emit();
   }

   isLearnerReallyStuck(): boolean {
     return this.learnerIsReallyStuck;
   }

   emitLearnerStuckedness(): void {
     this.learnerIsReallyStuck = true;
     this._learnerReallyStuckEventEmitter.emit();
   }
 
   consumeconceptCard(): void {
     this.conceptCardDiscovered = true;
     this.tooltipIsOpen = false;
     if (this.tooltipTimeout) {
       clearTimeout(this.tooltipTimeout);
       this.tooltipTimeout = null;
     }
     this.conceptCardConsumed = true;

     this._conceptCardConsumedEventEmitter.emit();

     this.wrongAnswersSinceConceptCardConsumed = 0;
 
     let funcToEnqueue = null;
     // Here we add func to enque that would wait for
     // 2 mins to dictate whether the leaner is stuck.
     
    funcToEnqueue = this.emitLearnerStuckedness;
     if (funcToEnqueue) {
       this.enqueueTimeout(
         funcToEnqueue,
         ExplorationPlayerConstants.WAIT_BEFORE_REALLY_STUCK_MSEC);
     }
   }
 
   reset(): void {
     this.conceptCardReleased = false;
     this.conceptCardConsumed = false;
     this.wrongAnswersSinceConceptCardConsumed = 0;
     this.correctAnswerSubmitted = false;
     if (this.timeout) {
       clearTimeout(this.timeout);
       this.timeout = null;
     }
     if (this.tooltipTimeout) {
       clearTimeout(this.tooltipTimeout);
       this.tooltipTimeout = null;
     }
 
     if (this.conceptCardForStateExists) {
       this.enqueueTimeout(
         this.releaseConceptCard,
         ExplorationPlayerConstants.WAIT_FOR_CONCEPT_CARD_MSEC);
     }
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
 
   recordWrongAnswer(): void {
     if (this.isConceptCardViewable()) {
       this.wrongAnswersSinceConceptCardConsumed++;
     }
     if (this.wrongAnswersSinceConceptCardConsumed >
      ExplorationPlayerConstants.
        MAX_INCORRECT_ANSWERS_BEFORE_REALLY_STUCK) {
          // Learner is really stuck.
          this._learnerReallyStuckEventEmitter.emit();
      }
   }
 
  //  get onHintConsumed(): EventEmitter<unknown> {
  //    return this._conceptCardConsumedEventEmitter;
  //  }
 }
 
 angular.module('oppia').factory(
   'ConceptCardManagerService',
   downgradeInjectable(ConceptCardManagerService));
 