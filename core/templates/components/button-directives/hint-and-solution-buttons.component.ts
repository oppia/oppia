// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for hint and solution buttons.
 */

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StateCard } from 'domain/state_card/state-card.model';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { HintAndSolutionModalService } from 'pages/exploration-player-page/services/hint-and-solution-modal.service';
import { HintsAndSolutionManagerService } from 'pages/exploration-player-page/services/hints-and-solution-manager.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { StatsReportingService } from 'pages/exploration-player-page/services/stats-reporting.service';
import { Subscription } from 'rxjs';
import { ContextService } from 'services/context.service';

@Component({
  selector: 'oppia-hint-and-solution-buttons',
  templateUrl: './hint-and-solution-buttons.component.html'
})
export class HintAndSolutionButtonsComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  private _editorPreviewMode: boolean;
  hintIndexes: number[] = [];
  activeHintIndex: number;
  solutionModalIsActive: boolean = false;
  displayedCard: StateCard;
  currentlyOnLatestCard: boolean = true;
  isVisible: boolean = true;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private hintAndSolutionModalService: HintAndSolutionModalService,
    private hintsAndSolutionManagerService: HintsAndSolutionManagerService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private statsReportingService: StatsReportingService
  ) {}

  ngOnInit(): void {
    this._editorPreviewMode = this.contextService.isInExplorationEditorPage();
    this.resetLocalHintsArray();
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        (newCard: StateCard) => {
          this.displayedCard = newCard;
          this.hintsAndSolutionManagerService.reset(
            newCard.getHints(), newCard.getSolution());
          this.resetLocalHintsArray();
        }
      )
    );
    this.directiveSubscriptions.add(
      this.playerPositionService.onActiveCardChanged.subscribe(() => {
        let displayedCardIndex = (
          this.playerPositionService.getDisplayedCardIndex());
        this.currentlyOnLatestCard = (
          this.playerTranscriptService.isLastCard(displayedCardIndex));
        if (this.currentlyOnLatestCard) {
          this.resetLocalHintsArray();
        }
      }));
    this.directiveSubscriptions.add(
      this.hintsAndSolutionManagerService.onHintConsumed.subscribe(() => {
        this.changeDetectorRef.detectChanges();
      })
    );
    this.directiveSubscriptions.add(
      this.hintsAndSolutionManagerService.onSolutionViewedEventEmitter
        .subscribe(() => {
          this.changeDetectorRef.detectChanges();
        })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  resetLocalHintsArray(): void {
    this.hintIndexes = [];
    let numHints = this.hintsAndSolutionManagerService.getNumHints();
    for (let index = 0; index < numHints; index++) {
      this.hintIndexes.push(index);
    }
  }

  isHintButtonVisible(index: number): boolean {
    return (
      this.hintsAndSolutionManagerService.isHintViewable(index) &&
      this.displayedCard &&
      this.displayedCard.doesInteractionSupportHints());
  }


  isSolutionButtonVisible(): boolean {
    return this.hintsAndSolutionManagerService.isSolutionViewable();
  }

  displayHintModal(index: number): void {
    this.activeHintIndex = index;
    let promise = (
      this.hintAndSolutionModalService.displayHintModal(index));
    promise.result.then(null, () => {
      this.activeHintIndex = null;
    });
    this.isVisible = false;
  }

  onClickSolutionButton(): void {
    this.solutionModalIsActive = true;
    if (this.hintsAndSolutionManagerService.isSolutionConsumed()) {
      this.displaySolutionModal();
    } else {
      let interstitialModalPromise = (
        this.hintAndSolutionModalService
          .displaySolutionInterstitialModal());
      interstitialModalPromise.result.then(() => {
        this.displaySolutionModal();
      }, () => {
        this.solutionModalIsActive = false;
      });
    }
  }

  displaySolutionModal(): void {
    this.solutionModalIsActive = true;
    let inQuestionMode = (
      this.explorationPlayerStateService.isInQuestionMode());
    if (!this._editorPreviewMode && !inQuestionMode) {
      this.statsReportingService.recordSolutionHit(
        this.playerPositionService.getCurrentStateName());
    }
    let promise = this.hintAndSolutionModalService.displaySolutionModal();
    promise.result.then(null, () => {
      this.solutionModalIsActive = false;
    });
  }

  isTooltipVisible(): boolean {
    return this.hintsAndSolutionManagerService.isHintTooltipOpen();
  }

  isHintConsumed(hintIndex: number): boolean {
    return this.hintsAndSolutionManagerService.isHintConsumed(hintIndex);
  }

  isSolutionConsumed(): boolean {
    return this.hintsAndSolutionManagerService.isSolutionConsumed();
  }
}

angular.module('oppia').directive('oppiaHintAndSolutionButtons',
  downgradeComponent({
    component: HintAndSolutionButtonsComponent
  }) as angular.IDirectiveFactory);
