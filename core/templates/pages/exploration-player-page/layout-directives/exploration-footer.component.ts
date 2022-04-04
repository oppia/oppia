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
 * @fileoverview Component for showing author/share footer
 * in exploration player.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QuestionPlayerStateService } from 'components/question-directives/question-player/services/question-player-state.service';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { ExplorationSummaryBackendApiService } from 'domain/summary/exploration-summary-backend-api.service';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { Subscription } from 'rxjs';
import { ContextService } from 'services/context.service';
import { LoggerService } from 'services/contextual/logger.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { LearnerViewInfoBackendApiService } from '../services/learner-view-info-backend-api.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { PlayerPositionService } from '../services/player-position.service';
import { LessonInformationCardModalComponent } from '../templates/lesson-information-card-modal.component';

@Component({
  selector: 'oppia-exploration-footer',
  templateUrl: './exploration-footer.component.html'
})
export class ExplorationFooterComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;
  iframed!: boolean;
  windowIsNarrow!: boolean;
  resizeSubscription!: Subscription;
  contributorNames: string[] = [];
  hintsAndSolutionsAreSupported: boolean = true;

  // Stores the number of checkpoints in an exploration.
  checkpointCount: number = 0;

  // Used to update the number of checkpoints completed
  // and decide the completed width of the progress bar.
  checkpointArray: number[] = [0];
  expInfo: LearnerExplorationSummaryBackendDict;
  completedWidth: number = 0;
  expStates: StateObjectsBackendDict;
  mostRecentlyReachedCheckpointStateName: string;
  completedCheckpoints: number = 0;
  isLastCheckpointReached: boolean = false;

  constructor(
    private contextService: ContextService,
    private explorationSummaryBackendApiService:
    ExplorationSummaryBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private ngbModal: NgbModal,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private questionPlayerStateService: QuestionPlayerStateService,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService,
    private loggerService: LoggerService,
    private roebas: ReadOnlyExplorationBackendApiService,
    private playerTranscriptService: PlayerTranscriptService,
    private explorationEngineService: ExplorationEngineService,
    private playerPositionService: PlayerPositionService,
  ) {}

  ngOnInit(): void {
    // TODO(#13494): Implement a different footer for practice-session-page.
    // This component is used at 'exploration-player-page' and
    // 'practice-session-page' with different usage at both places.
    // 'contextService.getExplorationId()' throws an error when this component
    // is used at 'practice-session-page' because the author profiles section
    // does not exist and the URL does not contain a valid explorationId.
    // Try-catch is for catching the error thrown from context-service so
    // that the component behaves properly at both the places.
    try {
      this.explorationId = this.contextService.getExplorationId();
      this.iframed = this.urlService.isIframed();
      this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
      this.resizeSubscription = this.windowDimensionsService.getResizeEvent()
        .subscribe(evt => {
          this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
        });

      if (!this.contextService.isInQuestionPlayerMode() ||
          this.contextService.getQuestionPlayerIsManuallySet()) {
        this.explorationSummaryBackendApiService
          .loadPublicAndPrivateExplorationSummariesAsync([this.explorationId])
          .then((responseObject) => {
            let summaries = responseObject.summaries;
            if (summaries.length > 0) {
              let contributorSummary = (
                summaries[0].human_readable_contributors_summary);
              this.contributorNames = Object.keys(contributorSummary).sort(
                (contributorUsername1, contributorUsername2) => {
                  let commitsOfContributor1 = contributorSummary[
                    contributorUsername1].num_commits;
                  let commitsOfContributor2 = contributorSummary[
                    contributorUsername2].num_commits;
                  return commitsOfContributor2 - commitsOfContributor1;
                }
              );
            }
          });
      }
      // Fetching the number of checkpoints.
      this.getCheckpointCount(this.explorationId);
    } catch (err) { }

    if (this.contextService.isInQuestionPlayerMode()) {
      this.questionPlayerStateService.resultsPageIsLoadedEventEmitter
        .subscribe((resultsLoaded: boolean) => {
          this.hintsAndSolutionsAreSupported = !resultsLoaded;
        });
    }
  }

  openInformationCardModal(): void {
    let modalRef = this.ngbModal.open(LessonInformationCardModalComponent, {
      windowClass: 'oppia-modal-lesson-information-card'
    });

    modalRef.componentInstance.checkpointCount = this.checkpointCount;

    this.roebas.loadLatestExplorationAsync(this.explorationId).then(
      response => {
        if (response.most_recently_reached_checkpoint_state_name) {
          this.mostRecentlyReachedCheckpointStateName = (
            response.most_recently_reached_checkpoint_state_name);
        }
      }
    );

    let checkpointIndexFromStateName = this.getCheckpointIndexFromStateName();
    this.completedCheckpoints = checkpointIndexFromStateName - 1;

    if (checkpointIndexFromStateName === this.checkpointCount) {
      var lastCheckpointCardStateName = (
        this.mostRecentlyReachedCheckpointStateName);
      this.isLastCheckpointReached = true;
    }

    this.completedWidth = (
      (100 / (this.checkpointCount)) * this.completedCheckpoints
    );

    if (this.explorationEngineService.getState().name !==
     lastCheckpointCardStateName && this.isLastCheckpointReached) {
      this.completedWidth = 100;
    }

    modalRef.componentInstance.completedWidth = this.completedWidth;
    modalRef.componentInstance.contributorNames = this.contributorNames;
    modalRef.componentInstance.expInfo = this.expInfo;

    modalRef.result.then(() => {}, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  showInformationCard(): void {
    let stringifiedExpIds = JSON.stringify(
      [this.explorationId]);
    let includePrivateExplorations = JSON.stringify(true);
    if (this.expInfo) {
      this.openInformationCardModal();
    } else {
      this.learnerViewInfoBackendApiService.fetchLearnerInfoAsync(
        stringifiedExpIds,
        includePrivateExplorations
      ).then((response) => {
        this.expInfo = response.summaries[0];
        this.openInformationCardModal();
      }, () => {
        this.loggerService.error(
          'Information card failed to load for exploration ' +
          this.explorationId);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  getCheckpointIndexFromStateName(): number {
    let checkpointIndex = 0;
    let numberOfCards = this.playerTranscriptService.getNumCards();
    for (let i = 0; i < numberOfCards; i++) {
      let stateName = this.playerTranscriptService.getCard(i).getStateName();
      let correspondingState = this.explorationEngineService.
        getStateFromStateName(stateName);
      if (correspondingState.cardIsCheckpoint) {
        checkpointIndex++;
        if (stateName === this.mostRecentlyReachedCheckpointStateName) {
          return checkpointIndex;
        }
      }
    }
  }

  async getCheckpointCount(explorationId: string): Promise<void> {
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(explorationId, null).then(
        (response: FetchExplorationBackendResponse) => {
          this.expStates = response.exploration.states;
          let count = 0;
          for (let [, value] of Object.entries(this.expStates)) {
            if (value.card_is_checkpoint) {
              count++;
            }
          }
          this.checkpointCount = count;
        });
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}

angular.module('oppia').directive('oppiaExplorationFooter',
  downgradeComponent({ component: ExplorationFooterComponent }));
