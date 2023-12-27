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

import { Component, ElementRef, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QuestionPlayerStateService } from 'components/question-directives/question-player/services/question-player-state.service';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
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
import { UserService } from 'services/user.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { LearnerViewInfoBackendApiService } from '../services/learner-view-info-backend-api.service';
import { PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { LessonInformationCardModalComponent } from 'pages/exploration-player-page/templates/lesson-information-card-modal.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ProgressReminderModalComponent } from 'pages/exploration-player-page/templates/progress-reminder-modal.component';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CheckpointCelebrationUtilityService } from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';

import './exploration-footer.component.css';
import { OppiaNoninteractiveSkillreviewConceptCardModalComponent } from 'rich_text_components/Skillreview/directives/oppia-noninteractive-skillreview-concept-card-modal.component';
import { ConceptCardManagerService } from '../services/concept-card-manager.service';
import { StateCard } from 'domain/state_card/state-card.model';


@Component({
  selector: 'oppia-exploration-footer',
  templateUrl: './exploration-footer.component.html',
  styleUrls: ['./exploration-footer.component.css']
})
export class ExplorationFooterComponent {
  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;
  iframed!: boolean;
  windowIsNarrow!: boolean;
  contributorNames: string[] = [];
  hintsAndSolutionsAreSupported: boolean = true;
  isVisible: boolean = true;

  // Stores the number of checkpoints in an exploration.
  checkpointCount: number = 0;

  // Used to update the number of checkpoints completed
  // and decide the completed width of the progress bar.
  checkpointArray: number[] = [0];
  expInfo: LearnerExplorationSummaryBackendDict;
  expStates: StateObjectsBackendDict;
  completedCheckpointsCount: number = 0;
  lastCheckpointWasCompleted: boolean = false;
  learnerHasViewedLessonInfoTooltip: boolean = false;
  userIsLoggedIn: boolean = false;
  footerIsInQuestionPlayerMode: boolean = false;

  conceptCardForStateExists: boolean = true;
  linkedSkillId: string | null = null;
  @ViewChild('lessonInfoButton') lessonInfoButton!: ElementRef;

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
    private playerTranscriptService: PlayerTranscriptService,
    private playerPositionService: PlayerPositionService,
    private explorationEngineService: ExplorationEngineService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private userService: UserService,
    private editableExplorationBackendApiService:
      EditableExplorationBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private checkpointCelebrationUtilityService:
      CheckpointCelebrationUtilityService,
    private conceptCardManagerService: ConceptCardManagerService
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
      this.userService.getUserInfoAsync().then((userInfo) => {
        this.userIsLoggedIn = userInfo.isLoggedIn();
      });
      this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
      this.directiveSubscriptions.add(
        this.windowDimensionsService.getResizeEvent().subscribe(evt => {
          this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
        })
      );
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
    } catch (err) { }

    if (this.contextService.isInQuestionPlayerMode()) {
      this.questionPlayerStateService.resultsPageIsLoadedEventEmitter
        .subscribe((resultsLoaded: boolean) => {
          this.hintsAndSolutionsAreSupported = !resultsLoaded;
        });
      this.footerIsInQuestionPlayerMode = true;
    } else if (this.explorationId) {
      // Fetching the number of checkpoints.
      this.getCheckpointCount();
      this.setLearnerHasViewedLessonInfoTooltip();
    }
    this.directiveSubscriptions.add(
      this.playerPositionService.onLoadedMostRecentCheckpoint.subscribe(() => {
        if (this.checkpointCount) {
          this.showProgressReminderModal();
        } else {
          this.getCheckpointCount().then(() => {
            this.showProgressReminderModal();
          });
        }
      })
    );
    this.directiveSubscriptions.add(
      this.checkpointCelebrationUtilityService
        .getOpenLessonInformationModalEmitter().subscribe(() => {
          this.showInformationCard();
        })
    );
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        (newCard: StateCard) => {
          this.conceptCardManagerService.reset(newCard);
        }
      )
    );
  }

  isConceptCardButtonVisible(): boolean {
    return this.conceptCardManagerService.isConceptCardViewable();
  }

  showProgressReminderModal(): void {
    const mostRecentlyReachedCheckpointIndex = (
      this.getMostRecentlyReachedCheckpointIndex()
    );

    this.completedCheckpointsCount = mostRecentlyReachedCheckpointIndex - 1;

    if (this.completedCheckpointsCount === 0) {
      this.explorationPlayerStateService.onShowProgressModal.emit();
      return;
    }

    if (this.expInfo) {
      this.openProgressReminderModal();
    } else {
      let stringifiedExpIds = JSON.stringify(
        [this.explorationId]);
      let includePrivateExplorations = JSON.stringify(true);

      this.learnerViewInfoBackendApiService.fetchLearnerInfoAsync(
        stringifiedExpIds,
        includePrivateExplorations
      ).then((response) => {
        this.expInfo = response.summaries[0];
        this.openProgressReminderModal();
      }, () => {
        this.loggerService.error(
          'Information card failed to load for exploration ' +
          this.explorationId);
      });
    }
  }

  isTooltipVisible(): boolean {
    return this.conceptCardManagerService.isConceptCardTooltipOpen();
  }

  openProgressReminderModal(): void {
    let modalRef = this.ngbModal.open(ProgressReminderModalComponent, {
      windowClass: 'oppia-progress-reminder-modal'
    });
    this.explorationPlayerStateService.onShowProgressModal.emit();

    let displayedCardIndex = (
      this.playerPositionService.getDisplayedCardIndex()
    );
    if (displayedCardIndex > 0) {
      let state = this.explorationEngineService.getState();
      let stateCard = this.explorationEngineService.getStateCardByName(
        state.name);
      if (stateCard.isTerminal()) {
        this.completedCheckpointsCount += 1;
      }
    }

    modalRef.componentInstance.checkpointCount = this.checkpointCount;
    modalRef.componentInstance.completedCheckpointsCount = (
      this.completedCheckpointsCount);
    modalRef.componentInstance.explorationTitle = this.expInfo.title;

    modalRef.result.then(() => {
      // This callback is used for when the learner chooses to restart
      // the exploration.
      this.editableExplorationBackendApiService.resetExplorationProgressAsync(
        this.explorationId).then(() => {
        this.windowRef.nativeWindow.location.reload();
      });
    }, () => {
      // This callback is used for when the learner chooses to resume
      // the exploration.
    });
  }

  openInformationCardModal(): void {
    let modalRef = this.ngbModal.open(LessonInformationCardModalComponent, {
      windowClass: 'oppia-modal-lesson-information-card'
    });

    modalRef.componentInstance.checkpointCount = this.checkpointCount;

    let mostRecentlyReachedCheckpointIndex = (
      this.getMostRecentlyReachedCheckpointIndex()
    );

    this.completedCheckpointsCount = mostRecentlyReachedCheckpointIndex - 1;

    let displayedCardIndex = (
      this.playerPositionService.getDisplayedCardIndex()
    );
    if (displayedCardIndex > 0) {
      let state = this.explorationEngineService.getState();
      let stateCard = this.explorationEngineService.getStateCardByName(
        state.name);
      if (stateCard.isTerminal()) {
        this.completedCheckpointsCount += 1;
      }
    }

    if (this.completedCheckpointsCount === this.checkpointCount) {
      this.lastCheckpointWasCompleted = true;
    }

    if (this.lastCheckpointWasCompleted) {
      this.completedCheckpointsCount = this.checkpointCount;
    }

    modalRef.componentInstance.completedCheckpointsCount = (
      this.completedCheckpointsCount);
    modalRef.componentInstance.contributorNames = this.contributorNames;
    modalRef.componentInstance.expInfo = this.expInfo;
    modalRef.componentInstance.userIsLoggedIn = this.userIsLoggedIn;

    modalRef.result.then(() => {}, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  openConceptCardModal(): void {
    const modalRef = this.ngbModal.open(
      OppiaNoninteractiveSkillreviewConceptCardModalComponent,
      {backdrop: true}
    );
    this.conceptCardManagerService.consumeConceptCard();
    modalRef.componentInstance.skillId = this.linkedSkillId;
  }

  showInformationCard(): void {
    let stringifiedExpIds = JSON.stringify(
      [this.explorationId]);
    let includePrivateExplorations = JSON.stringify(true);
    if (this.expInfo) {
      this.openInformationCardModal();

      // Update user has viewed lesson info modal once if
      // lesson info modal button is clicked.
      if (!this.learnerHasViewedLessonInfoTooltip) {
        this.learnerHasViewedLessonInfo();
      }
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

  showConceptCard(): void {
    let state = this.explorationEngineService.getState();
    this.linkedSkillId = state.linkedSkillId;
    if (this.linkedSkillId) {
      this.openConceptCardModal();
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  getMostRecentlyReachedCheckpointIndex(): number {
    let checkpointIndex = 0;
    let numberOfCards = this.playerTranscriptService.getNumCards();
    for (let i = 0; i < numberOfCards; i++) {
      let stateName = this.playerTranscriptService.getCard(i).getStateName();
      let correspondingState = this.explorationEngineService.
        getStateFromStateName(stateName);
      if (correspondingState.cardIsCheckpoint) {
        checkpointIndex++;
      }
    }
    return checkpointIndex;
  }

  async getCheckpointCount(): Promise<void> {
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(this.explorationId, null).then(
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

  async setLearnerHasViewedLessonInfoTooltip(): Promise<void> {
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(this.explorationId, null).then(
        (response: FetchExplorationBackendResponse) => {
          this.learnerHasViewedLessonInfoTooltip = (
            response.has_viewed_lesson_info_modal_once);
        });
  }

  shouldRenderLessonInfoTooltip(): boolean {
    const shouldRenderLessonInfoTooltip =
    !this.footerIsInQuestionPlayerMode &&
    !this.hasLearnerHasViewedLessonInfoTooltip() &&
    this.getMostRecentlyReachedCheckpointIndex() === 2;

    if (shouldRenderLessonInfoTooltip) {
      this.lessonInfoButton.nativeElement.focus();
    }
    return shouldRenderLessonInfoTooltip;
  }

  learnerHasViewedLessonInfo(): void {
    this.learnerHasViewedLessonInfoTooltip = true;
    if (this.userIsLoggedIn) {
      this.editableExplorationBackendApiService
        .recordLearnerHasViewedLessonInfoModalOnce();
    }
  }

  hasLearnerHasViewedLessonInfoTooltip(): boolean {
    return this.learnerHasViewedLessonInfoTooltip;
  }
}

angular.module('oppia').directive('oppiaExplorationFooter',
  downgradeComponent({ component: ExplorationFooterComponent }));
