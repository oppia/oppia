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
 
   WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC: number = 20000;
 
   // Emitter to show that concept card is used.
   _conceptCardConsumedEventEmitter = new EventEmitter();
   private _timeoutElapsedEventEmitter = new EventEmitter();
   onTimeoutElapsed$ = this._timeoutElapsedEventEmitter.asObservable();
 
   conceptCardForStateExists: boolean = false;
   conceptCardReleased: boolean = false;
   conceptCardConsumed: boolean = false;
   wrongAnswersSinceConceptCardConsumed: number = 0;
   correctAnswerSubmitted: boolean = false;
 
 
   // Variable tooltipIsOpen is a flag which says that the tooltip is currently
   // visible to the learner.
   tooltipIsOpen: boolean = false;
   // This is set to true as soon as a hint/solution is clicked or when the
   // tooltip has been triggered.
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

    //  if (!this.areAllHintsExhausted()) {
    //    funcToEnqueue = this.releaseHint;
    //  } else if (!!this.solutionForLatestCard && !this.solutionReleased) {
    //    funcToEnqueue = this.releaseSolution;
    //  }
    //  if (funcToEnqueue) {
    //    this.enqueueTimeout(
    //      funcToEnqueue,
    //      ExplorationPlayerConstants.WAIT_FOR_SUBSEQUENT_HINTS_MSEC);
    //  }
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
         ExplorationPlayerConstants.WAIT_FOR_FIRST_HINT_MSEC);
     }
   }
 
   // WARNING: This method has a side-effect. If the retrieved hint is a
   // pending hint that's being viewed, it starts the timer for the next
   // hint.

   // Don't need this mp.

    //    displayHint(index: number): SubtitledHtml | null {
    //      if (index === this.numHintsConsumed &&
    //        this.numHintsConsumed < this.numHintsReleased) {
    //        // The latest hint has been consumed. Start the timer.
    //        this.consumeHint();
    //      }
    
    //      if (index < this.numHintsReleased) {
    //        return this.hintsForLatestCard[index].hintContent;
    //      }
    //      return null;
    //    }
 
//    displaySolution(): Solution {
//      this.hintsDiscovered = true;
//      this.solutionConsumed = true;
//      this._solutionViewedEventEmitter.emit();
//      if (this.tooltipTimeout) {
//        clearTimeout(this.tooltipTimeout);
//        this.tooltipTimeout = null;
//      }
//      return this.solutionForLatestCard;
//    }

 
   isConceptCardTooltipOpen(): boolean {
     return this.tooltipIsOpen;
   }
 
   isConceptCardViewable(): boolean {
     return this.conceptCardReleased;
   }
 
   isConceptCardConsumed(): boolean {
     return this.conceptCardConsumed;
   }
 
   // IMPPPPPP (Links to convo.skin.ts)
   recordWrongAnswer(): void {
 
     if (!this.isConceptCardViewable()) {
       if (
         this.numHintsReleased === 0 &&
         this.wrongAnswersSinceLastHintConsumed >= 2) {
         this.accelerateHintRelease();
       } else if (
         this.numHintsReleased > 0 &&
         this.wrongAnswersSinceLastHintConsumed >= 1) {
         this.accelerateHintRelease();
       }
     }
   }
 
   get onHintConsumed(): EventEmitter<unknown> {
     return this._conceptCardConsumedEventEmitter;
   }
 }
 
 angular.module('oppia').factory(
   'ConceptCardManagerService',
   downgradeInjectable(ConceptCardManagerService));
 