// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the hint and solution display.
 */

import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ExplorationModeService} from 'pages/exploration-player-page/services/exploration-mode.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {HintAndSolutionModalService} from 'pages/exploration-player-page/services/hint-and-solution-modal.service';
import {HintsAndSolutionManagerService} from 'pages/exploration-player-page/services/hints-and-solution-manager.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PlayerTranscriptService} from 'pages/exploration-player-page/services/player-transcript.service';
import {StatsReportingService} from 'pages/exploration-player-page/services/stats-reporting.service';
import {Subscription} from 'rxjs';
import {PageContextService} from 'services/page-context.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlService} from 'services/contextual/url.service';
import './hint-and-solution-display.component.css';

@Component({
  selector: 'oppia-hint-and-solution-display',
  templateUrl: './hint-and-solution-display.component.html',
  styleUrls: ['./hint-and-solution-display.component.css'],
})
export class HintAndSolutionDisplayComponent {
  directiveSubscriptions = new Subscription();
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _editorPreviewMode!: boolean;
  // Active hint index is null when no hint is active. Otherwise, it is the
  // index of the active hint.
  activeHintIndex!: number | null;
  displayedCard!: StateCard;
  hintIndexes: number[] = [];
  iframed!: boolean;
  solutionModalIsActive: boolean = false;
  currentlyOnLatestCard: boolean = true;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private pageContextService: PageContextService,
    private urlService: UrlService,
    private explorationModeService: ExplorationModeService,
    private hintAndSolutionModalService: HintAndSolutionModalService,
    private hintsAndSolutionManagerService: HintsAndSolutionManagerService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private statsReportingService: StatsReportingService
  ) {}

  ngOnInit(): void {
    this._editorPreviewMode =
      this.pageContextService.isInExplorationEditorPage();
    this.iframed = this.urlService.isIframed();
    this.resetLocalHintsArray();
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        (newCard: StateCard) => {
          this.displayedCard = newCard;
          this.hintsAndSolutionManagerService.reset(
            newCard.getHints(),
            newCard.getSolution()
          );
          this.resetLocalHintsArray();
        }
      )
    );
    this.directiveSubscriptions.add(
      this.playerPositionService.onActiveCardChanged.subscribe(() => {
        let displayedCardIndex =
          this.playerPositionService.getDisplayedCardIndex();
        this.currentlyOnLatestCard =
          this.playerTranscriptService.isLastCard(displayedCardIndex);
        if (this.currentlyOnLatestCard) {
          this.resetLocalHintsArray();
        }
      })
    );
    this.directiveSubscriptions.add(
      this.hintsAndSolutionManagerService.onHintConsumed.subscribe(() => {
        this.changeDetectorRef.detectChanges();
      })
    );
    this.directiveSubscriptions.add(
      this.hintsAndSolutionManagerService.onSolutionViewedEventEmitter.subscribe(
        () => {
          this.changeDetectorRef.detectChanges();
        }
      )
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
      this.displayedCard.doesInteractionSupportHints()
    );
  }

  isSolutionButtonVisible(): boolean {
    return this.hintsAndSolutionManagerService.isSolutionViewable();
  }

  displayNewHintModal(index: number): void {
    this.activeHintIndex = index;
    let promise = this.hintAndSolutionModalService.displayNewHintModal(index);
    promise.result.then(null, () => {
      this.activeHintIndex = null;
    });
  }

  onClickSolutionButton(): void {
    this.solutionModalIsActive = true;
    if (this.hintsAndSolutionManagerService.isSolutionConsumed()) {
      this.displaySolutionModal();
    } else {
      let interstitialModalPromise =
        this.hintAndSolutionModalService.displaySolutionInterstitialModal();
      interstitialModalPromise.result.then(
        () => {
          this.displaySolutionModal();
        },
        () => {
          this.solutionModalIsActive = false;
        }
      );
    }
  }

  displaySolutionModal(): void {
    this.solutionModalIsActive = true;
    let inQuestionMode = this.explorationModeService.isInQuestionMode();
    if (!this._editorPreviewMode && !inQuestionMode) {
      this.statsReportingService.recordSolutionHit(
        this.playerPositionService.getCurrentStateName()
      );
    }
    let promise = this.hintAndSolutionModalService.displaySolutionModal();
    promise.result.then(null, () => {
      this.solutionModalIsActive = false;
    });
  }

  isHintConsumed(hintIndex: number): boolean {
    return this.hintsAndSolutionManagerService.isHintConsumed(hintIndex);
  }

  isSolutionConsumed(): boolean {
    return this.hintsAndSolutionManagerService.isSolutionConsumed();
  }
}
