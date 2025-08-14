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
 * @fileoverview Component for the hint, solution and concept card display.
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
import {UrlService} from 'services/contextual/url.service';
import './hint-solution-and-concept-card-display.component.css';
import {ConceptCardManagerService} from 'pages/exploration-player-page/services/concept-card-manager.service';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';

@Component({
  selector: 'oppia-hint-solution-and-concept-card-display',
  templateUrl: './hint-solution-and-concept-card-display.component.html',
  styleUrls: ['./hint-solution-and-concept-card-display.component.css'],
})
export class HintSolutionAndConceptCardDisplayComponent
  implements OnInit, OnDestroy
{
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
    private statsReportingService: StatsReportingService,
    private explorationEngineService: ExplorationEngineService,
    private conceptCardManagerService: ConceptCardManagerService
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
          this.conceptCardManagerService.reset(newCard);
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

  isConceptCardButtonVisible(): boolean {
    return this.conceptCardManagerService.isConceptCardViewable();
  }

  showConceptCard(): void {
    let state = this.explorationEngineService.getState();
    let linkedSkillId = state.linkedSkillId;
    if (linkedSkillId) {
      this.conceptCardManagerService.openConceptCardModal(linkedSkillId);
    }
  }

  isConceptCardConsumed(): boolean {
    return this.conceptCardManagerService.isConceptCardConsumed();
  }

  isSolutionButtonVisible(): boolean {
    return this.hintsAndSolutionManagerService.isSolutionViewable();
  }

  displayHintModal(index: number): void {
    this.activeHintIndex = index;
    let modalOrSheetRef =
      this.hintAndSolutionModalService.displayNewHintModal(index);
    if ('result' in modalOrSheetRef) {
      modalOrSheetRef.result.then(null, () => {
        this.activeHintIndex = null;
      });
    }
  }

  onClickSolutionButton(): void {
    this.solutionModalIsActive = true;

    if (this.hintsAndSolutionManagerService.isSolutionConsumed()) {
      this.displaySolutionModal();
    } else {
      const modalOrSheetRef =
        this.hintAndSolutionModalService.displayNewSolutionInterstitialModal();

      if ('result' in modalOrSheetRef) {
        modalOrSheetRef.result.then(
          () => {
            this.displaySolutionModal();
          },
          () => {
            this.solutionModalIsActive = false;
          }
        );
      } else if ('afterDismissed' in modalOrSheetRef) {
        modalOrSheetRef.afterDismissed().subscribe((result: string) => {
          if (result === 'confirm') {
            this.displaySolutionModal();
          } else {
            this.solutionModalIsActive = false;
          }
        });
      }
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
    let modalOrSheetRef =
      this.hintAndSolutionModalService.displayNewSolutionModal();
    if ('result' in modalOrSheetRef) {
      modalOrSheetRef.result.then(null, () => {
        this.solutionModalIsActive = false;
      });
    }
  }

  isHintConsumed(hintIndex: number): boolean {
    return this.hintsAndSolutionManagerService.isHintConsumed(hintIndex);
  }

  isSolutionConsumed(): boolean {
    return this.hintsAndSolutionManagerService.isSolutionConsumed();
  }
}
